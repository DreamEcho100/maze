"use server";

import { resetPasswordService } from "@de100/auth/services/reset-password";

import { redirect } from "#i18n/server";
import { generateGetCurrentAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	deleteAllPasswordResetSessionsByUserId,
	deleteAllSessionsByUserId,
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	updateOneUserPassword,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function resetPasswordAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		resetPasswordService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { password: formData.get("password") },
				authProviders: {
					passwordResetSession: {
						deleteOne: deleteOnePasswordResetSession,
						findOneWithUser: findOnePasswordResetSessionWithUser,
						deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
					},
					sessions: {
						deleteAllByUserId: deleteAllSessionsByUserId,
					},
					users: { updateOnePassword: updateOneUserPassword },
				},
			}),
		),
	);

	if (result.type === "success") {
		return redirect("/");
	}

	return result;
}
