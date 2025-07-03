"use server";

import { verifyPasswordResetEmailVerificationService } from "@de100/auth/services/reset-password/verify/email";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	markOnePasswordResetSessionEmailAsVerified,
	verifyOneUserEmailIfMatches,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

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
		return redirect(AUTH_URLS.LOGIN);
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
				return redirect("/auth/reset-password");
			case "verify-2fa":
				return redirect("/auth/reset-password/2fa");
			default:
				return { type: "error", statusCode: 500, message: "Unexpected error" };
		}
	}

	return result;
}
