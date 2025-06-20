/** @import { HeadersProvider } from "#types.ts" */

/** @param {HeadersProvider} headers */
export function getAuthorizationTokenFromHeaders(headers) {
	const accessToken = headers.get("authorization")?.split(" ")[1] ?? null;

	if (!accessToken || typeof accessToken !== "string" || accessToken.length === 0) {
		return null; // No access token found or invalid access token format
	}

	return accessToken;
}

/**
 * Get the refresh token from headers.
 * @param {HeadersProvider} headers
 * @returns {string|null} The refresh token or null if not found.
 */
export function getRefreshTokenFromHeaders(headers) {
	const refreshToken = headers.get("x-refresh-token") ?? null;

	if (!refreshToken || typeof refreshToken !== "string" || refreshToken.length === 0) {
		return null; // No refresh token found or invalid format
	}

	return refreshToken;
}
