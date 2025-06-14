/** @import { UserAgent, DateLike, User, SessionMetadata, DBSession, SessionValidationResult, ClientSession, CookiesProvider, HeadersProvider, SessionsProvider, JWTProvider } from "#types.ts" */

import { jwtProvider } from "#services/jwt.js";
import { getAuthorizationTokenFromHeaders } from "#utils/get-authorization-token-from-headers.js";
import { getSessionId } from "#utils/get-session-id.js";
import { isDeviceMobileOrTablet as checkIsDeviceMobileOrTablet } from "#utils/is-device-mobile-or-tablet.js";

// JWT-specific constants
const ACCESS_TOKEN_EXPIRES_DURATION = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRES_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * @typedef {{
 * 	accessToken: string;
 * 	refreshToken: string;
 * 	accessTokenHash: string;
 * 	refreshTokenHash: string;
 * 	accessExpiresAt: Date;
 * 	refreshExpiresAt: Date;
 * 	user: User;
 * 	twoFactorVerifiedAt: any;
 * 	createdAt: Date;
 * }} RefreshJWTTokensResult
 */

/**
 * Creates JWT authentication (mirrors createSession)
 * @param {object} props
 * @param {object} props.data
 * @param {User} props.data.user
 * @param {SessionMetadata} props.data.metadata - Additional metadata to include in the JWT.
 * @param {{
 * 	tx?: any;
 * 	authProviders: {
 * 		sessions: { createOne: SessionsProvider['createOne'] };
 * 		jwt?: { createTokenPair?: JWTProvider['createTokenPair'] }
 * 	}
 * }} ctx
 */
// * @returns {Promise<{accessToken: string, refreshToken: string, refreshTokenHash: string, expiresAt: Date}>}
export async function createJWTAuth(props, ctx) {
	const { user } = props.data;

	const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRES_DURATION);
	const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DURATION);

	const metadata = {
		...props.data.metadata, // Include any additional metadata
		createdAt: new Date(),
		sessionType: /** @type {const} */ ("jwt_refresh_token"),
		lastUsedAt: new Date(),
		expiresAt: refreshExpiresAt, // ✅ 30 days, NOT 15 minutes
	};

	// Create JWT token pair

	const createTokenPair = /** @type {JWTProvider['createTokenPair']} */ (
		ctx.authProviders.jwt?.createTokenPair ?? jwtProvider.createTokenPair
	);
	const { accessToken, refreshToken } = createTokenPair({
		data: {
			user,
			metadata,
			// customClaims: { twoFactorVerified: !!flags.twoFactorVerifiedAt },
		},
	});
	// Hash both tokens for storage
	const accessTokenHash = getSessionId(accessToken);
	const refreshTokenHash = getSessionId(refreshToken);

	// ✅ Store ONLY refresh token in database (for revocation capability)
	/** @type {DBSession} */
	const sessionData = {
		...metadata, // Include any additional metadata
		id: refreshTokenHash, // ✅ Store refresh token hash, NOT access token
		revokedAt: null,
	};

	const result = await ctx.authProviders.sessions.createOne({ data: sessionData }, ctx);

	if (!result) {
		throw new Error("Failed to create JWT refresh token session");
	}

	const {
		user: _user,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		session: { id, ...session },
	} = result;

	/** @type {ClientSession} */
	const clientSession = {
		...session,
		token: refreshToken, // Store the actual refresh token in the client session
	};

	return {
		metadata: {
			accessToken,
			refreshToken,
			accessTokenHash,
			refreshTokenHash,
			accessExpiresAt,
			refreshExpiresAt,
		},
		user: _user,
		session: clientSession,
	};
}

/**
 * Get access token from cookies (for web platforms)
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export const getAccessTokenFromCookies = (cookies) => cookies.get("jwt_access_token");
/**
 * Get refresh token from cookies (for web platforms)
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export const getRefreshTokenFromCookies = (cookies) => cookies.get("jwt_refresh_token");

/**
 * Set JWT token cookies (like setSessionTokenCookie)
 * @param {object} param
 * @param {string} param.accessToken
 * @param {string} param.refreshToken
 * @param {DateLike} param.accessExpiresAt
 * @param {DateLike} param.refreshExpiresAt
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export function setJWTTokenCookies(param, cookies) {
	// Set access token cookie (short-lived)
	cookies.set("jwt_access_token", param.accessToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(param.accessExpiresAt),
		path: "/",
	});

	// Set refresh token cookie (long-lived, httpOnly)
	cookies.set("jwt_refresh_token", param.refreshToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(param.refreshExpiresAt),
		path: "/",
	});
}

/**
 * Delete JWT token cookies
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export function deleteJWTTokenCookies(cookies) {
	cookies.set("jwt_access_token", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});

	cookies.set("jwt_refresh_token", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});
}

/**
 * Get current JWT authentication (mirrors getCurrentSession)
 *
 * @param {object} ctx - Additional options
 * @param {CookiesProvider} ctx.cookies - Optional cookies provider to access session token cookies.
 * @param {HeadersProvider} ctx.headers - Optional headers provider to access authorization headers.
 * @param {string|null|undefined} ctx.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} ctx.userAgent - Optional user agent for the session.
 * @param {any} ctx.tx
 * @param {{
 * 	sessions: {
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		createOne: SessionsProvider['createOne'];
 * 	};
 * 	jwt: {
 * 		verifyAccessToken?: JWTProvider['verifyAccessToken'];
 * 		createTokenPair?: JWTProvider['createTokenPair'];
 * 	};
 * }} ctx.authProviders
 * @returns {Promise<SessionValidationResult>}
 *
 */
// * @returns {Promise<{user: User | null, session: any | null, method?: string, newTokens?: object}>}
export async function getCurrentJWTAuth(ctx) {
	const userAgent = ctx.userAgent ?? null;
	const isDeviceMobileOrTablet = userAgent && checkIsDeviceMobileOrTablet(userAgent);
	/** @type {string|null|undefined} */
	let accessToken = null;
	/** @type {string|null|undefined} */
	let refreshToken = null;

	if (isDeviceMobileOrTablet) {
		accessToken = getAuthorizationTokenFromHeaders(ctx.headers);
	} else {
		accessToken =
			getAccessTokenFromCookies(ctx.cookies) ?? getAuthorizationTokenFromHeaders(ctx.headers);
		refreshToken = getRefreshTokenFromCookies(ctx.cookies);
	}

	// ✅ Try access token first - NO DATABASE LOOKUP
	if (accessToken) {
		const result = validateJWTAccessToken(accessToken, {
			authProviders: { jwt: { verifyAccessToken: ctx.authProviders.jwt.verifyAccessToken } },
		});
		if (result?.payload.metadata) {
			const { exp, iat, payload } = result;

			return {
				user: payload.user,
				session: {
					...payload.metadata,
					token: accessToken, // Include the access token in the session
					expiresAt: new Date(exp * 1000), // Convert to Date
					createdAt: new Date(iat * 1000), // Convert to Date
					sessionType: /** @type {const} */ ("jwt_refresh_token"),
				},
			};
		}
	}

	// If no refresh token or on mobile/tablet, we can't refresh
	if (!refreshToken || isDeviceMobileOrTablet) {
		// deleteJWTTokenCookies(options.cookies);
		return { session: null, user: null };
	}

	const refreshResult = await refreshJWTTokens({
		refreshToken,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
		tx: ctx.tx,
		authProviders: {
			sessions: {
				revokeOneById: ctx.authProviders.sessions.revokeOneById,
				deleteOneById: ctx.authProviders.sessions.deleteOneById,
				findOneWithUser: ctx.authProviders.sessions.findOneWithUser,
				createOne: ctx.authProviders.sessions.createOne,
			},
			jwt: { createTokenPair: ctx.authProviders.jwt.createTokenPair },
		},
	});

	if (!refreshResult) {
		deleteJWTTokenCookies(ctx.cookies);
		return { session: null, user: null };
	}

	// Set new cookies for web
	setJWTTokenCookies(
		{
			accessToken: refreshResult.metadata.accessToken,
			refreshToken: refreshResult.metadata.refreshToken,
			accessExpiresAt: refreshResult.metadata.accessExpiresAt,
			refreshExpiresAt: refreshResult.metadata.refreshExpiresAt,
		},
		ctx.cookies,
	);

	return {
		user: refreshResult.user,
		session: refreshResult.session,
	};
}

/**
 * Validate JWT access token by checking from the `JWTProvider['findOneById']`
 * @param {string} token
 * @param {object} ctx
 * @param {{ jwt?: { verifyAccessToken?: JWTProvider['verifyAccessToken'] } }} ctx.authProviders
 */
export function validateJWTAccessToken(token, ctx) {
	const verifyAccessToken = /** @type {JWTProvider['verifyAccessToken']} */ (
		ctx.authProviders.jwt?.verifyAccessToken ?? jwtProvider.verifyAccessToken
	);
	const result = verifyAccessToken(token);

	if (
		typeof result === "object" &&
		result !== null &&
		"exp" in result &&
		typeof result.exp === "number" &&
		"iat" in result &&
		typeof result.iat === "number" &&
		"payload" in result &&
		typeof result.payload === "object" &&
		"user" in result.payload &&
		typeof result.payload.user === "object" &&
		"metadata" in result.payload &&
		typeof result.payload.metadata === "object"
	) {
		return result;
	}

	return null;
}

/**
 * Validate JWT refresh token
 * @param {string} token
 * @param {object} ctx
 * @param {{
 * 	sessions: {
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 	}
 * }} ctx.authProviders
 */
export async function validateJWTRefreshToken(token, ctx) {
	const sessionId = getSessionId(token);

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
	return result;
}

/**
 * Refresh JWT tokens -
 * @param {object} ctx
 * @param {string} ctx.refreshToken - The JWT refresh token to validate.
 * @param {string|null|undefined} ctx.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} ctx.userAgent - Optional user agent for the session.
 * @param {any} [ctx.tx]
 * @param {{
 * 	sessions: {
 * 		revokeOneById: SessionsProvider['revokeOneById'];
 * 		findOneWithUser: SessionsProvider['findOneWithUser'];
 * 		deleteOneById: SessionsProvider['deleteOneById'];
 * 		createOne: SessionsProvider['createOne'];
 * 	};
 * 	jwt?: {
 * 		createTokenPair?: JWTProvider['createTokenPair'];
 * 	};
 * }} ctx.authProviders
 */
async function refreshJWTTokens(ctx) {
	const result = await validateJWTRefreshToken(ctx.refreshToken, {
		authProviders: {
			sessions: {
				findOneWithUser: ctx.authProviders.sessions.findOneWithUser,
				deleteOneById: ctx.authProviders.sessions.deleteOneById,
			},
		},
	});
	if (!result) {
		return null;
	}

	// ✅ Revoke old refresh token
	const oldRefreshTokenHash = getSessionId(ctx.refreshToken);
	await ctx.authProviders.sessions.revokeOneById(oldRefreshTokenHash);

	// TODO: Compare ip addresses and user agents

	const {
		user,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		session: { id, ...session },
	} = result;

	/** @type {SessionMetadata} */
	const metadata = {
		userId: user.id,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt ?? null,
		metadata: session.metadata ?? null,
	};

	return createJWTAuth(
		{
			data: { user, metadata },
		},
		{
			tx: ctx.tx,
			authProviders: {
				sessions: {
					createOne: ctx.authProviders.sessions.createOne,
				},
				jwt: {
					createTokenPair: ctx.authProviders.jwt?.createTokenPair,
				},
			},
		},
	);
}
