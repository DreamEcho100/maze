"use server";

import { cookies } from "next/headers";
import { resendEmailVerificationCodeService } from "@acme/auth/services/resend-email-verification-code";
import { verifyEmailUserService } from "@acme/auth/services/verify-email";
import {
	AUTH_URLS,
	RESEND_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_ERRORS,
} from "@acme/auth/utils/constants";

import { getCurrentSession } from "~/libs/auth/utils/get-current-session";
import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

/**
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyEmailAction(_prev, formData) {
	const cookiesManager = await cookies();
	const result = await verifyEmailUserService(
		{ code: formData.get("code") },
		{
			setCookie: cookiesManager.set,
			getCookie: (name) => cookiesManager.get(name)?.value,
			getCurrentSession: getCurrentSession,
		},
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
	}

	switch (result.messageCode) {
		case VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_CREDENTIALS_OR_MISSING_FIELDS.code:
			return {
				type: "error",
				statusCode: result.statusCode,
				message: result.message,
			};
		case VERIFY_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code:
			return redirect(AUTH_URLS.LOGIN);
		case VERIFY_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code:
			return redirect(AUTH_URLS.LOGIN);
		case VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.code:
			return redirect(AUTH_URLS.VERIFY_EMAIL);
		case VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED.code:
			return redirect(AUTH_URLS.VERIFY_EMAIL);
		case VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.code:
			return redirect(AUTH_URLS.VERIFY_EMAIL);
		case VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FA_NOT_SETUP.code:
			return redirect(AUTH_URLS.SETUP_2FA);
		default:
			return { type: "error", statusCode: 500, message: "Unexpected error" };
	}
}

/**
 * @param {ActionResult} _prev
 * @returns {Promise<ActionResult>}
 */
export async function resendEmailVerificationCodeAction(_prev) {
	const cookiesManager = await cookies();
	const result = await resendEmailVerificationCodeService({
		getCookie: (name) => cookiesManager.get(name)?.value,
		getCurrentSession: getCurrentSession,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
	}

	switch (result.messageCode) {
		case RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code:
			return redirect(AUTH_URLS.LOGIN);
		case RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code:
			return redirect(AUTH_URLS.LOGIN);
		default:
			return { type: "error", statusCode: 500, message: "Unexpected error" };
	}
}
