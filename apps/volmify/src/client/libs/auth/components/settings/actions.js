"use server";

import { regenerateRecoveryCodeService } from "@de100/auth/services/settings/regenerate-recovery-code";
import { updateEmailService } from "@de100/auth/services/settings/update-email";
import { updateIsTwoFactorService } from "@de100/auth/services/settings/update-is-two-factor";
/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; }} ActionIdleResult
 * @typedef {{ type: 'error', statusCode: number; message: string; }} ActionErrorResult
 * @typedef {{ type: 'success', statusCode: number; message: string; }} ActionSuccessResult
 * @typedef {ActionIdleResult | ActionErrorResult | ActionSuccessResult} ActionResult
 */

import { updatePasswordService } from "@de100/auth/services/settings/update-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { db } from "#server/libs/db";
import { getSessionOptionsBasics } from "#server/libs/get-session-options-basics";

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

	const result = await db.transaction(async (tx) =>
		updatePasswordService(
			{ data: { currentPassword, newPassword } },
			{
				...(await getSessionOptionsBasics()),
				tx,
			},
		),
	);

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

	const ipAddressAndUserAgent = await getSessionOptionsBasics();
	const result = await updateEmailService({ email }, ipAddressAndUserAgent);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_EMAIL);
	}

	return result;
}

/**
 * @returns {Promise<ActionIdleResult | ActionErrorResult | (ActionSuccessResult & { data: { recoveryCode: string; } })>}
 */
export async function regenerateRecoveryCodeAction() {
	const ipAddressAndUserAgent = await getSessionOptionsBasics();
	return await regenerateRecoveryCodeService(ipAddressAndUserAgent);
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function updateIsTwoFactorEnabledAction(_prev, formData) {
	const ipAddressAndUserAgent = await getSessionOptionsBasics();
	const result = await updateIsTwoFactorService(
		{ isTwoFactorEnabled: formData.get("is_two_factor_enabled") },
		ipAddressAndUserAgent,
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_2FA);
	}

	return result;
}
