"use server";

import { resendEmailVerificationCodeService } from "@de100/auth/services/resend-email-verification-code";
import { verifyEmailUserService } from "@de100/auth/services/verify-email";
import {
	AUTH_URLS,
	RESEND_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_ERRORS,
} from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	createOneEmailVerificationRequests,
	deleteAllPasswordResetSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneEmailVerificationRequestsByIdAndUserId,
	updateOneUserEmailAndVerify,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 * @param {{ code: unknown }} input
 */
export async function verifyEmailAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
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
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) => verifyEmailUserService({ ...authProps, tx }));

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

export async function resendEmailVerificationCodeAction() {
	const authProps = await generateAuthSessionProps({
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
				createOne: createOneEmailVerificationRequests,
				deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
			},
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		resendEmailVerificationCodeService({
			...authProps,
			tx,
		}),
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
