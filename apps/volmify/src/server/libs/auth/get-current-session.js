"use server";

import { cache } from "react";

import { getCurrentAuthSession } from "@de100/auth/utils/strategy";

import { getSessionOptionsBasics } from "../get-session-options-basics";

/**
 * Retrieves the current session from the request's cookies in a Next.js environment.
 * This function acts as a wrapper around the `getCurrentSession_` function, which handles
 * the session retrieval logic.
 *
 * @param {Headers} [reqHeaders] - Optional headers from the request, typically used to access cookies.
 * @returns {Promise<SessionValidationResult>} - Returns the current session object if a valid token
 *  is found, otherwise returns `null`.
 *
 * @example
 * ```ts
 * const session = await getCurrentSession();
 * if (session) {
 *   console.log("Current session:", session);
 * } else {
 *   console.log("No active session found.");
 * }
 * ```
 */
export const getCurrentSession = cache(
	/** @param {Headers} [reqHeaders] - Optional headers from the request, typically used to access cookies. */
	async (reqHeaders) => {
		"use server";
		const ipAddressAndUserAgent = await getSessionOptionsBasics(reqHeaders);
		return getCurrentAuthSession(ipAddressAndUserAgent);
	},
);
