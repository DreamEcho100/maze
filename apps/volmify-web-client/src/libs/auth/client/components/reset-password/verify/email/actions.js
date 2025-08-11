"use server";

import { verifyPasswordResetEmailVerificationService } from "@de100/auth-core/services/reset-password/verify/email";
import { AUTH_URLS, AUTHENTICATION_REQUIRED } from "@de100/auth-core/utils/constants";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	markOnePasswordResetSessionEmailAsVerified,
	verifyOneUserEmailIfMatches,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

/**
 * @param {{ code: unknown }} input
 */
export async function verifyPasswordResetEmailVerificationAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
				markOneEmailAsVerified: markOnePasswordResetSessionEmailAsVerified,
			},
			users: {
				verifyOneEmailIfMatches: verifyOneUserEmailIfMatches,
			},
		},
	});

	if (!authProps?.session) {
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		verifyPasswordResetEmailVerificationService({
			...authProps,
			tx,
		}),
	);
	if (result.type === "success") {
		switch (result.data.nextStep) {
			case "reset-password":
				await redirect("/auth/reset-password");
				return result;
			case "verify-2fa":
				await redirect("/auth/reset-password/2fa");
				return result;
			default:
				return { type: "error", statusCode: 500, message: "Unexpected error" };
		}
	}

	return result;
}
