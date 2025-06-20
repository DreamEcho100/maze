/** @import { User, UserAgent, SessionMetadata, CookiesProvider, SessionsProvider, AuthStrategy, JWTProvider, DBSession, DateLike, AuthProvidersWithGetSessionProviders, HeadersProvider, SessionValidationResult, AuthProvidersWithGetSessionUtils, DBSessionOutput, ValidSessionResultMetadata } from "#types.ts" */

import { z } from "zod/v4-mini";

import { jwtProvider } from "#services/jwt.js";
import { checkIsDeviceMobileOrTablet } from "#utils/check-is-device-mobile-or-tablet.js";
import { dateLikeToNumber } from "#utils/dates.js";
import { REFRESH_TOKEN_EXPIRES_DURATION } from "./constants";
import {
	deleteAuthTokenCookies,
	getAccessTokenFromCookies,
	getRefreshTokenFromCookies,
	setAuthTokenCookies,
} from "./cookies";
import { generateAccessToken } from "./generate-access-token";
import { generateRefreshToken } from "./generate-refresh-token";
import { getAuthorizationTokenFromHeaders, getRefreshTokenFromHeaders } from "./headers";

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

// export interface UserAgent {
// 	isBot: boolean;
// 	ua: string;
// 	browser: {
// 		name?: string;
// 		version?: string;
// 		major?: string;
// 	};
// 	device: {
// 		model?: string;
// 		type?: string;
// 		vendor?: string;
// 	};
// 	engine: {
// 		name?: string;
// 		version?: string;
// 	};
// 	os: {
// 		name?: string;
// 		version?: string;
// 	};
// 	cpu: {
// 		architecture?: string;
// 	};
// }
/**
 *
 * @param {UserAgent|null|undefined} userAgent1
 * @param {UserAgent|null|undefined} userAgent2
 * @returns
 */
function compareUserAgents(userAgent1, userAgent2) {
	if (!userAgent1 || !userAgent2) return false;

	return (
		userAgent1.isBot === userAgent2.isBot &&
		userAgent1.ua === userAgent2.ua &&
		userAgent1.browser.name === userAgent2.browser.name &&
		userAgent1.device.model === userAgent2.device.model &&
		userAgent1.device.type === userAgent2.device.type &&
		userAgent1.device.vendor === userAgent2.device.vendor &&
		userAgent1.engine.name === userAgent2.engine.name &&
		userAgent1.os.name === userAgent2.os.name
	);
}

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

		const validation = validateJWTAccessTokenSchema.safeParse(result);
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
 * @param {string|null|undefined} [ctx.ipAddress] - Optional IP address for the session.
 * @param {UserAgent|null|undefined} [ctx.userAgent] - Optional user agent
 */
export async function validateJWTRefreshToken(token, ctx) {
	try {
		const verifyRefreshToken = /** @type {JWTProvider['verifyRefreshToken']} */ (
			ctx.authProviders.jwt?.verifyRefreshToken ?? jwtProvider.verifyRefreshToken
		);
		const verifyRefreshTokenResult = verifyRefreshToken(token);

		const validation = validateJWTRefreshTokenSchema.safeParse(verifyRefreshTokenResult);

		if (!validation.success) {
			return null;
		}

		const sessionId = validation.data.payload.sessionId;

		const result = await ctx.authProviders.sessions.findOneWithUser(sessionId);

		if (
			!result?.session ||
			Date.now() >= new Date(result.session.expiresAt).getTime() ||
			((result.session.ipAddress || ctx.ipAddress) && result.session.ipAddress !== ctx.ipAddress) ||
			((result.session.userAgent || ctx.userAgent) &&
				!compareUserAgents(ctx.userAgent, result.session.userAgent))
		) {
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
function getShouldExtendRefreshAuthTokens(ctx) {
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
 *		createRefreshToken?: JWTProvider['createRefreshToken'],
 * 	};
 * }} ctx.authProviders
 */
async function regenerateRefreshAuthTokens(ctx) {
	const {
		tokenInfo,
		user,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		session: { id, ...session },
	} = ctx.validatedJWTRefreshTokenResult;

	// ✅ Revoke old refresh token
	await ctx.authProviders.sessions.revokeOneById(tokenInfo.payload.sessionId);

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
				createRefreshToken: ctx.authProviders.jwt?.createRefreshToken,
			},
		},
		generateRandomId: ctx.generateRandomId,
		authStrategy: ctx.authStrategy,
	});
}

/**
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @param {Omit<AuthProvidersWithGetSessionUtils, 'ipAddress' | 'userAgent'> & {
 * 	authProviders: AuthProvidersWithGetSessionProviders
 * 	ipAddress: string|null|undefined;
 * 	userAgent: UserAgent|null|undefined;
 * 	canMutateCookies: boolean;
 * }} props
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession(props) {
	const userAgent = props.userAgent;
	const ipAddress = props.ipAddress;
	const isDeviceMobileOrTablet = !!(userAgent && checkIsDeviceMobileOrTablet(userAgent));

	let refreshToken;
	switch (props.authStrategy) {
		case "jwt": {
			refreshToken =
				getRefreshTokenFromCookies(props.cookies) ?? getRefreshTokenFromHeaders(props.headers);
			const accessToken =
				getAccessTokenFromCookies(props.cookies) ?? getAuthorizationTokenFromHeaders(props.headers);

			// Try access token first (if valid and not expired)
			if (refreshToken && accessToken) {
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
						metadata: null,
					};
				}
			}
			break;
		}

		case "session": {
			refreshToken =
				getAuthorizationTokenFromHeaders(props.headers) ??
				getRefreshTokenFromCookies(props.cookies);
			break;
		}

		default: {
			throw new Error(`Unsupported auth strategy: ${props.authStrategy}`);
		}
	}

	const result = await resolveAuthSession({
		authStrategy: props.authStrategy,
		refreshToken,
		shouldExtendRefreshAuthTokensOnNeed: !isDeviceMobileOrTablet,
		canMutateCookies: props.canMutateCookies,
		ipAddress,
		userAgent,
		tx: props.tx,
		authProviders: {
			sessions: {
				findOneWithUser: props.authProviders.sessions.findOneWithUser,
				deleteOneById: props.authProviders.sessions.deleteOneById,
				extendOneExpirationDate: props.authProviders.sessions.extendOneExpirationDate,
				revokeOneById: props.authProviders.sessions.revokeOneById,
				createOne: props.authProviders.sessions.createOne,
			},
			jwt: {
				verifyRefreshToken: props.authProviders.jwt?.verifyRefreshToken,
			},
		},
		cookies: props.cookies,
	});

	if (!result.session) {
		if (props.canMutateCookies) {
			// Delete cookies for web
			// it's an optional props for now as it case issues with next js server
			deleteAuthTokenCookies({
				authStrategy: props.authStrategy,
				cookies: props.cookies,
			});
		}
		return {
			user: null,
			session: null,
			metadata: null,
		};
	}

	return result;
}

/**
 * 🔄 Resolves authentication session to a valid, fresh state.
 *
 * The Swiss Army knife of session management! This function:
 * 1. 🔍 **Validates** your token (structure, expiration, IP, device fingerprinting)
 * 2. 🤔 **Decides** whether to extend (fast) or regenerate (secure)
 * 3. 🚀 **Returns** a fresh session ready for action
 *
 * ## Smart Decision Making:
 * - **Fresh token** (< 50% lifetime used) → Extend expiration only (1 DB query ⚡)
 * - **Stale token** (≥ 50% lifetime used) → Full regeneration (2 DB queries 🔒)
 * - **Force refresh** (`shouldExtendRefreshAuthTokensOnNeed: true`) → Always regenerate on need
 *
 * ## Strategy Differences:
 * - **JWT**: Returns refresh + access tokens with expiration metadata
 * - **Session**: Returns refresh token only (simpler, but still secure)
 *
 * ## Security Features:
 * 🛡️ IP validation, 📱 device fingerprinting, 🧹 automatic cleanup, 🔄 token rotation
 *
 * @param {object} props - Configuration and dependencies
 * @param {AuthStrategy} props.authStrategy - Authentication strategy ("jwt" or "session")
 * @param {string|null|undefined} props.refreshToken - The refresh/session token to validate and potentially refresh
 * @param {string|null|undefined} props.ipAddress - Client IP address for security validation
 * @param {UserAgent|null|undefined} props.userAgent - Parsed user agent for device fingerprinting
 * @param {boolean} [props.shouldExtendRefreshAuthTokensOnNeed] - Whether to allow token extension/regeneration based on freshness. Set to `true` to allow token lifecycle management.
 * @param {boolean} [props.canMutateCookies=true] - Whether to set authentication cookies. Set to false for mobile/API-only usage.
 * @param {any} [props.tx] - Optional database transaction for atomic operations
 * @param {CookiesProvider} props.cookies - Cookie management interface for setting authentication cookies
 * @param {{
 * 	sessions: {
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 		extendOneExpirationDate: SessionsProvider['extendOneExpirationDate'];
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		createOne: SessionsProvider['createOne'];
 * 	};
 * 	jwt?: {
 * 			verifyRefreshToken?: JWTProvider['verifyRefreshToken'];
 * 			createRefreshToken?: JWTProvider['createRefreshToken'];
 * 			createAccessToken?: JWTProvider['createAccessToken'];
 * 	};
 * }} props.authProviders - Provider interfaces for external dependencies
 *
 * @returns {Promise<SessionValidationResult>} Resolved session state
 *
 * @throws {Error} When session extension fails due to database errors
 * @throws {Error} When unsupported authentication strategy is provided
 *
 *
 * @example
 * ```js
 * // Basic usage - let it decide what's best
 * const session = await resolveAuthSession({
 *   authStrategy: "jwt",
 *   refreshToken: token,
 *   shouldExtendRefreshAuthTokensOnNeed: true, // 🔄 Force it on need!
 *   authProviders: { sessions, jwt },
 *   cookies
 * });
 * ```
 *
 * @example
 * ```js
 * // Force refresh (perfect for /refresh endpoints)
 * const session = await resolveAuthSession({
 *   authStrategy: "session",
 *   refreshToken: token,
 *   shouldExtendRefreshAuthTokensOnNeed: false,
 *   authProviders: { sessions },
 *   cookies
 * });
 * ```
 */
export async function resolveAuthSession(props) {
	if (!props.refreshToken) {
		return { session: null, user: null, metadata: null };
	}

	const validatedRefreshToken = await validateJWTRefreshToken(props.refreshToken, {
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
	if (!validatedRefreshToken) {
		return { session: null, user: null, metadata: null };
	}

	/** @type {{ user: User; session: DBSessionOutput; token: string; expiresAt: Date; }} */
	let newRefreshTokenDetails;
	const shouldExtendRefreshAuthTokens =
		!!props.shouldExtendRefreshAuthTokensOnNeed &&
		getShouldExtendRefreshAuthTokens({
			validationResult: validatedRefreshToken,
		});

	if (shouldExtendRefreshAuthTokens) {
		newRefreshTokenDetails = await regenerateRefreshAuthTokens({
			authStrategy: props.authStrategy,
			validatedJWTRefreshTokenResult: validatedRefreshToken,
			ipAddress: props.ipAddress ?? null,
			userAgent: props.userAgent ?? null,
			tx: props.tx,
			authProviders: {
				sessions: {
					revokeOneById: props.authProviders.sessions.revokeOneById,
					createOne: props.authProviders.sessions.createOne,
				},
				jwt: {
					createRefreshToken: props.authProviders.jwt?.createRefreshToken,
				},
			},
		});
	} else {
		const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DURATION);
		const updatedSession = await props.authProviders.sessions.extendOneExpirationDate({
			data: { expiresAt: refreshTokenExpiresAt },
			where: { id: validatedRefreshToken.session.id },
		});
		if (!updatedSession) {
			throw new Error(
				`Failed to extend session ${validatedRefreshToken.session.id}: session may have been deleted or database error occurred`,
			);
		}
		newRefreshTokenDetails = {
			user: validatedRefreshToken.user,
			session: updatedSession,
			expiresAt: refreshTokenExpiresAt,
			token: props.refreshToken,
		};
	}

	switch (props.authStrategy) {
		case "jwt": {
			const generateAccessTokenResult = generateAccessToken(newRefreshTokenDetails, {
				authStrategy: props.authStrategy,
				authProviders: {
					jwt: {
						createAccessToken: props.authProviders.jwt?.createAccessToken,
					},
				},
			});

			if (props.canMutateCookies) {
				setAuthTokenCookies({
					accessToken: generateAccessTokenResult.accessToken,
					refreshToken: generateAccessTokenResult.refreshToken,
					accessTokenExpiresAt: generateAccessTokenResult.accessTokenExpiresAt,
					refreshTokenExpiresAt: generateAccessTokenResult.refreshTokenExpiresAt,
					cookies: props.cookies,
					authStrategy: props.authStrategy,
				});
			}

			return {
				user: newRefreshTokenDetails.user,
				session: newRefreshTokenDetails.session,
				metadata: {
					authStrategy: props.authStrategy,
					accessToken: generateAccessTokenResult.accessToken,
					accessTokenExpiresAt: generateAccessTokenResult.accessTokenExpiresAt.getTime(),
					refreshToken: generateAccessTokenResult.refreshToken,
					refreshTokenExpiresAt: generateAccessTokenResult.refreshTokenExpiresAt.getTime(),
				},
			};
		}
		case "session": {
			if (props.canMutateCookies) {
				setAuthTokenCookies({
					authStrategy: props.authStrategy,
					refreshToken: newRefreshTokenDetails.token,
					refreshTokenExpiresAt: newRefreshTokenDetails.expiresAt,
					cookies: props.cookies,
				});
			}

			return {
				user: newRefreshTokenDetails.user,
				session: newRefreshTokenDetails.session,
				metadata: {
					authStrategy: props.authStrategy,
					token: newRefreshTokenDetails.token,
					expiresAt: newRefreshTokenDetails.expiresAt.getTime(),
				},
			};
		}

		default: {
			throw new Error(`Unsupported auth strategy: ${props.authStrategy}`);
		}
	}
}
