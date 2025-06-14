/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, SessionsProvider, UsersProvider, JWTProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts" */

import {
	UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS,
	UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
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
 * @param {object} props - Options for the service.
 * @param {any} props.tx
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	users: {
 * 		updateOne2FAEnabled: UsersProvider['updateOne2FAEnabled'];
 * 	}
 * }>} props.authProviders
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

	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});
	if (!session) return UPDATE_IS_TWO_FACTOR_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	await updateUserTwoFactorEnabledService(user.id, isTwoFactorEnabled ? new Date() : null, {
		authProviders: {
			users: { updateOne2FAEnabled: props.authProviders.users.updateOne2FAEnabled },
		},
	});

	return UPDATE_IS_TWO_FACTOR_MESSAGES_SUCCESS.TWO_FACTOR_STATUS_UPDATED_SUCCESSFULLY;
}
