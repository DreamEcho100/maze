/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider } from "#types.ts" */

import {
	UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
	UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";
import { updateUserTwoFactorEnabledService } from "#utils/users.js";
import { updateIsTwoFactorServiceInputSchema } from "#utils/validations.js";

/**
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS[keyof typeof UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Toggles two-factor authentication based on the input.
 *
 * @param {unknown} data
 * @param {object} options - Options for the service.
 * @param {CookiesProvider} options.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} options.headers - The headers provider to access the session token.
 * @param {string|null|undefined} options.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} options.userAgent - Optional user agent for the session
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
 *    UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function updateIsTwoFactorService(data, options) {
	// const input = formBoolSchema.safeParse(isTwoFactorEnabled);
	const input = updateIsTwoFactorServiceInputSchema.safeParse(data);

	if (!input.success) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.INVALID_2FA_INPUT;

	const isTwoFactorEnabled = input.data.isTwoFactorEnabled;

	const { session, user } = await getCurrentAuthSession({
		ipAddress: options.ipAddress,
		userAgent: options.userAgent,
		cookies: options.cookies,
		headers: options.headers,
	});
	if (!session) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	await updateUserTwoFactorEnabledService(user.id, isTwoFactorEnabled ? new Date() : null);

	return UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS.TWO_FACTOR_STATUS_UPDATED_SUCCESSFULLY;
}
