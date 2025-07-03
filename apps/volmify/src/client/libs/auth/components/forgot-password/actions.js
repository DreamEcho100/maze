"use server";

import { forgotPasswordService } from "@de100/auth/services/forgot-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	createOnePasswordResetSession,
	deleteAllPasswordResetSessionsByUserId,
	findOneUserByEmail,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ email: unknown }} input
 */
export async function forgotPasswordAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			passwordResetSession: {
				createOne: createOnePasswordResetSession,
				deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
			},
			users: {
				findOneByEmail: findOneUserByEmail,
			},
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		forgotPasswordService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		// Redirect for successful password reset email sending
		return redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
	}

	// If there is an error, return it directly from the service's response
	return result;
}
