/** @import { User, UserAgent, SessionMetadata, CookiesProvider, SessionsProvider, AuthStrategy, JWTProvider, DBSession, DateLike, AuthProvidersWithSessionAndJWTDefaults, HeadersProvider, SessionValidationResult } from "#types.ts" */

import { z } from "zod/v4-mini";

import { jwtProvider } from "#services/jwt.js";
import { checkIsDeviceMobileOrTablet } from "#utils/check-is-device-mobile-or-tablet.js";
import { dateLikeToNumber } from "#utils/dates.js";
import {
	deleteAuthTokenCookies,
	getAccessTokenFromCookies,
	getRefreshTokenFromCookies,
	setAuthTokenCookies,
} from "./cookies";
import { generateAccessToken } from "./generate-access-token";
import { generateRefreshToken } from "./generate-refresh-token";
import { getAuthorizationTokenFromHeaders } from "./headers";

const validateJWTAccessTokenSchema = z.object({
	exp: z.number(),
	iat: z.number(),
	payload: z.object({
		sessionId: z.string(),
		user: z.object({}),
		metadata: z.object({}),
	}),
});
const validateJWTRefreshTokenSchema = z.object({
	exp: z.number(),
	iat: z.number(),
	payload: z.object({ sessionId: z.string() }),
});
/**
 * Validate JWT access token by checking from the `JWTProvider['findOneById']`
 * @param {string} token
 * @param {object} ctx
 * @param {{ jwt?: { verifyAccessToken?: JWTProvider['verifyAccessToken'] } }} ctx.authProviders
 */
export function validateJWTAccessToken(token, ctx) {
	try {
		const verifyAccessToken =
			ctx.authProviders.jwt?.verifyAccessToken ?? jwtProvider.verifyAccessToken;
		const result = verifyAccessToken(token);
		if (process.env.NODE_ENV === "development") {
			console.log("___ validateJWTAccessToken result", result);
		}

		const validation = validateJWTAccessTokenSchema.safeParse(result);
		if (process.env.NODE_ENV === "development") {
			console.log("___ validateJWTAccessToken validation", validation);
		}
		return validation.success ? result : null;
	} catch (error) {
		console.error("JWT validation error:", error);
		return null;
	}
}

/**
 * Validate JWT refresh token
 * @param {string} token
 * @param {object} ctx
 * @param {{
 * 	sessions: {
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 	};
 * 	jwt?: { verifyRefreshToken?: JWTProvider['verifyRefreshToken'] };
 * }} ctx.authProviders
 */
export async function validateJWTRefreshToken(token, ctx) {
	try {
		// const sessionId = getSessionId(token);
		const verifyRefreshToken = /** @type {JWTProvider['verifyRefreshToken']} */ (
			ctx.authProviders.jwt?.verifyRefreshToken ?? jwtProvider.verifyRefreshToken
		);
		const verifyRefreshTokenResult = verifyRefreshToken(token);
		console.log("___ validateJWTRefreshToken verifyRefreshTokenResult", verifyRefreshTokenResult);

		const validation = validateJWTRefreshTokenSchema.safeParse(verifyRefreshTokenResult);
		console.log("___ validateJWTRefreshToken validation", validation);

		if (!validation.success) {
			return null;
		}

		const sessionId = validation.data.payload.sessionId;

		const result = await ctx.authProviders.sessions.findOneWithUser(sessionId);

		if (!result?.session || Date.now() >= new Date(result.session.expiresAt).getTime()) {
			// If the session is not found or expired, delete it
			await ctx.authProviders.sessions.deleteOneById(sessionId);
			return null;
		}
		if (result.session.revokedAt) {
			// If the session is revoked, delete it
			await ctx.authProviders.sessions.deleteOneById(sessionId);
			return null;
		}

		return {
			...result,
			tokenInfo: validation.data,
		};
	} catch (error) {
		console.error("JWT refresh token validation error:", error);
		return null;
	}
}

/**
 *
 * Token is valid, check if it needs refresh
 *
 * @param {object} ctx
 * @param {NonNullable<Awaited<ReturnType<typeof validateJWTRefreshToken>>>} ctx.validationResult
 * @returns {boolean}
 */
function shouldRefreshAuthTokens(ctx) {
	const lastCheckpointAt = dateLikeToNumber(
		ctx.validationResult.session.lastExtendedAt ?? ctx.validationResult.session.createdAt,
	);
	const expiresAt = dateLikeToNumber(ctx.validationResult.session.expiresAt);
	const halfwayPoint = (expiresAt - lastCheckpointAt) * 0.5 + lastCheckpointAt;
	const isFresh = Date.now() < halfwayPoint;

	return !isFresh;
}

/**
 * Refresh Token parser and validator
 * @param {object} ctx
 * @param {NonNullable<Awaited<ReturnType<typeof validateJWTRefreshToken>>>} ctx.validatedJWTRefreshTokenResult
 * @param {string|null|undefined} ctx.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} ctx.userAgent - Optional user agent for the session.
 * @param {any} ctx.tx
 * @param {AuthStrategy} ctx.authStrategy
 * @param {() => string} [ctx.generateRandomId] - Function to create a unique ID synchronously, if available.
 * @param {{
 * 	sessions: {
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		createOne: SessionsProvider['createOne'];
 * 	};
 * 	jwt?: {
 * 		createTokenPair?: JWTProvider['createTokenPair'];
 * 	};
 * }} ctx.authProviders
 */
async function refreshAuthTokens(ctx) {
	const {
		tokenInfo,
		user,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		session: { id, ...session },
	} = ctx.validatedJWTRefreshTokenResult;

	// ✅ Revoke old refresh token
	await ctx.authProviders.sessions.revokeOneById(tokenInfo.payload.sessionId);

	// TODO: Compare ip addresses and user agents

	/** @type {SessionMetadata} */
	const metadata = {
		userId: user.id,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt ?? null,
		metadata: session.metadata ?? null,
	};

	return generateRefreshToken({
		user,
		metadata,
		tx: ctx.tx,
		authProviders: {
			sessions: {
				createOne: ctx.authProviders.sessions.createOne,
			},
			jwt: {
				createTokenPair: ctx.authProviders.jwt?.createTokenPair,
			},
		},
		generateRandomId: ctx.generateRandomId,
		authStrategy: ctx.authStrategy,
	});
}

/**
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @param {object} props
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {any} props.tx
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults} props.authProviders
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession(props) {
	const userAgent = props.userAgent ?? null;
	const isDeviceMobileOrTablet = userAgent && checkIsDeviceMobileOrTablet(userAgent);

	switch (props.authStrategy) {
		case "jwt": {
			const refreshToken = getRefreshTokenFromCookies(props.cookies);
			const accessToken =
				getAccessTokenFromCookies(props.cookies) ?? getAuthorizationTokenFromHeaders(props.headers);

			// Try access token first (if valid and not expired)
			if (accessToken) {
				const result = validateJWTAccessToken(accessToken, {
					authProviders: {
						jwt: {
							verifyAccessToken: props.authProviders.jwt?.verifyAccessToken,
						},
					},
				});
				if (result?.payload.metadata) {
					const { exp, iat, payload } = result;

					return {
						user: payload.user,
						session: {
							...payload.metadata,
							expiresAt: new Date(exp * 1000), // Convert to Date
							createdAt: new Date(iat * 1000), // Convert to Date
							authStrategy: props.authStrategy,
							id: payload.sessionId,
						},
					};
				}
			}

			// If no refresh token or on mobile/tablet, we can't refresh
			if (!refreshToken) {
				// deleteJWTTokenCookies(options.cookies);
				return { session: null, user: null };
			}

			const validatedJWTRefreshTokenResult = await validateJWTRefreshToken(refreshToken, {
				authProviders: {
					sessions: {
						findOneWithUser: props.authProviders.sessions.findOneWithUser,
						deleteOneById: props.authProviders.sessions.deleteOneById,
					},
					jwt: {
						verifyRefreshToken: props.authProviders.jwt?.verifyRefreshToken,
					},
				},
			});

			if (!validatedJWTRefreshTokenResult) {
				if (!isDeviceMobileOrTablet) {
					deleteAuthTokenCookies({
						authStrategy: props.authStrategy,
						cookies: props.cookies,
					});
				}
				return { session: null, user: null };
			}

			if (
				!isDeviceMobileOrTablet &&
				shouldRefreshAuthTokens({ validationResult: validatedJWTRefreshTokenResult })
			) {
				const refreshResult = await refreshAuthTokens({
					authStrategy: props.authStrategy,
					validatedJWTRefreshTokenResult,
					ipAddress: props.ipAddress ?? null,
					userAgent: props.userAgent ?? null,
					tx: props.tx,
					authProviders: {
						sessions: {
							revokeOneById: props.authProviders.sessions.revokeOneById,
							createOne: props.authProviders.sessions.createOne,
						},
						jwt: {
							createTokenPair: props.authProviders.jwt?.createTokenPair,
						},
					},
				});

				const generateAccessTokenResult = generateAccessToken(refreshResult, {
					authStrategy: props.authStrategy,
					authProviders: {
						jwt: {
							createAccessToken: props.authProviders.jwt?.createAccessToken,
						},
					},
				});

				// Set new cookies for web
				setAuthTokenCookies({
					accessToken: generateAccessTokenResult.accessToken,
					refreshToken: generateAccessTokenResult.refreshToken,
					accessTokenExpiresAt: generateAccessTokenResult.accessTokenExpiresAt,
					refreshTokenExpiresAt: generateAccessTokenResult.refreshTokenExpiresAt,
					cookies: props.cookies,
					authStrategy: props.authStrategy,
				});

				return {
					user: refreshResult.user,
					session: refreshResult.session,
				};
			}

			return {
				user: validatedJWTRefreshTokenResult.user,
				session: validatedJWTRefreshTokenResult.session,
			};
		}

		case "session": {
			const sessionToken =
				getAuthorizationTokenFromHeaders(props.headers) ??
				getRefreshTokenFromCookies(props.cookies);
			if (!sessionToken) {
				return { session: null, user: null };
			}

			const validatedSessionTokenResult = await validateJWTRefreshToken(sessionToken, {
				authProviders: {
					sessions: {
						findOneWithUser: props.authProviders.sessions.findOneWithUser,
						deleteOneById: props.authProviders.sessions.deleteOneById,
					},
					jwt: {
						verifyRefreshToken: props.authProviders.jwt?.verifyRefreshToken,
					},
				},
			});

			if (!validatedSessionTokenResult) {
				if (!isDeviceMobileOrTablet) {
					deleteAuthTokenCookies({
						authStrategy: props.authStrategy,
						cookies: props.cookies,
					});
				}
				return { session: null, user: null };
			}

			if (
				!isDeviceMobileOrTablet &&
				shouldRefreshAuthTokens({ validationResult: validatedSessionTokenResult })
			) {
				const sessionTokenResult = await refreshAuthTokens({
					authStrategy: props.authStrategy,
					validatedJWTRefreshTokenResult: validatedSessionTokenResult,
					ipAddress: props.ipAddress ?? null,
					userAgent: props.userAgent ?? null,
					tx: props.tx,
					authProviders: {
						sessions: {
							revokeOneById: props.authProviders.sessions.revokeOneById,
							createOne: props.authProviders.sessions.createOne,
						},
						jwt: {
							createTokenPair: props.authProviders.jwt?.createTokenPair,
						},
					},
				});
				// For web, we set the session token cookie
				setAuthTokenCookies({
					authStrategy: "session",
					refreshToken: sessionTokenResult.token,
					refreshTokenExpiresAt: sessionTokenResult.expiresAt,
					cookies: props.cookies,
				});
				return {
					user: sessionTokenResult.user,
					session: sessionTokenResult.session,
				};
			}

			return {
				user: validatedSessionTokenResult.user,
				session: validatedSessionTokenResult.session,
			};
		}
		default:
			throw new Error(`Unsupported auth strategy: ${props.authStrategy}`);
	}
}
