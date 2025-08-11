"use server";

import { reset2FAService } from "@de100/auth-core/services/2fa/reset";
import { AUTH_URLS, AUTHENTICATION_REQUIRED } from "@de100/auth-core/utils/constants";
import {
	getOneUserRecoveryCodeRaw,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		reset2FAService({
			tx,
			...authProps,
		}),
	);

	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_RESET_2FA);
		return result;
	}

	return result;
}
