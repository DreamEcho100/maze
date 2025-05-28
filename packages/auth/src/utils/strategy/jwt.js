/** @import { DateLike, User, JWTAuthResult, Session } from "#types.ts" */

import { headersProvider, jwtProvider, sessionProvider, usersProvider } from "#providers/index.js";
import { getSessionId } from "#utils/get-session-id.js";

// JWT-specific constants
const ACCESS_TOKEN_EXPIRES_DURATION = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRES_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Creates JWT authentication (mirrors createSession)
 * @param {object} props
 * @param {object} props.data
 * @param {string} props.data.userId
 * @param {object} props.data.flags
 * @param {DateLike | null} [props.data.flags.twoFactorVerifiedAt]
 * @param {object} [options]
 * @returns {Promise<{accessToken: string, refreshToken: string, refreshTokenHash: string, expiresAt: Date}>}
 */
export async function createJWTAuth(props, options) {
	const { userId, flags = {} } = props.data;

	// Create JWT token pair
	const { accessToken, refreshToken } = jwtProvider.createTokenPair({
		data: {
			userId,
			customClaims: {
				twoFactorVerified: !!flags.twoFactorVerifiedAt,
			},
		},
	});

	// Hash refresh token for storage (same pattern as sessions)
	const refreshTokenHash = getSessionId(refreshToken);
	const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DURATION);
	/** @type {Session} */
	const session = {
		id: refreshTokenHash,
		userId: props.data.userId,
		expiresAt: refreshExpiresAt, // ✅ Use refresh token expiration, not access token
		twoFactorVerifiedAt: props.data.flags.twoFactorVerifiedAt,
		createdAt: new Date(),
		sessionType: "jwt_refresh_token",
		ipAddress: headersProvider.get("x-forwarded-for") ?? headersProvider.get("x-real-ip") ?? null,
		userAgent: headersProvider.get("user-agent") ?? null,
		lastUsedAt: new Date(),
		revokedAt: null, // Not revoked initially
	};

	await sessionProvider.createOne({ data: session }, options);

	return {
		accessToken,
		refreshToken,
		refreshTokenHash,
		expiresAt: refreshExpiresAt,
	};
}

/**
 * Get current JWT authentication (mirrors getCurrentSession)
 * @returns {Promise<{user: User | null, session: any | null, method?: string, newTokens?: object}>}
 */
export async function getCurrentJWTAuth() {
	// Try access token first (fastest path)
	const accessToken = jwtProvider.getAccessToken();
	if (accessToken) {
		const payload = jwtProvider.verifyToken(accessToken);
		if (
			payload &&
			typeof payload === "object" &&
			"userId" in payload &&
			typeof payload.userId === "string"
		) {
			const user = await usersProvider.findOneById(payload.userId);

			if (!user) {
				return { session: null, user: null }; // ✅ Good
			}

			return {
				user,
				session: {
					id: "jwt-access-session",
					userId: user.id,
					expiresAt: new Date(payload.exp * 1000),
					twoFactorVerifiedAt: payload.twoFactorVerified ? new Date() : null,
					createdAt: new Date(payload.iat * 1000),
				},
				method: "jwt-access",
			};
		}
	}

	// Access token expired/invalid, try refresh token
	const refreshToken = jwtProvider.getRefreshToken();

	if (!refreshToken) {
		return { session: null, user: null };
	}

	// Hash the refresh token to check if it's revoked (tokens are stored as hashes)
	const refreshTokenHash = getSessionId(refreshToken);

	// Check if the refresh token is revoked
	const isRevoked = await sessionProvider.isOneRevokedById({ where: { id: refreshTokenHash } });
	if (isRevoked) {
		return { session: null, user: null };
	}

	const result = await refreshJWTTokens(refreshToken);
	if (!result) {
		return { session: null, user: null };
	}

	return {
		user: result.user,
		session: {
			id: result.refreshTokenHash,
			userId: result.user.id,
			expiresAt: result.refreshExpiresAt,
			twoFactorVerifiedAt: result.twoFactorVerifiedAt,
			createdAt: result.createdAt,
		},
		method: "jwt_refresh_token",
		newTokens: {
			accessToken: result.accessToken,
			refreshToken: result.refreshToken,
			accessExpiresAt: result.accessExpiresAt,
			refreshExpiresAt: result.refreshExpiresAt,
		},
	};
}

/**
 * Validate JWT token (mirrors validateSessionToken)
 * @param {string} token
 * @returns {Promise<{user: User | null, session: any | null}>}
 */
export async function validateJWTToken(token) {
	const payload = jwtProvider.verifyToken(token);
	if (
		!payload ||
		typeof payload !== "object" ||
		!("userId" in payload) ||
		typeof payload.userId !== "string"
	) {
		return { session: null, user: null };
	}

	const user = await usersProvider.findOneById(payload.userId);
	if (!user) {
		return { session: null, user: null };
	}

	return {
		user,
		session: {
			id: "jwt-session",
			userId: user.id,
			expiresAt: new Date(payload.exp * 1000),
			twoFactorVerifiedAt: payload.twoFactorVerified ? new Date() : null,
			createdAt: new Date(payload.iat * 1000),
		},
	};
}

/**
 * @typedef {{
 * 	accessToken: string;
 * 	refreshToken: string;
 * 	refreshTokenHash: string;
 * 	accessExpiresAt: Date;
 * 	refreshExpiresAt: Date;
 * 	user: User;
 * 	twoFactorVerifiedAt: any;
 * 	createdAt: Date;
 * }} RefreshJWTTokensResult
 */

/**
 * Refresh JWT tokens -
 * @param {string} refreshToken
 * @returns {Promise<RefreshJWTTokensResult | null>}
 */
async function refreshJWTTokens(refreshToken) {
	const refreshTokenHash = getSessionId(refreshToken);

	const result = await sessionProvider.findOneWithUser(refreshTokenHash);
	if (!result) {
		return null;
	}

	const { session: refreshTokenRecord, user } = result;

	// Check expiration
	if (new Date() >= new Date(refreshTokenRecord.expiresAt)) {
		await sessionProvider.revokeOneById(refreshTokenRecord.id);
		return null;
	}

	// Create new token pair
	const { accessToken, refreshToken: newRefreshToken } = jwtProvider.createTokenPair({
		data: { userId: user.id },
	});

	// Token rotation
	const newRefreshTokenHash = getSessionId(newRefreshToken);
	const newRefreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DURATION);

	await Promise.all([
		sessionProvider.revokeOneById(refreshTokenRecord.id),
		sessionProvider.createOne({
			data: {
				// tokenHash: newRefreshTokenHash,
				id: newRefreshTokenHash,
				userId: user.id,
				expiresAt: newRefreshExpiresAt,
				metadata: refreshTokenRecord.metadata,
				createdAt: new Date(),
				sessionType: "jwt_refresh_token",
				ipAddress:
					headersProvider.get("x-forwarded-for") ?? headersProvider.get("x-real-ip") ?? null,
				userAgent: headersProvider.get("user-agent") ?? null,
				lastUsedAt: new Date(),
				revokedAt: null, // Not revoked initially
				twoFactorVerifiedAt: refreshTokenRecord.metadata?.twoFactorVerifiedAt ?? null,
			},
		}),
	]);

	return {
		accessToken,
		refreshToken: newRefreshToken,
		refreshTokenHash: newRefreshTokenHash,
		accessExpiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRES_DURATION),
		refreshExpiresAt: newRefreshExpiresAt,
		user,
		twoFactorVerifiedAt: refreshTokenRecord.metadata?.twoFactorVerifiedAt ?? null,
		createdAt: new Date(),
	};
}
