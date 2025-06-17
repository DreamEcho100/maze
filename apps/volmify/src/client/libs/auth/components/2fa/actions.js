"use server";

import { verify2FAService } from "@de100/auth/services/2fa/verify";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { getOneUserTOTPKey, markOneSession2FAVerified } from "#server/libs/auth/init";
import { db } from "#server/libs/db";
import { generateGetCurrentAuthSessionProps } from "#server/libs/generate-get-current-auth-session-props";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verify2FAAction(_prev, formData) {
	// Call service layer for 2FA verification
	const result = await db.transaction(async (tx) =>
		verify2FAService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { code: formData.get("code") },
				authProviders: {
					sessions: {
						markOne2FAVerified: markOneSession2FAVerified,
					},
					users: { getOneTOTPKey: getOneUserTOTPKey },
				},
			}),
		),
	);

	// Redirect if verification succeeds
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_2FA);
	}

	// Return error directly if verification fails
	return result;
}
