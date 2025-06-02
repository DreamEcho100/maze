/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { authConfig } from "#init/index.js";
import { UPDATE_EMAIL_MESSAGES_ERRORS, UPDATE_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { emailSchema } from "#utils/validations.js";

/**
 * Handles updating a user's email by validating input and creating a verification request.
 *
 * @param {string} email New email address to set for the user
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_EMAIL_MESSAGES_ERRORS,
 *    UPDATE_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function updateEmailService(email) {
	const input = emailSchema.safeParse(email);
	if (!input.success) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_REQUIRED;

	const validatedEmail = input.data;

	const { session, user } = await getCurrentAuthSession();
	if (!session) return UPDATE_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return UPDATE_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
	}

	// const emailAvailable = await getUserByEmailRepository(validatedEmail);
	const emailAvailable = await authConfig.providers.users.findOneByEmail(validatedEmail);
	if (emailAvailable) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;

	const verificationRequest = await createEmailVerificationRequest({
		where: { userId: user.id, email: validatedEmail },
	});
	await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(verificationRequest);

	return UPDATE_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
