"use server";

import { cookies } from "next/headers";
import { REGISTER_MESSAGES_ERRORS, registerService } from "@acme/auth/services/register";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function signupAction(_prev, formData) {
	const data = {
		email: formData.get("email"),
		name: formData.get("name"),
		password: formData.get("password"),
		enable2FA: formData.get("enable_2fa") === "on",
	};

	const cookiesManager = await cookies();

	const result = await registerService(data, {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect("/auth/login");
	}

	switch (result.messageCode) {
		case REGISTER_MESSAGES_ERRORS.NEEDS_2FA_VALIDATION.messageCode:
			return redirect("/auth/2fa/setup");
		default:
			return result;
	}
}
