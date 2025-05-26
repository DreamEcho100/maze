"use server";

import { registerService } from "@de100/auth/services/register";
import { REGISTER_MESSAGES_ERRORS } from "@de100/auth/utils/constants";

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

	const result = await registerService(data);

	if (result.type === "success") {
		return redirect("/auth/login");
	}

	switch (result.messageCode) {
		case REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED.messageCode:
			return redirect("/auth/2fa/setup");
		default:
			return result;
	}
}
