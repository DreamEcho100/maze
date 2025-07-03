// @ts-check
"use server";

import { reset2FAService } from "@de100/auth/services/2fa/reset";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	getOneUserRecoveryCodeRaw,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ code: unknown }} input
 */
export async function reset2FAAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			sessions: {
				unMarkOne2FAForUser: unMarkOneSession2FAForUser,
			},
			users: {
				getOneRecoveryCodeRaw: getOneUserRecoveryCodeRaw,
				updateOneRecoveryCodeById: updateOneUserRecoveryCodeById,
			},
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		reset2FAService({
			tx,
			...authProps,
		}),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_RESET_2FA);
	}

	return result;
}
