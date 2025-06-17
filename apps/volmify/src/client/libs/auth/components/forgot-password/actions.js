"use server";

import { forgotPasswordService } from "@de100/auth/services/forgot-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import {
	createOnePasswordResetSession,
	deleteAllPasswordResetSessionsByUserId,
	findOneUserByEmail,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";
import { generateGetCurrentAuthSessionProps } from "#server/libs/generate-get-current-auth-session-props";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function forgotPasswordAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		forgotPasswordService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { email: formData.get("email") },
				authProviders: {
					passwordResetSession: {
						createOne: createOnePasswordResetSession,
						deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
					},
					users: {
						findOneByEmail: findOneUserByEmail,
					},
				},
			}),
		),
	);

	if (result.type === "success") {
		// Redirect for successful password reset email sending
		return redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
	}

	// If there is an error, return it directly from the service's response
	return result;
}
