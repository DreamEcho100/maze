"use server";

import { cookies } from "next/headers";

import { reset2FAService } from "@de100/auth/services/2fa/reset";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "~/libs/i18n/navigation/custom";

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

	const cookiesManager = await cookies();
	const result = await reset2FAService(data, {
		getCookie: (key) => cookiesManager.get(key)?.value,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_RESET_2FA);
	}

	return result;
}
