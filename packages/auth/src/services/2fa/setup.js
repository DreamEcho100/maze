/** @import { MultiErrorSingleSuccessResponse } from "#types.ts"; */

import { z } from "zod";

import { sessionProvider } from "#providers/index.js";
import { SETUP_2FA_MESSAGES_ERRORS, SETUP_2FA_MESSAGES_SUCCESS } from "#utils/constants.js";
import { decodeBase64, verifyTOTP } from "#utils/index.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { updateUserTOTPKey } from "#utils/users.js";

/**
 * Handles the setup of 2FA, including validating inputs, decoding the key, and updating session and user records.
 *
 * @param {unknown} data
 * @param {{ tx: any }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    SETUP_2FA_MESSAGES_ERRORS,
 *    SETUP_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function setup2FAService(data, options) {
	const input = z
		.object({ code: z.string().min(6), encodedKey: z.string().min(28) })
		.safeParse(data);

	if (!input.success) {
		return SETUP_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { session, user } = await getCurrentAuthSession();
	if (!session) {
		return SETUP_2FA_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!user.twoFactorEnabledAt) {
		return SETUP_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (!user.emailVerifiedAt || (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt)) {
		return SETUP_2FA_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	let key;
	try {
		key = decodeBase64(input.data.encodedKey);
	} catch {
		return SETUP_2FA_MESSAGES_ERRORS.TOTP_KEY_INVALID;
	}

	if (key.byteLength !== 20) {
		return SETUP_2FA_MESSAGES_ERRORS.TOTP_KEY_INVALID;
	}

	if (!verifyTOTP(key, 30, 6, input.data.code)) {
		return SETUP_2FA_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	await Promise.all([
		updateUserTOTPKey({ data: { key }, where: { userId: user.id } }, { tx: options.tx }),
		// markOne2FAVerifiedRepository(session.id),
		sessionProvider.markOne2FAVerified({ where: { id: session.id } }, { tx: options.tx }),
	]);

	return SETUP_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
