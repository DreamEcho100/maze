"use server";

import { resendEmailVerificationCodeService } from "@de100/auth-core/services/resend-email-verification-code";
import { verifyEmailUserService } from "@de100/auth-core/services/verify-email";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
	RESEND_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_ERRORS,
} from "@de100/auth-core/utils/constants";
import {
	createOneEmailVerificationRequests,
	deleteAllPasswordResetSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneEmailVerificationRequestsByIdAndUserId,
	updateOneUserEmailAndVerify,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) => verifyEmailUserService({ ...authProps, tx }));

	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
		return result;
	}

	switch (result.messageCode) {
		case VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS.messageCode:
			return {
				type: "error",
				statusCode: result.statusCode,
				message: result.message,
			};
		case VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
			await redirect(AUTH_URLS.LOGIN);
			return result;
		case VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
			await redirect(AUTH_URLS.LOGIN);
			return result;
		// case VERIFY_EMAIL_MESSAGES_ERRORS.ENTER_YOUR_CODE.messageCode:
		// 	await redirect(AUTH_URLS.VERIFY_EMAIL);
		// return result;
		case VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED_WE_SENT_NEW_CODE.messageCode:
			await redirect(AUTH_URLS.VERIFY_EMAIL);
			return result;
		// case VERIFY_EMAIL_MESSAGES_ERRORS.INCORRECT_CODE.messageCode:
		// 	await redirect(AUTH_URLS.VERIFY_EMAIL);
		// return result;
		case VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE.messageCode:
			await redirect(AUTH_URLS.SETUP_2FA);
			return result;
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		resendEmailVerificationCodeService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
		return result;
	}

	switch (result.messageCode) {
		case RESEND_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
			await redirect(AUTH_URLS.LOGIN);
			return result;
		case RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
			await redirect(AUTH_URLS.LOGIN);
			return result;
		default:
			return { type: "error", statusCode: 500, message: "Unexpected error" };
	}
}
