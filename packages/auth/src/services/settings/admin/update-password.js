/** @import { MultiErrorSingleSuccessResponse, User } from "#types.ts"; */

import {
	ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS,
	ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {{
 *  newPassword: string,
 *  userId: string,
 * }} data
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *    { user: User; }
 *  >
 * >}
 */
export async function adminUpdatePasswordService(data) {
	if (typeof data.newPassword !== "string") {
		return ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_REQUIRED;
	}

	const strongPassword = await verifyPasswordStrength(data.newPassword);
	if (!strongPassword) return ADMIN_UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;

	const updatedUser = await updateUserPassword({
		data: { password: data.newPassword },
		where: { id: data.userId },
	});

	return {
		...ADMIN_UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY,
		data: { user: updatedUser },
	};
}
