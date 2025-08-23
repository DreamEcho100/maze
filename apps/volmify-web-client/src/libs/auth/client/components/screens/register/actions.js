import { registerService } from "@de100/auth-core/services/register";
import { REGISTER_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
import {
	authStrategy,
	createOneEmailVerificationRequests,
	// createOneIdSync,
	createOneUser,
	deleteOneEmailVerificationRequestsByUserId,
	findOneUserByEmail,
} from "@de100/db/auth/init";
import { getSessionOptionsBasics } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";

/**
 * @param {{
 * 	email: unknown,
 * 	name: unknown,
 *  password: unknown,
 *  enable2FA: unknown,
 * }} input
 */
export async function signupAction(input) {
	"use server";

	const result = await registerService({
		...getSessionOptionsBasics(),
		// generateRandomId: createOneIdSync,
		input,
		authStrategy,
		authProviders: {
			userEmailVerificationRequests: {
				createOne: createOneEmailVerificationRequests,
				deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
			},
			users: { createOne: createOneUser, findOneByEmail: findOneUserByEmail },
		},
	});

	if (result.type === "success") {
		await redirect("/auth/login");
		return result;
	}

	switch (result.messageCode) {
		case REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED.messageCode:
			await redirect("/auth/2fa/setup");
			return result;
		default:
			return result;
	}
}
