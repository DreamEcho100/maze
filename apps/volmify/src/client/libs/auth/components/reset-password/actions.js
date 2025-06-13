"use server";

import { resetPasswordService } from "@de100/auth/services/reset-password";

import { redirect } from "#i18n/server";
import {
	authStrategy,
	createOneSession,
	deleteAllPasswordResetSessionsByUserId,
	deleteAllSessionsByUserId,
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
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
export async function resetPasswordAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		resetPasswordService({
			...(await getSessionOptionsBasics()),
			tx,
			input: { password: formData.get("password") },
			authStrategy,
			authProviders: {
				passwordResetSession: {
					deleteOne: deleteOnePasswordResetSession,
					findOneWithUser: findOnePasswordResetSessionWithUser,
					deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
				},
				sessions: {
					createOne: createOneSession,
					deleteAllByUserId: deleteAllSessionsByUserId,
				},
			},
		}),
	);

	if (result.type === "success") {
		return redirect("/");
	}

	return result;
}
