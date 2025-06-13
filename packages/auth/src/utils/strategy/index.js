/** @import { User, UserAgent, SessionValidationResult, SessionMetadata, CookiesProvider, HeadersProvider, SessionsProvider, AuthStrategy } from "#types.ts" */

// import { authConfig } from "#init/index.js";
// import { dateLikeToISOString } from "#utils/dates.js";
import { isDeviceMobileOrTablet } from "#utils/is-device-mobile-or-tablet.js";
import {
	createJWTAuth,
	deleteJWTTokenCookies,
	getCurrentJWTAuth,
	setJWTTokenCookies,
} from "./jwt.js";
import {
	createSession,
	deleteSessionTokenCookie,
	generateSessionToken,
	getCurrentSession,
	setSessionTokenCookie,
} from "./sessions.js";

/**
 * Strategy-aware session creation (replaces createSession)
 * @param {object} props
 * @param {object} props.data
 * @param {string} [props.data.token] - ClientSession token OR will create JWT
 * @param {User} props.data.user
 * @param {SessionMetadata} props.data.metadata - Optional IP address for the session
 * @param {object} ctx
 * @param {any} [ctx.tx]
 * @param {AuthStrategy} ctx.authStrategy
 * @param {{ sessions: { createOne: SessionsProvider['createOne'] }}} ctx.authProviders
 */
export async function createAuthSession(props, ctx) {
	switch (ctx?.authStrategy) {
		case "jwt": {
			// For JWT, we don't use the token from props, we generate our own
			const data = await createJWTAuth(
				{
					data: {
						metadata: props.data.metadata,
						user: props.data.user,
					},
				},
				{
					tx: ctx.tx,
					authProviders: { sessions: { createOne: ctx.authProviders.sessions.createOne } },
				},
			);

			return /** @type {const} */ ({
				strategy: "jwt",
				data,
			});
		}

		case "session": {
			/** @type {string} */
			const token = props.data.token ?? generateSessionToken();
			const { session, user } = await createSession(
				{
					...props,
					data: {
						token,
						flags: {
							twoFactorVerifiedAt: props.data.metadata.twoFactorVerifiedAt ?? null,
						},
						ipAddress: props.data.metadata.ipAddress ?? null,
						userAgent: props.data.metadata.userAgent ?? null,
						userId: props.data.user.id,
					},
				},
				{
					tx: ctx.tx,
					authProviders: { sessions: { createOne: ctx.authProviders.sessions.createOne } },
				},
			);

			return /** @type {const} */ ({
				strategy: "session",
				data: { user, session },
				token: token,
				session: session,
				expiresAt: session.expiresAt,
			});
		}

		default:
			throw new Error(`Unsupported auth strategy: ${ctx?.authStrategy}`);
	}
}

/**
 * Strategy-aware current session/auth retrieval (replaces getCurrentSession)
 * @param {object} props
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {object} ctx
 * @param {AuthStrategy} ctx.authStrategy
 * @param {{
 * 	sessions: {
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 *		extendOneExpirationDate: SessionsProvider['extendOneExpirationDate'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<SessionValidationResult>}
 */
export async function getCurrentAuthSession(props, ctx) {
	switch (ctx.authStrategy) {
		case "jwt":
			return await getCurrentJWTAuth(props);

		case "session":
			return await getCurrentSession(props.cookies, { providers: ctx.authProviders });

		default:
			throw new Error(`Unsupported auth strategy: ${ctx.authStrategy}`);
	}
}

/**
 * Strategy-aware token generation (replaces generateSessionToken)
 * @param {{ data: { user: User; metadata: SessionMetadata } }} props
 * @param {object} ctx
 * @param {AuthStrategy} ctx.authStrategy
 * @returns {string}
 */
export function generateAuthSessionToken(props, ctx) {
	switch (ctx.authStrategy) {
		case "jwt":
			return authConfig.jwt.createRefreshToken(props);

		case "session":
			return generateSessionToken();

		default:
			throw new Error(`Unsupported auth strategy: ${ctx.authStrategy}`);
	}
}

/**
 * @typedef {Awaited<ReturnType<typeof createAuthSession>>} CreateAuthSessionResult
 *
 * @typedef {Exclude<CreateAuthSessionResult, { strategy: "jwt" }>} SessionAuthResult
 * @typedef {Exclude<CreateAuthSessionResult, { strategy: "session" }>} JwtAuth
 */

/**
 * Strategy-aware token setting (replaces setSessionTokenCookie)
 * @param {Awaited<ReturnType<typeof createAuthSession>>} param - ClientSession data from createAuthSession
 * @param {object} ctx
 * @param {CookiesProvider} ctx.cookies - The cookies provider to access the session token.
 * @param {UserAgent|null|undefined} ctx.userAgent - User agent for the session
 * @param {AuthStrategy} ctx.authStrategy - The authentication strategy being used
 */
export function setOneAuthSessionToken(param, ctx) {
	switch (param.strategy) {
		case "jwt": {
			if (ctx.userAgent && isDeviceMobileOrTablet(ctx.userAgent)) {
				return /** @type {const} */ ({
					strategy: "jwt",
					platform: "mobile/tablet",
					accessToken: param.data.metadata.accessToken,
					accessExpiresAt: param.data.metadata.accessExpiresAt,
					refreshToken: param.data.metadata.refreshToken,
					refreshExpiresAt: param.data.metadata.refreshExpiresAt,
				});
			}

			// For web, we set the session token cookie
			setJWTTokenCookies(
				{
					accessToken: param.data.metadata.accessToken,
					accessExpiresAt: param.data.metadata.accessExpiresAt,
					refreshToken: param.data.metadata.refreshToken,
					refreshExpiresAt: param.data.metadata.refreshExpiresAt,
				},
				ctx.cookies,
			);
			return /** @type {const} */ ({
				strategy: "jwt",
				platform: "web",
				// accessToken: param.data.metadata.accessToken,
				accessExpiresAt: param.data.metadata.accessExpiresAt,
				refreshExpiresAt: param.data.metadata.refreshExpiresAt,
			});
		}

		case "session": {
			if (ctx.userAgent && isDeviceMobileOrTablet(ctx.userAgent)) {
				return /** @type {const} */ ({
					strategy: "session",
					platform: "mobile/tablet",
					sessionToken: param.token,
					expiresAt: param.expiresAt,
				});
			}

			setSessionTokenCookie(
				{ token: param.token, expiresAt: param.session.expiresAt },
				ctx.cookies,
			);
			return /** @type {const} */ ({
				strategy: "session",
				platform: "web",
				expiresAt: param.expiresAt,
			});
		}

		default:
			throw new Error(`Unsupported auth strategy: ${ctx.authStrategy}`);
	}
}

/**
 * Strategy-aware token clearing (replaces deleteSessionTokenCookie)
 *
 * @param {{ where: { sessionId: string } }} props
 * @param {object} ctx
 * @param {boolean} [ctx.shouldDeleteCookie]
 * @param {CookiesProvider} ctx.cookies
 * @param {AuthStrategy} ctx.authStrategy
 * @param {{
 * 	sessions: {
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 	};
 * }} ctx.authProviders
 */
export async function invalidateOneAuthSessionToken(props, ctx) {
	const { shouldDeleteCookie: deleteCookie = true } = ctx;

	switch (ctx.authStrategy) {
		case "jwt":
			if (deleteCookie) deleteJWTTokenCookies(ctx.cookies);
			return await ctx.authProviders.sessions.revokeOneById(props.where.sessionId);

		case "session":
			if (deleteCookie) deleteSessionTokenCookie(ctx.cookies);
			return await ctx.authProviders.sessions.deleteOneById(props.where.sessionId);

		default:
			throw new Error(`Unsupported auth strategy: ${ctx.authStrategy}`);
	}
}

/**
 * Strategy-aware session invalidation (replaces authConfig.providers.session.invalidateAllByUserId)
 * @param {object} props
 * @param {object} props.where
 * @param {string} props.where.userId
 * @param {object} options
 * @param {any} options.tx - Optional transaction object for database operations
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @returns {Promise<void>}
 */
export async function invalidateAllUserAuth(props, options) {
	switch (authConfig.strategy) {
		case "jwt":
			await authConfig.providers.session.revokeAllByUserId(props, options);
			return deleteJWTTokenCookies(options.cookies);

		case "session":
			await authConfig.providers.session.deleteAllByUserId(props, options);
			return deleteSessionTokenCookie(options.cookies);

		default:
			throw new Error(`Unsupported auth strategy: ${authConfig.strategy}`);
	}
}

// /**
//  * Middleware to handle session token validation and cookie expiration extension.
//  *
//  * @returns {Promise<SessionValidationResult>} The result of session validation.
//  */
// export async function handleSessionMiddleware() {
// 	const result = await getCurrentAuthSession();

// 	if (!result.session) {
// 		return { session: null, user: null };
// 	}

// 	if (result.session.sessionType === "jwt_access_token") {
// 		// For JWT, we don't set cookies, just return the data
// 		return result;
// 	}

// 	// For session authConfig.strategy, we set the cookie
// 	// Set the session token cookie with the new expiration date
// 	const token = getTokenFromCookies();
// 	if (!token) {
// 		return { session: null, user: null };
// 	}
// 	setOneAuthSessionToken({
// 		strategy: "session",
// 		session: result.session,
// 		token: token,
// 		expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
// 	});

// 	return result;
// }
