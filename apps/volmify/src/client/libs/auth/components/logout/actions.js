"use server";

import { logoutService } from "@de100/auth/services/logout";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateGetCurrentAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @returns {Promise<ActionResult>}
 */
export async function logoutAction() {
	const result = await db.transaction(async (tx) =>
		logoutService(
			await generateGetCurrentAuthSessionProps({
				tx,
			}),
		),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_LOGOUT);
	}

	return result;
}
