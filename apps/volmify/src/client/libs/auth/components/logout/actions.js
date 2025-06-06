"use server";

import { logoutService } from "@de100/auth/services/logout";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "@de100/i18n-nextjs/server";

import { getIPAddressAndUserAgent } from "#server/libs/get-ip-address";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @returns {Promise<ActionResult>}
 */
export async function logoutAction() {
	const ipAddressAndUserAgent = await getIPAddressAndUserAgent();
	const result = await logoutService(ipAddressAndUserAgent);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_LOGOUT);
	}

	return result;
}
