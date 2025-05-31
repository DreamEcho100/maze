"use server";

import { verifyPasswordResetEmailVerificationService } from "@de100/auth/services/reset-password/verify/email";
import { redirect } from "@de100/i18n-nextjs/server";

import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev - The previous result from the action.
 * @param {FormData} formData - The form data containing user input.
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordResetEmailVerificationAction(_prev, formData) {
	const result = await db.transaction((tx) =>
		verifyPasswordResetEmailVerificationService(formData.get("code"), { tx }),
	);
	if (result.type === "success") {
		switch (result.data.nextStep) {
			case "reset-password":
				return redirect("/auth/reset-password");
			case "verify-2fa":
				return redirect("/auth/reset-password/2fa");
			default:
				return { type: "error", statusCode: 500, message: "Unexpected error" };
		}
	}

	return result;
}
