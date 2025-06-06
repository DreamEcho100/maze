"use server";

import { verify2FAService } from "@de100/auth/services/2fa/verify";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "@de100/i18n-nextjs/server";

import { getIPAddressAndUserAgent } from "#server/libs/get-ip-address";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verify2FAAction(_prev, formData) {
	const data = formData.get("code");

	const ipAddressAndUserAgent = await getIPAddressAndUserAgent();
	// Call service layer for 2FA verification
	const result = await verify2FAService(data, ipAddressAndUserAgent);

	// Redirect if verification succeeds
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_2FA);
	}

	// Return error directly if verification fails
	return result;
}
