/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { z } from "zod";

import { usersProvider } from "#providers/index.js";
import { LOGIN_MESSAGES_ERRORS, LOGIN_MESSAGES_SUCCESS } from "#utils/constants.js";
import { verifyPasswordHash } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";

/**
 * Verifies the user's credentials and creates a session if valid.
 *
 * @param {unknown} data
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    LOGIN_MESSAGES_ERRORS,
 *    LOGIN_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
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

	const user = await usersProvider.findOneByEmail(input.data.email);
	if (user === null) {
		return LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;
	}

	if (!user.emailVerifiedAt) {
		// return redirect("/auth/verify-email");
		return LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	const passwordHash = await usersProvider.getOnePasswordHash(user.id);
	if (!passwordHash) {
		return LOGIN_MESSAGES_ERRORS.USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET;
	}

	const validPassword = await verifyPasswordHash(passwordHash, input.data.password);
	if (!validPassword) {
		return LOGIN_MESSAGES_ERRORS.INVALID_CREDENTIALS;
	}

	const sessionToken = generateAuthSessionToken({ data: { userId: user.id } });
	const session = await createAuthSession({
		data: {
			token: sessionToken,
			userId: user.id,
			flags: {
				twoFactorVerifiedAt: null,
			},
		},
	});
	const result = setOneAuthSessionToken({
		token: sessionToken,
		data: session,
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
