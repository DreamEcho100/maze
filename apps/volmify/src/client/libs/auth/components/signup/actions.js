"use server";

import { registerService } from "@de100/auth/services/register";
import { REGISTER_MESSAGES_ERRORS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import {
	authStrategy,
	createOneEmailVerificationRequests,
	createOneUser,
	deleteOneEmailVerificationRequestsByUserId,
	findOneUserByEmail,
} from "#server/libs/auth/init";
import { getSessionOptionsBasics } from "#server/libs/get-session-options-basics";

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
		return redirect("/auth/login");
	}

	switch (result.messageCode) {
		case REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED.messageCode:
			return redirect("/auth/2fa/setup");
		default:
			return result;
	}
}
