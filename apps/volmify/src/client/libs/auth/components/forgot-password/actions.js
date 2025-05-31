"use server";

import { forgotPasswordService } from "@de100/auth/services/forgot-password";
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
export async function forgotPasswordAction(_prev, formData) {
	const data = { email: formData.get("email") };

	const result = await db.transaction((tx) => forgotPasswordService(data, { tx }));

	if (result.type === "success") {
		// Redirect for successful password reset email sending
		return redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
	}

	// If there is an error, return it directly from the service's response
	return result;
}
