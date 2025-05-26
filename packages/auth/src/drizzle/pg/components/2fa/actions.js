"use server";

import { cookies } from "next/headers";
import { verify2FAService } from "@acme/auth/services/2fa/verify";
import { AUTH_URLS } from "@acme/auth/utils/constants";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verify2FAAction(_prev, formData) {
	const data = formData.get("code");

	const cookiesManager = await cookies();

	// Call service layer for 2FA verification
	const result = await verify2FAService(data, {
		getCookie: (key) => cookiesManager.get(key)?.value,
	});

	// Redirect if verification succeeds
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_2FA);
	}

	// Return error directly if verification fails
	return result;
}
