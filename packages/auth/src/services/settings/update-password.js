/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { sessionProvider } from "#providers/sessions.js";
import { usersProvider } from "#providers/users.js";
import {
	UPDATE_PASSWORD_MESSAGES_ERRORS,
	UPDATE_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { verifyPasswordHash, verifyPasswordStrength } from "#utils/passwords.js";
import {
	createSession,
	generateSessionToken,
	getCurrentSession,
	setSessionTokenCookie,
} from "#utils/sessions.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {Object} props The properties for the update password service
 * @param {Object} props.data The data containing the current and new passwords
 * @param {unknown} props.data.currentPassword The user's current password
 * @param {unknown} props.data.newPassword The new password to set for the user
 * @param {{ tx: any }} options Options for the service, including transaction management
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function updatePasswordService(props, options) {
	const { session, user } = await getCurrentSession();

	if (!session) return UPDATE_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return UPDATE_PASSWORD_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
	}

	if (
		typeof props.data.currentPassword !== "string" ||
		typeof props.data.newPassword !== "string"
	) {
		return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORDS_REQUIRED;
	}

	const strongPassword = await verifyPasswordStrength(props.data.newPassword);
	if (!strongPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;

	const passwordHash = await usersProvider.getOnePasswordHash(user.id);
	if (!passwordHash) return UPDATE_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

	const validPassword = await verifyPasswordHash(passwordHash, props.data.currentPassword);
	if (!validPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.CURRENT_PASSWORD_INCORRECT;

	await Promise.all([
		sessionProvider.invalidateAllByUserId({ where: { userId: user.id } }, { tx: options.tx }),
		updateUserPassword(
			{ data: { password: props.data.newPassword }, where: { id: user.id } },
			{ tx: options.tx },
		),
	]);

	const sessionToken = generateSessionToken();
	const newSession = await createSession(
		{
			data: {
				token: sessionToken,
				userId: user.id,
				flags: { twoFactorVerifiedAt: session.twoFactorVerifiedAt },
			},
		},
		{ tx: options.tx },
	);

	setSessionTokenCookie({
		token: sessionToken,
		expiresAt: newSession.expiresAt,
	});

	return UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY;
}
