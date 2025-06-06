/** @import { UserAgent, MultiErrorSingleSuccessResponse, User } from "#types.ts"; */

import { authConfig } from "#init/index.js";
import { REGISTER_MESSAGES_ERRORS, REGISTER_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";
import { createUser } from "#utils/users.js";
import { registerServiceInputSchema } from "#utils/validations.js";

/**
 * Handles register by deleting the user session and clearing session cookies.
 *
 * @param {unknown} data
 * @param {object} options
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    REGISTER_MESSAGES_ERRORS,
 *    REGISTER_MESSAGES_SUCCESS,
 *    { user: User; session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function registerService(data, options) {
	const input = registerServiceInputSchema.safeParse(data);
	if (!input.success) {
		return REGISTER_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const emailAvailable = await authConfig.providers.users.findOneByEmail(input.data.email);

	if (emailAvailable) {
		return REGISTER_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;
	}

	const strongPassword = await verifyPasswordStrength(input.data.password);

	if (!strongPassword) {
		return REGISTER_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
	}

	const user = await createUser(input.data.email, input.data.name, input.data.password);

	const emailVerificationRequest = await createEmailVerificationRequest({
		where: { userId: user.id, email: user.email },
	});

	await sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
	setEmailVerificationRequestCookie(emailVerificationRequest);

	const sessionToken = generateAuthSessionToken({ data: { userId: user.id } });
	const session = await createAuthSession({
		data: {
			token: sessionToken,
			userId: user.id,
			ipAddress: options.ipAddress ?? null,
			userAgent: options.userAgent ?? null,
			flags: {
				twoFactorVerifiedAt: null,
			},
		},
	});
	const result = setOneAuthSessionToken(session);

	if (user.twoFactorEnabledAt) {
		return REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED;
	}

	// redirect("/auth/2fa/setup");
	// return redirect("/auth/login");
	return {
		...REGISTER_MESSAGES_SUCCESS.REGISTRATION_SUCCESSFUL,
		data: { user, session: result },
	};
}
