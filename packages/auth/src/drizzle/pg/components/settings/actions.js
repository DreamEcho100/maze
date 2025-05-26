"use server";

import { cookies } from "next/headers";
import { regenerateRecoveryCodeService } from "@acme/auth/services/settings/regenerate-recovery-code";
import { updateEmailService } from "@acme/auth/services/settings/update-email";
import { updateIsTwoFactorService } from "@acme/auth/services/settings/update-is-two-factor";
/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; }} ActionIdleResult
 * @typedef {{ type: 'error', statusCode: number; message: string; }} ActionErrorResult
 * @typedef {{ type: 'success', statusCode: number; message: string; }} ActionSuccessResult
 * @typedef {ActionIdleResult | ActionErrorResult | ActionSuccessResult} ActionResult
 */

import { updatePasswordService } from "@acme/auth/services/settings/update-password";
import { AUTH_URLS } from "@acme/auth/utils/constants";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 *
 * Processes the update password form action, validating inputs and handling session updates.
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updatePasswordAction(_prev, formData) {
	const currentPassword = formData.get("password");
	const newPassword = formData.get("new_password");

	if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
		return {
			message: "Invalid or missing fields",
			type: "error",
			statusCode: 400,
		};
	}

	const cookiesManager = await cookies();
	const result = await updatePasswordService(currentPassword, newPassword, {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	return result;
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateEmailAction(_prev, formData) {
	const email = formData.get("email");
	if (typeof email !== "string") {
		return {
			message: "Invalid or missing fields",
			type: "error",
			statusCode: 400,
		};
	}

	const cookiesManager = await cookies();
	const result = await updateEmailService(email, {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_EMAIL);
	}

	return result;
}

/**
 * @returns {Promise<ActionIdleResult | ActionErrorResult | (ActionSuccessResult & { data: { recoveryCode: string; } })>}
 */
export async function regenerateRecoveryCodeAction() {
	const cookiesManager = await cookies();
	return await regenerateRecoveryCodeService({
		getCookie: (name) => cookiesManager.get(name)?.value,
	});
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateIsTwoFactorEnabledAction(_prev, formData) {
	const cookiesManager = await cookies();
	const result = await updateIsTwoFactorService(formData.get("is_two_factor_enabled"), {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_2FA);
	}

	return result;
}
