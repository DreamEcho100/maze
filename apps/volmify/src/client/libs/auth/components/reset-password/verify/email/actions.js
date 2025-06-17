"use server";

import { verifyPasswordResetEmailVerificationService } from "@de100/auth/services/reset-password/verify/email";

import { redirect } from "#i18n/server";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	markOnePasswordResetSessionEmailAsVerified,
	verifyOneUserEmailIfMatches,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";
import { generateGetCurrentAuthSessionProps } from "#server/libs/generate-get-current-auth-session-props";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev - The previous result from the action.
 * @param {FormData} formData - The form data containing user input.
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordResetEmailVerificationAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		verifyPasswordResetEmailVerificationService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { code: formData.get("code") },
				authProviders: {
					passwordResetSession: {
						deleteOne: deleteOnePasswordResetSession,
						findOneWithUser: findOnePasswordResetSessionWithUser,
						markOneEmailAsVerified: markOnePasswordResetSessionEmailAsVerified,
					},
					users: {
						verifyOneEmailIfMatches: verifyOneUserEmailIfMatches,
					},
				},
			}),
		),
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
