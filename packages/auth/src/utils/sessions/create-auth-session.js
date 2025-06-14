/**
 * @import { User, UserAgent, SessionMetadata, CookiesProvider, SessionsProvider, AuthStrategy, JWTProvider } from "#types.ts"
 * @import { CreateRefreshTokenResult } from "./generate-refresh-token.js";
 */

import { checkIsDeviceMobileOrTablet } from "#utils/check-is-device-mobile-or-tablet.js";
import { setAuthTokenCookies } from "./cookies";
import { generateAccessToken } from "./generate-access-token.js";
import { generateRefreshToken } from "./generate-refresh-token";

/**
 * Strategy-aware session creation (replaces createSession)
 * @param {object} props
 * @param {User} props.user
 * @param {SessionMetadata} props.metadata - Optional IP address for the session
 * @param {any} [props.tx]
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {UserAgent|null|undefined} props.userAgent - User agent for the session
 * @param {() => string} [props.generateRandomId] - Function to create a unique ID synchronously, if available.
 * @param {AuthStrategy} props.authStrategy
 * @param {{
 * 	sessions: { createOne: SessionsProvider['createOne'] };
 *	jwt?: {
 * 		createTokenPair?: JWTProvider['createTokenPair'];
 * 		createRefreshToken?: JWTProvider['createRefreshToken'];
 * 		createAccessToken?: JWTProvider['createAccessToken'];
 * 	}
 * }} props.authProviders
 * @returns {Promise<{
 * 	strategy: "session";
 *  data: Omit<CreateRefreshTokenResult, "session"> & {
 * 		session: Omit<CreateRefreshTokenResult['session'], "strategy"> & {
 * 			strategy: "session";
 * 		}
 * 	}
 * }|{
 * 	strategy: "jwt";
 *  data: Omit<Omit<CreateRefreshTokenResult, "expiresAt"|"token">, "session"> & {
 * 		session: Omit<CreateRefreshTokenResult['session'], "strategy"> & {
 * 			strategy: "jwt";
 * 			accessToken: string;
 * 			accessTokenExpiresAt: Date;
 * 			refreshToken: string;
 * 			refreshTokenExpiresAt: Date;
 * 		}
 * 	}
 * }>}
 */
export async function createOneAuthSession(props) {
	const result = await generateRefreshToken({
		user: props.user,
		metadata: props.metadata,
		tx: props.tx,
		authProviders: {
			sessions: {
				createOne: props.authProviders.sessions.createOne,
			},
			jwt: {
				createRefreshToken: props.authProviders.jwt?.createRefreshToken,
				createAccessToken: props.authProviders.jwt?.createAccessToken,
			},
		},
		generateRandomId: props.generateRandomId,
		authStrategy: props.authStrategy,
	});
	switch (props.authStrategy) {
		case "session": {
			// For session authStrategy, we return the session and user data
			const data = /** @type {const} */ ({
				strategy: props.authStrategy,
				data: /** @type {typeof result & { session: { strategy: "session"; } }} */ (result),
			});

			if (props.userAgent && !checkIsDeviceMobileOrTablet(props.userAgent)) {
				setAuthTokenCookies({
					refreshToken: result.token,
					refreshTokenExpiresAt: result.session.expiresAt,
					authStrategy: props.authStrategy,
					cookies: props.cookies,
				});
			}

			return data;
		}

		case "jwt": {
			const { user, session } = result;
			const generateAccessTokenResult = generateAccessToken(result, {
				authStrategy: props.authStrategy,
				authProviders: {
					jwt: {
						createAccessToken: props.authProviders.jwt?.createAccessToken,
					},
				},
			});

			const data = /** @type {const} */ ({
				strategy: props.authStrategy,
				data: {
					user,
					session: {
						...session,
						strategy: props.authStrategy,
						...generateAccessTokenResult,
					},
				},
			});

			if (props.userAgent && !checkIsDeviceMobileOrTablet(props.userAgent)) {
				setAuthTokenCookies({
					...generateAccessTokenResult,
					authStrategy: props.authStrategy,
					cookies: props.cookies,
				});
			}

			return data;
		}

		default:
			throw new Error(`Unsupported auth strategy: ${props.authStrategy}`);
	}
}
