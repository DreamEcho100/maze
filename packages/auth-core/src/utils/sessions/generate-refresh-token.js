/** @import { User, UserAgent, SessionMetadata, SessionsProvider, AuthStrategy, JWTProvider, DBSession, DateLike } from "@de100/auth-shared/types" */

import { REFRESH_TOKEN_EXPIRES_DURATION } from "@de100/auth-shared/constants";
import { jwtProvider } from "#services/jwt.js";
import { generateRandomId } from "#utils/generate-random-id.js";
import { getTokenBytes } from "#utils/get-token-bytes.js";

/**
 * Strategy-aware session creation (replaces createSession)
 * Note: This generates JWT refresh tokens for BOTH strategies
 * Session strategy: Uses this as the main session token
 * JWT strategy: Uses this as refresh token + generates access token separately
 * @param {object} props
 * @param {User} props.user
 * @param {SessionMetadata} props.metadata - Optional IP address for the session
 * @param {() => string} [props.generateRandomId] - Function to create a unique ID synchronously, if available.
 * @param {AuthStrategy} props.authStrategy
 * @param {{
 * 	sessions: { createOne: SessionsProvider['createOne'] };
 *	jwt?: {
 * 		createRefreshToken?: JWTProvider['createRefreshToken'];
 * 		createAccessToken?: JWTProvider['createAccessToken'];
 * 	}
 * }} props.authProviders
 */
export async function generateRefreshToken(props) {
	const createRefreshToken = /** @type {JWTProvider['createRefreshToken']} */ (
		props.authProviders.jwt?.createRefreshToken ?? jwtProvider.createRefreshToken
	);

	const createId = /** @type {() => string} */ (props.generateRandomId ?? generateRandomId);
	const sessionId = createId();

	// const accessTokenExpiresAt = Date.now() + ACCESS_TOKEN_EXPIRES_DURATION;
	const refreshTokenExpiresAt = Date.now() + REFRESH_TOKEN_EXPIRES_DURATION;
	// Create refresh token with the generated tokenId
	const refreshToken = createRefreshToken(
		{
			data: {
				sessionId,
				user: props.user,
				metadata: props.metadata,
			},
		},
		{
			// "30d"
			expiresIn: refreshTokenExpiresAt, // ?? 1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
			// audience: options.audience,
			// issuer: options.issuer,
		},
	);

	const tokenHash = getTokenBytes(refreshToken);

	const { ipAddress, userAgent, ...metadata } = props.metadata;

	/** @type {DBSession} */
	const sessionData = {
		id: sessionId, // ✅ Separate session ID
		tokenHash: tokenHash, // ✅ Uint8Array token hash
		userId: props.user.id,
		expiresAt: refreshTokenExpiresAt,
		twoFactorVerifiedAt: props.metadata.twoFactorVerifiedAt,
		createdAt: new Date(),
		authStrategy: props.authStrategy,
		ipAddress: ipAddress ?? null,
		userAgent: userAgent ?? null,
		lastUsedAt: new Date(),
		revokedAt: null, // Not revoked initially
		metadata: Object.keys(metadata).length > 0 ? metadata : null,
	};
	const result = await props.authProviders.sessions.createOne({
		data: sessionData,
	});
	if (!result) {
		throw new Error("Failed to create JWT refresh token session");
	}
	const { user: _user, session } = result;

	return {
		user: _user,
		session,
		token: refreshToken, // Use the refresh token as the session token
		expiresAt: new Date(refreshTokenExpiresAt), // Convert to Date
	};
}

/**
 * @typedef {Awaited<ReturnType<typeof generateRefreshToken>>} CreateRefreshTokenResult
 */
