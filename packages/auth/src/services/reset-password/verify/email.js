/** @import { CookiesProvider, MultiErrorSingleSuccessResponse, PasswordResetSessionsProvider, UsersProvider } from "#types.ts" */

import {
	VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
	VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { validatePasswordResetSessionRequest } from "#utils/password-reset.js";
import { verifyPasswordResetEmailVerificationServiceSchemaInput } from "#utils/validations.js";

/**
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS[keyof typeof VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS] & { data: { nextStep: 'reset-password' | 'verify-2fa' } }} ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Handles the password reset email verification process.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {any} props.tx - Transaction object for database operations.
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {{
 * 	passwordResetSession: {
 * 	  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 	  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 	  markOneEmailAsVerified: PasswordResetSessionsProvider["markOneEmailAsVerified"];
 * 	};
 * 	users: {
 * 		verifyOneEmailIfMatches: UsersProvider["verifyOneEmailIfMatches"];
 * 	}
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_PASSWORD_RESET_MESSAGES_ERRORS,
 *    VERIFY_PASSWORD_RESET_MESSAGES_SUCCESS,
 *    { nextStep: 'reset-password' | 'verify-2fa' }
 *  >
 * >}
 */
export async function verifyPasswordResetEmailVerificationService(props) {
	const input = verifyPasswordResetEmailVerificationServiceSchemaInput.safeParse(props.input);
	if (!input.success) {
		return VERIFY_PASSWORD_RESET_MESSAGES_ERRORS.VERIFICATION_CODE_REQUIRED;
	}

	const { session, user } = await validatePasswordResetSessionRequest(props.cookies, {
		authProviders: {
			passwordResetSession: {
				deleteOne: props.authProviders.passwordResetSession.deleteOne,
				findOneWithUser: props.authProviders.passwordResetSession.findOneWithUser,
			},
		},
	});

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
		props.authProviders.users
			.verifyOneEmailIfMatches(
				{ where: { id: session.userId, email: session.email } },
				{ tx: props.tx },
			)
			.then((result) => {
				if (!result) {
					throw new Error("Email does not match the user's email.");
				}
				return true;
			}),
		// updateOnePasswordResetSessionAsEmailVerifiedRepository(session.id),
		props.authProviders.passwordResetSession.markOneEmailAsVerified(
			{ where: { id: session.id } },
			{ tx: props.tx },
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
