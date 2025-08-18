"use server";

import { setup2FAService } from "@de100/auth-core/services/2fa/setup";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
} from "@de100/auth-core/utils/constants";
import {
	markOneSession2FAVerified,
	updateOneUserTOTPKey,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		setup2FAService({
			...authProps,
			tx,
		}),
	);
	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_SETUP_2FA);
		return result;
	}

	return result;
}
