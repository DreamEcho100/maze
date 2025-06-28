/** @import { AuthStrategy, CookiesProvider, DateLike, DynamicCookiesOptions } from "#types.ts"; */

import { dateLikeToDate } from "#utils/dates.js";

const accessTokenCookieName = "access_token";
const refreshTokenCookieName = "refresh_token";

const defaultRefreshTokenOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	path: "/",
};
export const defaultAccessTokenOptions = {
	httpOnly: true,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	path: "/",
};

/**
 * Delete JWT token cookies
 * @param {object} props
 * @param {AuthStrategy} props.authStrategy
 * @param {CookiesProvider} props.cookies
 * @param {DynamicCookiesOptions} props.cookiesOptions
 */
export function deleteAuthTokenCookies(props) {
	const refreshTokenCookieOptions = {
		...defaultRefreshTokenOptions,
		maxAge: 0,
		...(typeof props.cookiesOptions.REFRESH_TOKEN === "function"
			? props.cookiesOptions.REFRESH_TOKEN()
			: props.cookiesOptions.REFRESH_TOKEN),
	};

	props.cookies.set(refreshTokenCookieName, "", refreshTokenCookieOptions);

	if (props.authStrategy === "jwt") {
		const accessTokenCookieOptions = {
			...defaultAccessTokenOptions,
			maxAge: 0,
			...(typeof props.cookiesOptions.ACCESS_TOKEN === "function"
				? props.cookiesOptions.ACCESS_TOKEN()
				: props.cookiesOptions.ACCESS_TOKEN),
		};
		props.cookies.set(accessTokenCookieName, "", accessTokenCookieOptions);
	}
}
/**
 * Set JWT token cookies (like setSessionTokenCookie)
 * @param {{
 * 	cookies: CookiesProvider;
 * 	cookiesOptions: DynamicCookiesOptions;
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
	const refreshTokenCookieExpiresAt = dateLikeToDate(props.refreshTokenExpiresAt);
	const refreshTokenCookieOptions = {
		...defaultRefreshTokenOptions,
		expires: refreshTokenCookieExpiresAt,
		...(typeof props.cookiesOptions.REFRESH_TOKEN === "function"
			? props.cookiesOptions.REFRESH_TOKEN({ expiresAt: refreshTokenCookieExpiresAt })
			: props.cookiesOptions.REFRESH_TOKEN),
	};
	// Set refresh token cookie (long-lived, httpOnly)
	props.cookies.set(refreshTokenCookieName, props.refreshToken, refreshTokenCookieOptions);

	if (props.authStrategy === "jwt") {
		const accessTokenCookieExpiresAt = dateLikeToDate(props.accessTokenExpiresAt);
		const accessTokenCookieOptions = {
			...defaultAccessTokenOptions,
			expires: accessTokenCookieExpiresAt,
			...(typeof props.cookiesOptions.ACCESS_TOKEN === "function"
				? props.cookiesOptions.ACCESS_TOKEN({ expiresAt: accessTokenCookieExpiresAt })
				: props.cookiesOptions.ACCESS_TOKEN),
		};
		// Set access token cookie (short-lived)
		props.cookies.set(accessTokenCookieName, props.accessToken, accessTokenCookieOptions);
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
