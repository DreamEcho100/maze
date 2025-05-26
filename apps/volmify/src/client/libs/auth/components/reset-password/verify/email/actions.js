"use server";

import { cookies } from "next/headers";

import { verifyPasswordResetEmailVerificationService } from "@de100/auth/services/reset-password/verify/email";

import { db } from "#server/libs/db";
import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev - The previous result from the action.
 * @param {FormData} formData - The form data containing user input.
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordResetEmailVerificationAction(_prev, formData) {
	const cookiesManager = await cookies();
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
