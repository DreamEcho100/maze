import { authConfig } from "#init/index.js";

export function getAuthorizationTokenFromHeaders() {
	const accessToken = authConfig.headers.get("authorization")?.split(" ")[1] ?? null;

	if (!accessToken || typeof accessToken !== "string" || accessToken.length === 0) {
		return null; // No access token found or invalid access token format
	}

	return accessToken;
}
