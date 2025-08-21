/** @import { MultiErrorSingleSuccessResponse, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "@de100/auth-shared/types" */

import {
	UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
	UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { updateIsTwoFactorServiceInputSchema } from "@de100/auth-shared/validations";
import { updateUserTwoFactorEnabledService } from "#utils/users.js";

/**
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Toggles two-factor authentication based on the input.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		users: {
 * 			updateOne2FAEnabled: UsersProvider['updateOne2FAEnabled'];
 * 		}
 * 	}>;
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function updateIsTwoFactorService(props) {
	// const input = formBoolSchema.safeParse(isTwoFactorEnabled);
	const input = updateIsTwoFactorServiceInputSchema.safeParse(props.input);

	if (!input.success) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.INVALID_2FA_INPUT;

	const isTwoFactorEnabled = input.data.isTwoFactorEnabled;

	const { user } = props;

	await updateUserTwoFactorEnabledService(user.id, isTwoFactorEnabled ? new Date() : null, {
		authProviders: {
			users: {
				updateOne2FAEnabled: props.authProviders.users.updateOne2FAEnabled,
			},
		},
	});

	return UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS.TWO_FACTOR_STATUS_UPDATED_SUCCESSFULLY;
}
