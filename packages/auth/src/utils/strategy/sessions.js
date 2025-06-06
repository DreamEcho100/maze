/** @import { UserAgent, DateLike, SessionValidationResult, Session } from "#types.ts" */

import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

import { authConfig } from "#init/index.js";
import {
	COOKIE_TOKEN_SESSION_EXPIRES_DURATION,
	COOKIE_TOKEN_SESSION_KEY,
} from "#utils/constants.js";
import { dateLikeToDate, dateLikeToNumber } from "#utils/dates.js";
import { getSessionId } from "#utils/get-session-id.js";

/**
 * Creates a new session for the given user.
 *
 * The session ID is the SHA-256 hash of the session token, and the session is set to expire in 30 days.
 *
 * @param {object} props - The properties for the session.
 * @param {object} props.data - The data associated with the session.
 * @param {string} props.data.token - The session token, which is a random string.
 * @param {string} props.data.userId - The ID of the user for whom the session is created.
 * @param {string|null|undefined} props.data.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} props.data.userAgent - Optional user agent for the session.
 * @param {{ twoFactorVerifiedAt?: DateLike | null; }} props.data.flags - Flags to set for the session.
 * @param {{ tx?: any }} [options] - Additional options, such as transaction context.
 * @returns {Promise<Session>} A promise that resolves to the created session object.
 */
export async function createSession(props, options) {
	const sessionId = getSessionId(props.data.token);

	/** @type {Session} */
	const session = {
		id: sessionId,
		userId: props.data.userId,
		expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
		twoFactorVerifiedAt: props.data.flags.twoFactorVerifiedAt,
		createdAt: new Date(),
		sessionType: "session",
		// ipAddress:
		// 	authConfig.headers.get("x-forwarded-for") ?? authConfig.headers.get("x-real-ip") ?? null,
		// userAgent: authConfig.headers.get("user-agent") ?? null,
		ipAddress: props.data.ipAddress ?? null,
		userAgent: props.data.userAgent ?? null,
		lastUsedAt: new Date(),
		revokedAt: null, // Not revoked initially
	};

	await authConfig.providers.session.createOne({ data: session }, options);

	return session;
}

export function getTokenFromCookies() {
	const token = authConfig.cookies.get(COOKIE_TOKEN_SESSION_KEY);
	if (!token) {
		return null;
	}
	return token;
}

/**
 * Retrieves the current session by validating the session token.
 *
 * @returns {Promise<SessionValidationResult>} A promise that resolves to the session and user data.
 */
export async function getCurrentSession() {
	const token = getTokenFromCookies();
	if (!token) {
		return { session: null, user: null };
	}

	return await validateSessionToken(token);
}

/**
 * Set the session token cookie with required attributes.
 *
 * @param {object} param
 * @param {string} param.token - The session token to be set in the cookie.
 * @param {DateLike} param.expiresAt - Expiration date for the session token.
 * @returns {void}
 */
export function setSessionTokenCookie(param) {
	authConfig.cookies.set(COOKIE_TOKEN_SESSION_KEY, param.token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: dateLikeToDate(param.expiresAt),
		path: "/",
	});
}

/**
 * Delete the session token cookie.
 *
 * @returns {void}
 */
export function deleteSessionTokenCookie() {
	authConfig.cookies.set(COOKIE_TOKEN_SESSION_KEY, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});
}

/**
 * Generates a random session token.
 *
 * The session token is generated using 20 random bytes encoded in base32.
 * Base32 is used because it's case-insensitive and more compact than hex encoding.
 *
 * @returns {string} A random session token encoded as a base32 string.
 */
export function generateSessionToken() {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

/**
 * Middleware to handle session token validation and cookie expiration extension.
 *
 * @param {object} param
 * @param {string | null} param.token - The session token extracted from cookies.
 * @param {(key: string, value: string, options: object) => void} param.setCookie - Framework-provided function to set cookies.
 * @returns {Promise<SessionValidationResult>} The result of session validation.
 */
export async function handleSessionMiddleware(param) {
	if (!param.token) {
		return { session: null, user: null };
	}

	const result = await validateSessionToken(param.token);

	if (!result.session) {
		// If the session is not found, delete the session token cookie
		deleteSessionTokenCookie();
		return { session: null, user: null };
	}

	// if (result.session) {
	// Extend cookie expiration by 30 days
	setSessionTokenCookie({
		token: param.token,
		expiresAt: new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION),
	});
	// }

	return result;
}

/**
 * Validates a session token by checking if it exists and if it is still within the expiration date.
 *
 * If the session is nearing expiration (within 15 days), the expiration will be extended by another 30 days.
 * If the session has expired, it will be deleted from the database.
 *
 * @param {string} token - The session token to be validated.
 * @returns {Promise<SessionValidationResult>} A promise that resolves to the session and user data, or null if the session is invalid or expired.
 */
export async function validateSessionToken(token) {
	const sessionId = getSessionId(token);
	const result = await authConfig.providers.session
		.findOneWithUser(sessionId)
		.catch((error) => console.error("Error:", error));

	if (!result?.session.userId) {
		return { session: null, user: null };
	}

	const expiresAt = dateLikeToNumber(result.session.expiresAt);

	if (Date.now() >= expiresAt) {
		await authConfig.providers.session.deleteOneById(sessionId);
		return { session: null, user: null };
	}

	if (Date.now() >= expiresAt - 1000 * 60 * 60 * 24 * 15) {
		result.session.expiresAt = new Date(Date.now() + COOKIE_TOKEN_SESSION_EXPIRES_DURATION);
		await authConfig.providers.session.extendOneExpirationDate(
			sessionId,
			new Date(result.session.expiresAt),
		);
	}

	return result;
}
