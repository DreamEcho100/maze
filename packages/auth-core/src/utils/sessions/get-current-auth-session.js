/** @import { UserAgent, JWTProvider, AuthProvidersWithGetSessionProviders, SessionValidationResult, AuthProvidersWithGetSessionUtils } from "#types.ts" */

import { z } from "zod/v4-mini";

import { jwtProvider } from "#services/jwt.js";
import { checkIsDeviceMobileOrTablet } from "#utils/check-is-device-mobile-or-tablet.js";
import {
	deleteAuthTokenCookies,
	getAccessTokenFromCookies,
	getRefreshTokenFromCookies,
} from "./cookies.js";
import {
	getAuthorizationTokenFromHeaders,
	getRefreshTokenFromHeaders,
} from "./headers.js";
import { resolveAuthSession } from "./resolve-auth-session.js";

const validateJWTAccessTokenSchema = z.object({
	exp: z.number(),
	iat: z.number(),
	payload: z.object({
		sessionId: z.string(),
		user: z.object({}),
		metadata: z.object({}),
	}),
});

/**
 * Validate JWT access token by checking from the `JWTProvider['findOneById']`
 * @param {string} token
 * @param {object} ctx
 * @param {{ jwt?: { verifyAccessToken?: JWTProvider['verifyAccessToken'] } }} ctx.authProviders
 */
function validateJWTAccessToken(token, ctx) {
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
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @param {Omit<AuthProvidersWithGetSessionUtils, 'ipAddress' | 'userAgent' | 'session' | 'user' | 'sessionMetadata' | 'tx'> & {
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
	const isDeviceMobileOrTablet = !!(
		userAgent && checkIsDeviceMobileOrTablet(userAgent)
	);

	let refreshToken;
	switch (props.authStrategy) {
		case "jwt": {
			refreshToken =
				getRefreshTokenFromCookies(props.cookies) ??
				getRefreshTokenFromHeaders(props.headers);
			const accessToken =
				getAccessTokenFromCookies(props.cookies) ??
				getAuthorizationTokenFromHeaders(props.headers);

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
		cookiesOptions: props.cookiesOptions,
		shouldExtendRefreshAuthTokensOnNeed: !isDeviceMobileOrTablet,
		canMutateCookies: props.canMutateCookies,
		ipAddress,
		userAgent,
		// tx: props.tx,
		authProviders: {
			sessions: {
				findOneWithUser: props.authProviders.sessions.findOneWithUser,
				deleteOneById: props.authProviders.sessions.deleteOneById,
				extendOneExpirationDate:
					props.authProviders.sessions.extendOneExpirationDate,
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
				cookiesOptions: props.cookiesOptions,
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
