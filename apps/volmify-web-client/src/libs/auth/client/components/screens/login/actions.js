"use server";

import { loginUserService } from "@de100/auth-core/services/login";
import {
	AUTH_URLS,
	LOGIN_MESSAGES_ERRORS,
} from "@de100/auth-core/utils/constants";
import {
	authStrategy,
	createOneSession,
	findOneUserByEmail,
	getOneUserPasswordHash,
} from "@de100/db/auth/init";
import { redirect } from "#libs/i18n/server/utils.ts";
import { getSessionOptionsBasics } from "#libs/server/get-session-options-basics.js";
// import { getSessionOptionsBasics } from "#libs/server/get-session-options-basics.js";

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
		// throw redirect(AUTH_URLS.SUCCESS_LOGIN);
		return result;
	}

	switch (result.messageCode) {
		case LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS.messageCode:
			return result;
		case LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND.messageCode:
			await redirect(AUTH_URLS.REGISTER);
			return result;
		case LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED.messageCode:
			await redirect(AUTH_URLS.VERIFY_EMAIL);
			return result;
		case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED.messageCode:
			await redirect(AUTH_URLS.SETUP_2FA);
			return result;
		case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED.messageCode:
			await redirect(AUTH_URLS.TWO_FA);
			return result;
		default:
			return {
				type: /** @type {const} */ ("error"),
				statusCode: 500,
				message: "Unexpected error",
			};
	}
}
