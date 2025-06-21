"use server";

import { reset2FAService } from "@de100/auth/services/2fa/reset";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateGetCurrentAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	getOneUserRecoveryCodeRaw,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function reset2FAAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		reset2FAService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { code: formData.get("code") },
				authProviders: {
					sessions: {
						unMarkOne2FAForUser: unMarkOneSession2FAForUser,
					},
					users: {
						getOneRecoveryCodeRaw: getOneUserRecoveryCodeRaw,
						updateOneRecoveryCodeById: updateOneUserRecoveryCodeById,
					},
				},
			}),
		),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_RESET_2FA);
	}

	return result;
}
