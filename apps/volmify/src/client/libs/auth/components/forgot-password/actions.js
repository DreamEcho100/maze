"use server";

import { forgotPasswordService } from "@de100/auth/services/forgot-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import {
	authStrategy,
	createOnePasswordResetSession,
	defaultSessionsHandlers,
	deleteAllPasswordResetSessionsByUserId,
	findOneUserByEmail,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";
import { getSessionOptionsBasics } from "#server/libs/get-session-options-basics";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function forgotPasswordAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		forgotPasswordService({
			...(await getSessionOptionsBasics()),
			tx,
			input: { email: formData.get("email") },
			authStrategy,
			authProviders: {
				passwordResetSession: {
					createOne: createOnePasswordResetSession,
					deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
				},
				sessions: defaultSessionsHandlers,
				users: {
					findOneByEmail: findOneUserByEmail,
				},
			},
		}),
	);

	if (result.type === "success") {
		// Redirect for successful password reset email sending
		return redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
	}

	// If there is an error, return it directly from the service's response
	return result;
}
