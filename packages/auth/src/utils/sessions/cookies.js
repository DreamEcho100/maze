/** @import { AuthStrategy, CookiesProvider, DateLike } from "#types.ts"; */

const accessTokenCookieName = "access_token";
const refreshTokenCookieName = "refresh_token";

/**
 * Delete JWT token cookies
 * @param {object} props
 * @param {AuthStrategy} props.authStrategy
 * @param {CookiesProvider} props.cookies
 */
export function deleteAuthTokenCookies(props) {
	props.cookies.set(refreshTokenCookieName, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});

	if (props.authStrategy === "jwt") {
		props.cookies.set(accessTokenCookieName, "", {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 0,
			path: "/",
		});
	}
}
/**
 * Set JWT token cookies (like setSessionTokenCookie)
 * @param {{
 * 	cookies: CookiesProvider;
 * } & ({
 * 	authStrategy: "session";
 * 	refreshToken: string;
 *  refreshTokenExpiresAt: DateLike;
 * }|{
 * 	authStrategy: "jwt";
 * 	refreshToken: string;
 *  refreshTokenExpiresAt: DateLike;
 * 	accessToken: string;
 * 	accessTokenExpiresAt: DateLike;
 * })} props
 */
export function setAuthTokenCookies(props) {
	// Set refresh token cookie (long-lived, httpOnly)
	props.cookies.set(refreshTokenCookieName, props.refreshToken, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: new Date(props.refreshTokenExpiresAt),
		path: "/",
	});

	if (props.authStrategy === "jwt") {
		// Set access token cookie (short-lived)
		props.cookies.set(accessTokenCookieName, props.accessToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			expires: new Date(props.accessTokenExpiresAt),
			path: "/",
		});
	}
}

/**
 * Get access token from cookies (for web platforms)
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export const getAccessTokenFromCookies = (cookies) => cookies.get(accessTokenCookieName);
/**
 * Get refresh token from cookies (for web platforms)
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export const getRefreshTokenFromCookies = (cookies) => cookies.get(refreshTokenCookieName);
