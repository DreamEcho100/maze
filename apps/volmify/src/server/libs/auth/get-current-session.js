"use server";

import { cache } from "react";

import { getCurrentAuthSession } from "@de100/auth/utils/sessions";

import { db } from "../db";
import { generateGetCurrentAuthSessionProps } from "../generate-get-current-auth-session-props";

export const getUncachedCurrentSession =
	/**
	 * @param {object} [props]
	 * @param {Headers} [props.reqHeaders] - Optional headers from the request, typically used to access cookies.
	 *  @param {boolean} [props.canMutateCookies] - Indicates whether the function can modify cookies.
	 */
	async (props) => {
		"use server";
		return db.transaction(async (tx) =>
			getCurrentAuthSession(
				await generateGetCurrentAuthSessionProps({
					tx,
					reqHeaders: props?.reqHeaders,
					canMutateCookies: props?.canMutateCookies,
				}),
			),
		);
	};

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
export const getCurrentSession = cache(getUncachedCurrentSession);
