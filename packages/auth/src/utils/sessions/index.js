/** @import { User, UserAgent, SessionMetadata, CookiesProvider, SessionsProvider, AuthStrategy, JWTProvider } from "#types.ts" */

// import { dateLikeToISOString } from "#utils/dates.js";

export { createOneAuthSession as createAuthSession } from "../sessions/create-auth-session.js";
export { getCurrentAuthSession } from "../sessions/get-current-auth-session.js";
export { invalidateOneAuthSessionToken } from "../sessions/invalidate-one-auth-session-token.js";

/*-------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------*/

// /**
//  * Middleware to handle session token validation and cookie expiration extension.
//  *
//  * @returns {Promise<SessionValidationResult>} The result of session validation.
//  */
// export async function handleSessionMiddleware() {
// 	const result = await getCurrentAuthSession();

// 	if (!result.session) {
// 		return { session: null, user: null };
// 	}

// 	if (result.session.sessionType === "jwt_access_token") {
// 		// For JWT, we don't set cookies, just return the data
// 		return result;
// 	}

// 	// For session authStrategy, we set the cookie
// 	// Set the session token cookie with the new expiration date
// 	const token = getTokenFromCookies();
// 	if (!token) {
// 		return { session: null, user: null };
// 	}
// 	setOneAuthSessionToken({
// 		strategy: "session",
// 		session: result.session,
// 		token: token,
// 		expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
// 	});

// 	return result;
// }
