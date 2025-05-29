/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { z } from "zod";

import { authConfig } from "#init/index.js";
import {
	VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";

/**
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS] & { data: { nextStep: 'reset-password' | 'verify-2fa' } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

const codeSchema = z.string().length(6).regex(/^\d+$/);
const verifyCodeInput = z.object({ code: codeSchema });

/**
 * Handles the password reset email verification process.
 *
 * @param {unknown} code - The verification code submitted by the user.
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' | 'verify-2fa' }
 *  >
 * >}
 */
export async function verifyPasswordResetEmailVerificationService(code, options) {
	const input = verifyCodeInput.safeParse({ code });

	if (!input.success) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest();

	if (!session) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}
	if (session.emailVerifiedAt) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.ACCESS_DENIED;
	}
	if (input.data.code !== session.code) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	const [emailMatches] = await Promise.all([
		// setUserAsEmailVerifiedIfEmailMatchesRepository(session.userId, session.email),
		authConfig.providers.users
			.verifyOneEmailIfMatches(
				{ where: { id: session.userId, email: session.email } },
				{ tx: options.tx },
			)
			.then((result) => {
				if (!result) {
					throw new Error("Email does not match the user's email.");
				}
				return true;
			}),
		// updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
		authConfig.providers.passwordResetSession.markOneEmailAsVerified(
			{ where: { id: session.id } },
			{ tx: options.tx },
		),
	]).catch((err) => {
		console.error("Error verifying email:", err);
		return [null];
	});

	if (!emailMatches) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_EXPIRED_RESTART_REQUIRED;
	}

	return {
		...VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY,
		data: {
			nextStep: user.twoFactorEnabledAt ? "verify-2fa" : "reset-password",
		},
	};
}
