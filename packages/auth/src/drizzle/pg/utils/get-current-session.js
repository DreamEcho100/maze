"use server";

/** @import { SessionValidationResult } from "@acme/auth/types"; */
import { cache } from "react";
import { cookies } from "next/headers";

import { getCurrentSession as getCurrentSession_ } from "@acme/auth/utils/sessions";

/**
 * Retrieves the current session from the request's cookies in a Next.js environment.
 * This function acts as a wrapper around the `getCurrentSession_` function, which handles
 * the session retrieval logic.
 *
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
export const getCurrentSession = cache(async () => {
  const cookiesManager = await cookies();
  return getCurrentSession_((key) => cookiesManager.get(key)?.value ?? null);
});
