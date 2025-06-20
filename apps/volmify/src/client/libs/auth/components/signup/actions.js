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
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function signupAction(_prev, formData) {
	const result = await registerService({
		...(await getSessionOptionsBasics()),
		input: {
			email: formData.get("email"),
			name: formData.get("name"),
			password: formData.get("password"),
			enable2FA: formData.get("enable_2fa") === "on",
		},
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
