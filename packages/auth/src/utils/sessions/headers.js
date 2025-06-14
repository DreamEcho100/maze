/** @import { HeadersProvider } from "#types.ts" */

/** @param {HeadersProvider} headers */
export function getAuthorizationTokenFromHeaders(headers) {
	const accessToken = headers.get("authorization")?.split(" ")[1] ?? null;

	if (!accessToken || typeof accessToken !== "string" || accessToken.length === 0) {
		return null; // No access token found or invalid access token format
	}

	return accessToken;
}
