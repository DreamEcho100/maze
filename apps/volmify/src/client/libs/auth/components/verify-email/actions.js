"use server";

import { resendEmailVerificationCodeService } from "@de100/auth/services/resend-email-verification-code";
import { verifyEmailUserService } from "@de100/auth/services/verify-email";
import {
	AUTH_URLS,
	RESEND_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_ERRORS,
} from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateGetCurrentAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	createOneEmailVerificationRequests,
	deleteAllPasswordResetSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneEmailVerificationRequestsByIdAndUserId,
	updateOneUserEmailAndVerify,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

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
	const result = await db.transaction(async (tx) =>
		verifyEmailUserService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { code: formData.get("code") },
				authProviders: {
					passwordResetSessions: {
						deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
					},
					users: { updateOneEmailAndVerify: updateOneUserEmailAndVerify },
					userEmailVerificationRequests: {
						findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
						createOne: createOneEmailVerificationRequests,
						deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
					},
				},
			}),
		),
	);

	console.log("___ verifyEmailAction result", result);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
	}

	switch (result.messageCode) {
		case VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS.messageCode:
			return {
				type: "error",
				statusCode: result.statusCode,
				message: result.message,
			};
		case VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
			return redirect(AUTH_URLS.LOGIN);
		case VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
			return redirect(AUTH_URLS.LOGIN);
		// case VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.messageCode:
		// 	return redirect(AUTH_URLS.VERIFY_EMAIL);
		case VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED_WE_SENT_NEW_CODE.messageCode:
			return redirect(AUTH_URLS.VERIFY_EMAIL);
		// case VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.messageCode:
		// 	return redirect(AUTH_URLS.VERIFY_EMAIL);
		case VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE.messageCode:
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
	const result = await db.transaction(async (tx) =>
		resendEmailVerificationCodeService(
			await generateGetCurrentAuthSessionProps({
				tx,
				authProviders: {
					userEmailVerificationRequests: {
						findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
						createOne: createOneEmailVerificationRequests,
						deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
					},
				},
			}),
		),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
	}

	switch (result.messageCode) {
		case RESEND_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
			return redirect(AUTH_URLS.LOGIN);
		case RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
			return redirect(AUTH_URLS.LOGIN);
		default:
			return { type: "error", statusCode: 500, message: "Unexpected error" };
	}
}
