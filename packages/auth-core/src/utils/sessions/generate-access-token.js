/**
 * @import { AuthStrategy, JWTProvider } from "@de100/auth-shared/types"
 * @import { CreateRefreshTokenResult } from "./generate-refresh-token.js";
 */

import { ACCESS_TOKEN_EXPIRES_DURATION } from "@de100/auth-shared/constants";
import { jwtProvider } from "#services/jwt.js";

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
