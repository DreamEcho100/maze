"use server";

import { loginUserService } from "@de100/auth/services/login";
import { AUTH_URLS, LOGIN_MESSAGES_ERRORS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import {
	authStrategy,
	createOneSession,
	findOneUserByEmail,
	getOneUserPasswordHash,
} from "#server/libs/auth/init";
import { getSessionOptionsBasics } from "#server/libs/get-session-options-basics";

/**
 * @param {{ email: unknown, password: unknown }} input
 */
export async function loginAction(input) {
	const result = await loginUserService({
		...(await getSessionOptionsBasics()),
		input,
		authStrategy,
		authProviders: {
			sessions: { createOne: createOneSession },
			users: {
				findOneByEmail: findOneUserByEmail,
				getOnePasswordHash: getOneUserPasswordHash,
			},
		},
	});

	if (result.type === "success") {
		// return redirect(AUTH_URLS.SUCCESS_LOGIN);
		return result;
	}

	switch (result.messageCode) {
		case LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS.messageCode:
			return result;
		case LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND.messageCode:
			return redirect(AUTH_URLS.REGISTER);
		case LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED.messageCode:
			return redirect(AUTH_URLS.VERIFY_EMAIL);
		case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED.messageCode:
			return redirect(AUTH_URLS.SETUP_2FA);
		case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED.messageCode:
			return redirect(AUTH_URLS.TWO_FA);
		default:
			return { type: /** @type {const} */ ("error"), statusCode: 500, message: "Unexpected error" };
	}
}
