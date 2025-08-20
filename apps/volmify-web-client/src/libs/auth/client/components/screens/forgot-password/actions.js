import { forgotPasswordService } from "@de100/auth-core/services/forgot-password";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
} from "@de100/auth-core/utils/constants";
import {
	createOnePasswordResetSession,
	deleteAllPasswordResetSessionsByUserId,
	findOneUserByEmail,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

/**
 * @param {{ email: unknown }} input
 */
export async function forgotPasswordAction(input) {
	"use server";
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		forgotPasswordService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		// Redirect for successful password reset email sending
		await redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
		return result;
	}

	// If there is an error, return it directly from the service's response
	return result;
}
