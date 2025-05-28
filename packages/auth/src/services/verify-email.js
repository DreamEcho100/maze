/** @import { SessionValidationResult, MultiErrorSingleSuccessResponse } from "#types.ts"; */
import { z } from "zod";

import { passwordResetSessionProvider, usersProvider } from "#providers/index.js";
import { VERIFY_EMAIL_MESSAGES_ERRORS, VERIFY_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToNumber } from "#utils/dates.js";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
} from "#utils/email-verification.js";
import { getCurrentAuthSession } from "#utils/startegy/index.js";

/**
 *
 * @param {unknown} data
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_EMAIL_MESSAGES_ERRORS,
 *    VERIFY_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function verifyEmailUserService(data, options) {
	const input = z
		.object({
			code: z.string().min(6),
		})
		.safeParse(data);

	if (!input.success) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { session, user } = await getCurrentAuthSession();
	if (session === null) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(user.id);
	if (verificationRequest === null) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (Date.now() >= dateLikeToNumber(verificationRequest.expiresAt)) {
		verificationRequest = await createEmailVerificationRequest(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{ tx: options.tx },
		);
		await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED;
	}
	if (verificationRequest.code !== input.data.code) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	await Promise.all([
		deleteUserEmailVerificationRequest(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{ tx: options.tx },
		),
		passwordResetSessionProvider.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: options.tx },
		),
		usersProvider.updateEmailAndVerify(
			{ data: { email: verificationRequest.email }, where: { id: user.id } },
			{ tx: options.tx },
		),
	]);

	deleteEmailVerificationRequestCookie();

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		// return redirect("/2fa/setup");
		return VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE;
	}

	return VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY;
	// return redirect("/");
}
