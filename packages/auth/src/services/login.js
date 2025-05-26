/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { z } from "zod";

import { userProvider } from "#providers/users.js";
import { LOGIN_MESSAGES_ERRORS, LOGIN_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToISOString } from "#utils/dates.js";
import { verifyPasswordHash } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";

/**
 * Verifies the user's credentials and creates a session if valid.
 *
 * @param {unknown} data
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGIN_MESSAGES_ERRORS,
 *    LOGIN_MESSAGES_SUCCESS,
 *    { sessionToken: string; expiresAt: string }
 *  >
 * >}
 */
export async function loginUserService(data) {
	const input = z
		.object({
			email: z.string().email(),
			password: z.string().min(6),
		})
		.safeParse(data);

	if (!input.success) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	const user = await userProvider.findOneByEmail(input.data.email);
	if (user === null) {
		return LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;
	}

	if (!user.emailVerifiedAt) {
		// return redirect("/auth/verify-email");
		return LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	const passwordHash = await userProvider.getOnePasswordHash(user.id);
	if (!passwordHash) {
		return LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET;
	}

	const validPassword = await verifyPasswordHash(passwordHash, input.data.password);
	if (!validPassword) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	const sessionToken = generateSessionToken();
	const session = await createSession({
		data: {
			token: sessionToken,
			userId: user.id,
			flags: {
				twoFactorVerifiedAt: null,
			},
		},
	});
	setSessionTokenCookie({
		expiresAt: session.expiresAt,
		token: sessionToken,
	});

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED;
	}

	if (user.twoFactorEnabledAt) {
		return LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED;
	}

	return {
		...LOGIN_MESSAGES_SUCCESS.LOGGED_IN_SUCCESSFULLY,
		data: {
			sessionToken,
			expiresAt: dateLikeToISOString(session.expiresAt),
		},
	};
}
