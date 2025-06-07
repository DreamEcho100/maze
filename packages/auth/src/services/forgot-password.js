/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider } from "#types.ts"; */

import { authConfig } from "#init/index.js";
import {
	FORGET_PASSWORD_MESSAGES_ERRORS,
	FORGET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import {
	createPasswordResetSession,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
} from "#utils/password-reset.js";
import { generateAuthSessionToken, getCurrentAuthSession } from "#utils/strategy/index.js";
import { forgotPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the forgot password logic, verifying the user, creating a reset session, and sending the reset email.
 *
 * @param {unknown} data
 * @param {object} options - Options for the service.
 * @param {any} options.tx - Transaction object for database operations
 * @param {CookiesProvider} options.cookies - Cookies provider for session management.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    FORGET_PASSWORD_MESSAGES_ERRORS,
 *    FORGET_PASSWORD_MESSAGES_SUCCESS,
 *    { sessionToken: string; expiresAt: string }
 *  >
 * >}
 */
export async function forgotPasswordService(data, options) {
	const input = forgotPasswordServiceInputSchema.safeParse(data);
	const { session } = await getCurrentAuthSession({
		ipAddress: options.ipAddress,
		userAgent: options.userAgent,
		cookies: options.cookies,
		headers: options.headers,
	});

	if (!session) return FORGET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (!input.success) {
		return FORGET_PASSWORD_MESSAGES_ERRORS.EMAIL_REQUIRED;
	}

	const user = await authConfig.providers.users.findOneByEmail(input.data.email);
	if (!user) return FORGET_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: options.ipAddress ?? null,
		userAgent: options.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt,
		userId: user.id,
		metadata: session.metadata,
	};
	const sessionToken = generateAuthSessionToken({
		data: { user: user, metadata: sessionInputBasicInfo },
	});
	const [passwordResetEmailSession] = await Promise.all([
		createPasswordResetSession(
			{ data: { token: sessionToken, userId: user.id, email: user.email } },
			{ tx: options.tx },
		),
		authConfig.providers.passwordResetSession.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: options.tx },
		),
	]);

	await sendPasswordResetEmail(passwordResetEmailSession.email, passwordResetEmailSession.code);
	setPasswordResetSessionTokenCookie(
		sessionToken,
		passwordResetEmailSession.expiresAt,
		options.cookies,
	);

	return {
		...FORGET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_EMAIL_SENT,
		data: {
			sessionToken,
			expiresAt: dateLikeToISOString(passwordResetEmailSession.expiresAt),
		},
	};
}
