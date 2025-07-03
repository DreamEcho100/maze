"use server";

import { resetPasswordService } from "@de100/auth/services/reset-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	deleteAllPasswordResetSessionsByUserId,
	deleteAllSessionsByUserId,
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	updateOneUserPassword,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ password: unknown }} input
 */
export async function resetPasswordAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
				deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
			},
			sessions: {
				deleteAllByUserId: deleteAllSessionsByUserId,
			},
			users: { updateOnePassword: updateOneUserPassword },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		resetPasswordService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		return redirect("/");
	}

	return result;
}
