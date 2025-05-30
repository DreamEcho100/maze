"use server";

import { reset2FAService } from "@de100/auth/services/2fa/reset";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "@de100/i18n-nextjs/server";

import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function reset2FAAction(_prev, formData) {
	const data = {
		code: formData.get("code"),
	};

	const result = await db.transaction(async (tx) => reset2FAService(data, { tx }));

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_RESET_2FA);
	}

	return result;
}
