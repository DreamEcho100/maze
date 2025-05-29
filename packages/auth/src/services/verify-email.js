/** @import { SessionValidationResult, MultiErrorSingleSuccessResponse } from "#types.ts"; */
import { z } from "zod";

import { authConfig } from "#init/index.js";
import { VERIFY_EMAIL_MESSAGES_ERRORS, VERIFY_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToNumber } from "#utils/dates.js";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";

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

	const verificationRequest = await getUserEmailVerificationRequestFromRequest(user.id);
	if (verificationRequest === null) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (Date.now() >= dateLikeToNumber(verificationRequest.expiresAt)) {
		const newVerificationRequest = await createEmailVerificationRequest(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{ tx: options.tx },
		);
		await sendVerificationEmail(newVerificationRequest.email, newVerificationRequest.code);
		setEmailVerificationRequestCookie(newVerificationRequest);
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED_WE_SENT_NEW_CODE;
	}
	if (verificationRequest.code !== input.data.code) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	await Promise.all([
		deleteUserEmailVerificationRequest(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{ tx: options.tx },
		),
		authConfig.providers.passwordResetSession.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: options.tx },
		),
		authConfig.providers.users.updateEmailAndVerify(
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
