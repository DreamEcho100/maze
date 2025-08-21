/** @import { MultiErrorSingleSuccessResponse, User, UsersProvider } from "@de100/auth-shared/types"; */

import {
	ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS,
	ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {object} props
 * @param {{
 *  newPassword: string,
 *  userId: string,
 * }} props.input
 * @param {{
 * 	users: {
 * 		updateOnePassword: UsersProvider['updateOnePassword'];
 * 	}
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *    { user: User; }
 *  >
 * >}
 */
export async function adminUpdatePasswordService(props) {
	if (typeof props.input.newPassword !== "string") {
		return ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_REQUIRED;
	}

	const strongPassword = await verifyPasswordStrength(props.input.newPassword);
	if (!strongPassword) return ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;

	const updatedUser = await updateUserPassword(
		{
			data: { password: props.input.newPassword },
			where: { id: props.input.userId },
		},
		{
			authProviders: {
				users: {
					updateOnePassword: props.authProviders.users.updateOnePassword,
				},
			},
		},
	);

	return {
		...ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY,
		data: { user: updatedUser },
	};
}
