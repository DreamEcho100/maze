/** @import { UserAgent, DateLike, User, SessionMetadata, DBSession, SessionValidationResult, ClientSession } from "#types.ts" */

import { authConfig } from "#init/index.js";
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
 * @param {object} [options]
 * * @param {any} [options.tx] - Optional transaction for database operations.
 */
// * @returns {Promise<{accessToken: string, refreshToken: string, refreshTokenHash: string, expiresAt: Date}>}
export async function createJWTAuth(props, options) {
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
	const { accessToken, refreshToken } = authConfig.jwt.createTokenPair({
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

	const result = await authConfig.providers.session.createOne({ data: sessionData }, options);

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

/** Get access token from cookies (for web platforms) */
export const getAccessTokenFromCookies = () => authConfig.cookies.get("jwt_access_token");
/** Get refresh token from cookies (for web platforms) */
export const getRefreshTokenFromCookies = () => authConfig.cookies.get("jwt_refresh_token");

/**
 * Set JWT token cookies (like setSessionTokenCookie)
 * @param {object} param
 * @param {string} param.accessToken
 * @param {string} param.refreshToken
 * @param {DateLike} param.accessExpiresAt
 * @param {DateLike} param.refreshExpiresAt
 */
export function setJWTTokenCookies(param) {
	// Set access token cookie (short-lived)
	authConfig.cookies.set("jwt_access_token", param.accessToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(param.accessExpiresAt),
		path: "/",
	});

	// Set refresh token cookie (long-lived, httpOnly)
	authConfig.cookies.set("jwt_refresh_token", param.refreshToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(param.refreshExpiresAt),
		path: "/",
	});
}

/** Delete JWT token cookies */
export function deleteJWTTokenCookies() {
	authConfig.cookies.set("jwt_access_token", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});

	authConfig.cookies.set("jwt_refresh_token", "", {
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
 * @param {object} options - Additional options
 * @param {any} [options.tx] - Optional transaction for database operations.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session.
 * @returns {Promise<SessionValidationResult>}
 *
 */
// * @returns {Promise<{user: User | null, session: any | null, method?: string, newTokens?: object}>}
export async function getCurrentJWTAuth(options) {
	const userAgent = options.userAgent ?? null;
	const isDeviceMobileOrTablet = userAgent && checkIsDeviceMobileOrTablet(userAgent);

	/** @type {string|null|undefined} */
	let accessToken = null;
	/** @type {string|null|undefined} */
	let refreshToken = null;

	if (isDeviceMobileOrTablet) {
		accessToken = getAuthorizationTokenFromHeaders();
	} else {
		accessToken = getAccessTokenFromCookies() ?? getAuthorizationTokenFromHeaders();
		refreshToken = getRefreshTokenFromCookies();
	}

	// ✅ Try access token first - NO DATABASE LOOKUP
	if (accessToken) {
		const result = validateJWTAccessToken(accessToken);
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
		deleteJWTTokenCookies();
		return { session: null, user: null };
	}

	const refreshResult = await refreshJWTTokens(
		{
			refreshToken,
			ipAddress: options.ipAddress ?? null,
			userAgent: options.userAgent ?? null,
		},
		options,
	);

	if (!refreshResult) {
		deleteJWTTokenCookies();
		return { session: null, user: null };
	}

	// Set new cookies for web
	setJWTTokenCookies({
		accessToken: refreshResult.metadata.accessToken,
		refreshToken: refreshResult.metadata.refreshToken,
		accessExpiresAt: refreshResult.metadata.accessExpiresAt,
		refreshExpiresAt: refreshResult.metadata.refreshExpiresAt,
	});

	return {
		user: refreshResult.user,
		session: refreshResult.session,
	};
}

/**
 * Validate JWT access token by checking from the `authConfig.providers.users.findOneById`
 * @param {string} token
 */
export function validateJWTAccessToken(token) {
	const result = authConfig.jwt.verifyAccessToken(token);

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
 */
export async function validateJWTRefreshToken(token) {
	const sessionId = getSessionId(token);

	const result = await authConfig.providers.session.findOneWithUser(sessionId);

	if (!result?.session || Date.now() >= new Date(result.session.expiresAt).getTime()) {
		// If the session is not found or expired, delete it
		await authConfig.providers.session.deleteOneById(sessionId);
		return null;
	}
	if (result.session.revokedAt) {
		// If the session is revoked, delete it
		await authConfig.providers.session.deleteOneById(sessionId);
		return null;
	}
	return result;
}

/**
 * Refresh JWT tokens -
 * @param {object} data
 * @param {string} data.refreshToken - The JWT refresh token to validate.
 * @param {string|null|undefined} data.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} data.userAgent - Optional user agent for the session.
 * @param {object} [options] - Additional options
 * @param {any} [options.tx] - Optional transaction for database operations.
 */
async function refreshJWTTokens(data, options) {
	const result = await validateJWTRefreshToken(data.refreshToken);
	if (!result) {
		return null;
	}

	// ✅ Revoke old refresh token
	const oldRefreshTokenHash = getSessionId(data.refreshToken);
	await authConfig.providers.session.revokeOneById(oldRefreshTokenHash);

	// TODO: Compare ip addresses and user agents

	const {
		user,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		session: { id, ...session },
	} = result;

	/** @type {SessionMetadata} */
	const metadata = {
		userId: user.id,
		ipAddress: data.ipAddress ?? null,
		userAgent: data.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt ?? null,
		metadata: session.metadata ?? null,
	};

	return createJWTAuth(
		{
			data: { user, metadata },
		},
		options,
	);
}
