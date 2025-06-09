"use server";

import { authConfig } from "@de100/auth/init";
import { loginUserService } from "@de100/auth/services/login";
import { AUTH_URLS, LOGIN_MESSAGES_ERRORS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { setDrizzlePgAuthProviders } from "#server/libs/auth/init";
import { getSessionOptionsBasics } from "#server/libs/get-session-options-basics";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function loginAction(_prev, formData) {
	const data = {
		email: formData.get("email"),
		password: formData.get("password"),
	};
	await setDrizzlePgAuthProviders();

	const result = await loginUserService(data, await getSessionOptionsBasics());

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_LOGIN);
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
			return { type: "error", statusCode: 500, message: "Unexpected error" };
	}
}
