"use server";

import { setup2FAService } from "@de100/auth/services/2fa/setup";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import { markOneSession2FAVerified, updateOneUserTOTPKey } from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ code: unknown, encodedTOTPKey: unknown }} input
 */
export async function setup2FAAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			sessions: {
				markOne2FAVerified: markOneSession2FAVerified,
			},
			users: { updateOneTOTPKey: updateOneUserTOTPKey },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		setup2FAService({
			...authProps,
			tx,
		}),
	);
	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_SETUP_2FA);
	}

	return result;
}
