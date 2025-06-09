"use server";

import { verifyPasswordReset2FAViaRecoveryCodeService } from "@de100/auth/services/reset-password/verify/2fa/recovery-code";
import { verifyPasswordReset2FAViaTOTPService } from "@de100/auth/services/reset-password/verify/2fa/totp";

import { redirect } from "#i18n/server";
import { db } from "#server/libs/db";
import { getCookies } from "#server/libs/get-cookies";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithTOTPAction(_prev, formData) {
	const result = await verifyPasswordReset2FAViaTOTPService(
		{ code: formData.get("code") },
		{ cookies: await getCookies() },
	);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithRecoveryCodeAction(_prev, formData) {
	const code = formData.get("code");
	const result = await db.transaction(async (tx) =>
		verifyPasswordReset2FAViaRecoveryCodeService({ code }, { tx, cookies: await getCookies() }),
	);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}
