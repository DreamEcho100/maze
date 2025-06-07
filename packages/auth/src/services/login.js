/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider } from "#types.ts" */

import { authConfig } from "#init/index.js";
import { LOGIN_MESSAGES_ERRORS, LOGIN_MESSAGES_SUCCESS } from "#utils/constants.js";
import { verifyPasswordHash } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";
import { loginServiceInputSchema } from "#utils/validations.js";

/**
 * Verifies the user's credentials and creates a session if valid.
 *
 * @param {unknown} data
 * @param {object} options
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session.
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGIN_MESSAGES_ERRORS,
 *    LOGIN_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function loginUserService(data, options) {
	const input = loginServiceInputSchema.safeParse(data);
	if (!input.success) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	const user = await authConfig.providers.users.findOneByEmail(input.data.email);
	if (!user) {
		return LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;
	}

	if (!user.emailVerifiedAt) {
		// return redirect("/auth/verify-email");
		return LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	const passwordHash = await authConfig.providers.users.getOnePasswordHash(user.id);
	if (!passwordHash) {
		return LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET;
	}

	const validPassword = await verifyPasswordHash(passwordHash, input.data.password);
	if (!validPassword) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: options.ipAddress ?? null,
		userAgent: options.userAgent ?? null,
		twoFactorVerifiedAt: null,
		userId: user.id,
		metadata: null,
	};
	const sessionToken = generateAuthSessionToken({
		data: { user: user, metadata: sessionInputBasicInfo },
	});
	const session = await createAuthSession({
		data: {
			token: sessionToken,
			user,
			metadata: sessionInputBasicInfo,
		},
	});
	const result = setOneAuthSessionToken(session, {
		cookies: options.cookies,
		userAgent: options.userAgent,
	});

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED;
	}

	if (user.twoFactorEnabledAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED;
	}

	return {
		...LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY,
		data: { session: result },
	};
}
