/**
 * @import { AuthStrategy, JWTProvider } from "#types.ts"
 * @import { CreateRefreshTokenResult } from "./generate-refresh-token.js";
 */

import { jwtProvider } from "#services/jwt.js";
import { ACCESS_TOKEN_EXPIRES_DURATION } from "./constants.js";

/**
 * @param {CreateRefreshTokenResult} result
 * @param {object} ctx
 * @param {AuthStrategy} ctx.authStrategy
 * @param {{
 *	jwt?: {
 * 		createAccessToken?: JWTProvider['createAccessToken'];
 * 	}
 * }} ctx.authProviders
 */
export function generateAccessToken(result, ctx) {
	const {
		user,
		session,
		token: refreshToken,
		expiresAt: refreshTokenExpiresAt,
	} = result;
	const createAccessToken = /** @type {JWTProvider['createRefreshToken']} */ (
		ctx.authProviders.jwt?.createAccessToken ?? jwtProvider.createAccessToken
	);
	const accessTokenExpiresAt = new Date(
		Date.now() + ACCESS_TOKEN_EXPIRES_DURATION,
	);
	const accessToken = createAccessToken(
		{
			data: {
				sessionId: session.id,
				user,
				metadata: {
					userId: user.id,
					ipAddress: session.ipAddress ?? null,
					userAgent: session.userAgent ?? null,
					twoFactorVerifiedAt: session.twoFactorVerifiedAt ?? null,
					metadata: session.metadata ?? null,
				},
			},
		},
		{
			expiresIn: ACCESS_TOKEN_EXPIRES_DURATION, // 15 minutes in milliseconds
			// audience: options.audience,
			// issuer: options.issuer,
		},
	);

	return {
		accessToken,
		accessTokenExpiresAt,
		refreshToken: refreshToken,
		refreshTokenExpiresAt: new Date(refreshTokenExpiresAt),
	};
}
