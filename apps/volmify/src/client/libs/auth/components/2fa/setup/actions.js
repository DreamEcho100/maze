"use server";

import { setup2FAService } from "@de100/auth/services/2fa/setup";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { db } from "#server/libs/db";
import { redirect } from "~/libs/i18n/navigation/custom";

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

	const result = await db.transaction((tx) => setup2FAService(data, { tx }));

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_SETUP_2FA);
	}

	return result;
}
