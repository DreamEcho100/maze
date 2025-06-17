"use server";

import { setup2FAService } from "@de100/auth/services/2fa/setup";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { markOneSession2FAVerified, updateOneUserTOTPKey } from "#server/libs/auth/init";
import { db } from "#server/libs/db";
import { generateGetCurrentAuthSessionProps } from "#server/libs/generate-get-current-auth-session-props";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function setup2FAAction(_prev, formData) {
	const result = await db.transaction(async (tx) =>
		setup2FAService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: {
					code: formData.get("code"),
					encodedKey: formData.get("key"),
				},
				authProviders: {
					sessions: {
						markOne2FAVerified: markOneSession2FAVerified,
					},
					users: { updateOneTOTPKey: updateOneUserTOTPKey },
				},
			}),
		),
	);
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_SETUP_2FA);
	}

	return result;
}
