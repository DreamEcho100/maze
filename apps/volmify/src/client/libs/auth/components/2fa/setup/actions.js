"use server";

import { setup2FAService } from "@de100/auth/services/2fa/setup";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "@de100/i18n-nextjs/server";

import { db } from "#server/libs/db";
import { getIPAddressAndUserAgent } from "#server/libs/get-ip-address";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function setup2FAAction(_prev, formData) {
	const data = {
		code: formData.get("code"),
		encodedKey: formData.get("key"),
	};

	const ipAddressAndUserAgent = await getIPAddressAndUserAgent();
	const result = await db.transaction((tx) =>
		setup2FAService(data, {
			tx,
			ipAddress: ipAddressAndUserAgent.ipAddress,
			userAgent: ipAddressAndUserAgent.userAgent,
		}),
	);
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_SETUP_2FA);
	}

	return result;
}
