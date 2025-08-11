"use server";

import { registerService } from "@de100/auth-core/services/register";
import { REGISTER_MESSAGES_ERRORS } from "@de100/auth-core/utils/constants";
import {
	authStrategy,
	createOneEmailVerificationRequests,
	createOneUser,
	deleteOneEmailVerificationRequestsByUserId,
	findOneUserByEmail,
} from "@de100/db/auth/init";
import { redirect } from "#libs/i18n/server/utils.ts";
import { getSessionOptionsBasics } from "#libs/server/get-session-options-basics.js";

/**
 * @param {{
 * 	email: unknown,
 * 	name: unknown,
 *  password: unknown,
 *  enable2FA: unknown,
 * }} input
 */
export async function signupAction(input) {
	const result = await registerService({
		...(await getSessionOptionsBasics()),
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
