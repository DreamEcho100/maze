"use server";

import { cookies } from "next/headers";

import { verifyPasswordReset2FAViaRecoveryCodeService } from "@de100/auth/services/reset-password/verify/2fa/recovery-code";
import { verifyPasswordReset2FAViaTOTPService } from "@de100/auth/services/reset-password/verify/2fa/totp";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithTOTPAction(_prev, formData) {
	const cookiesManager = await cookies();

	const result = await verifyPasswordReset2FAViaTOTPService(formData.get("code"), {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

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
	const cookiesManager = await cookies();
	const result = await verifyPasswordReset2FAViaRecoveryCodeService(code, {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}
