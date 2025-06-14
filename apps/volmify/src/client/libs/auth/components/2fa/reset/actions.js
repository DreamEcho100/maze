"use server";

import { reset2FAService } from "@de100/auth/services/2fa/reset";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import {
	authStrategy,
	defaultSessionsHandlers,
	getOneUserRecoveryCodeRaw,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
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
export async function reset2FAAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		reset2FAService({
			...(await getSessionOptionsBasics()),
			input: { code: formData.get("code") },
			tx,
			authStrategy: authStrategy,
			authProviders: {
				sessions: {
					...defaultSessionsHandlers,
					unMarkOne2FAForUser: unMarkOneSession2FAForUser,
				},
				users: {
					getOneRecoveryCodeRaw: getOneUserRecoveryCodeRaw,
					updateOneRecoveryCodeById: updateOneUserRecoveryCodeById,
				},
			},
		}),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_RESET_2FA);
	}

	return result;
}
