"use server";

import { cookies } from "next/headers";

import { logoutService } from "@de100/auth/services/logout";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @returns {Promise<ActionResult>}
 */
export async function logoutAction() {
	const cookiesManager = await cookies();
	const result = await logoutService({
		getCookie: (key) => cookiesManager.get(key)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_LOGOUT);
	}

	return result;
}
