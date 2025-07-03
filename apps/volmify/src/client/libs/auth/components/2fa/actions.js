"use server";

import { verify2FAService } from "@de100/auth/services/2fa/verify";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import { getOneUserTOTPKey, markOneSession2FAVerified } from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ code: unknown }} input
 */
export async function verify2FAAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			sessions: {
				markOne2FAVerified: markOneSession2FAVerified,
			},
			users: { getOneTOTPKey: getOneUserTOTPKey },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		verify2FAService({
			tx,
			...authProps,
		}),
	);

	// Redirect if verification succeeds
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_2FA);
	}

	// Return error directly if verification fails
	return result;
}
