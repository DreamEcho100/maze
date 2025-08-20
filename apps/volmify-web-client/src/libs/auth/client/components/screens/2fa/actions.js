import { verify2FAService } from "@de100/auth-core/services/2fa/verify";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
} from "@de100/auth-core/utils/constants";
import {
	getOneUserTOTPKey,
	markOneSession2FAVerified,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

/**
 * @param {{ code: unknown }} input
 */
export async function verify2FAAction(input) {
	"use server";
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		verify2FAService({
			tx,
			...authProps,
		}),
	);

	// Redirect if verification succeeds
	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_VERIFY_2FA);
		return result;
	}

	// Return error directly if verification fails
	return result;
}
