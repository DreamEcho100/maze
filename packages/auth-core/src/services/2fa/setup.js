/** @import { MultiErrorSingleSuccessResponse, SessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import {
	SETUP_2FA_MESSAGES_ERRORS,
	SETUP_2FA_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { decodeBase64, verifyTOTP } from "#utils/index.js";
import { updateUserTOTPKey } from "#utils/users.js";
import { setup2FAServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the setup of 2FA, including validating inputs, decoding the key, and updating session and user records.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		sessions: {
 * 			markOne2FAVerified: SessionsProvider['markOne2FAVerified'];
 * 		};
 * 		users: {
 * 			updateOneTOTPKey: UsersProvider['updateOneTOTPKey'];
 * 		}
 * 	}>;
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    SETUP_2FA_MESSAGES_ERRORS,
 *    SETUP_2FA_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function setup2FAService(props) {
	const input = setup2FAServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return SETUP_2FA_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { session, user } = props;

	if (!user.twoFactorEnabledAt) {
		return SETUP_2FA_MESSAGES_ERRORS.TWO_FACTOR_NOT_ENABLED;
	}

	if (
		!user.emailVerifiedAt ||
		(user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt)
	) {
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
		updateUserTOTPKey(
			{ data: { key }, where: { userId: user.id } },
			{
				tx: props.tx,
				authProviders: {
					users: {
						updateOneTOTPKey: props.authProviders.users.updateOneTOTPKey,
					},
				},
			},
		),
		props.authProviders.sessions.markOne2FAVerified(
			{ where: { id: session.id } },
			{ tx: props.tx },
		),
	]);

	return SETUP_2FA_MESSAGES_SUCCESS.TWO_FACTOR_RESET_SUCCESSFUL;
}
