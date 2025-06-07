/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider } from "#types.ts" */

import { authConfig } from "#init/index.js";
import { UPDATE_EMAIL_MESSAGES_ERRORS, UPDATE_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { updateEmailServiceInputSchema } from "#utils/validations.js";

/**
 * Handles updating a user's email by validating input and creating a verification request.
 *
 * @param {unknown} data
 * @param {object} options - Options for the service.
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_EMAIL_MESSAGES_ERRORS,
 *    UPDATE_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function updateEmailService(data, options) {
	// const input = emailSchema.safeParse(email);
	const input = updateEmailServiceInputSchema.safeParse(data);
	if (!input.success) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_REQUIRED;

	const validatedEmail = input.data.email;

	const { session, user } = await getCurrentAuthSession({
		ipAddress: options.ipAddress,
		userAgent: options.userAgent,
		cookies: options.cookies,
		headers: options.headers,
	});
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
	setEmailVerificationRequestCookie(verificationRequest, options.cookies);

	return UPDATE_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
