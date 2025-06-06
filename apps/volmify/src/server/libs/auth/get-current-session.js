"use server";

import { cache } from "react";

import { getCurrentAuthSession } from "@de100/auth/utils/strategy";

import { getIPAddressAndUserAgent } from "../get-ip-address";

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
		const ipAddressAndUserAgent = await getIPAddressAndUserAgent(reqHeaders);
		return getCurrentAuthSession(ipAddressAndUserAgent);
	},
);
