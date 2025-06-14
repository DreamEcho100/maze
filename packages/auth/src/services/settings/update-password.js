/** @import { UserAgent, MultiErrorSingleSuccessResponse, SessionMetadata, CookiesProvider, HeadersProvider, AuthStrategy, SessionsProvider, UsersProvider, AuthProvidersWithSessionAndJWTDefaults, JWTProvider } from "#types.ts" */

import {
	UPDATE_PASSWORD_MESSAGES_ERRORS,
	UPDATE_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { verifyPasswordHash, verifyPasswordStrength } from "#utils/passwords.js";
import {
	createAuthSession,
	generateAuthSessionToken,
	getCurrentAuthSession,
	setOneAuthSessionToken,
} from "#utils/strategy/index.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {Object} props
 * @param {Object} props.input The data containing the current and new passwords
 * @param {unknown} props.input.currentPassword The user's current password
 * @param {unknown} props.input.newPassword The new password to set for the user
 * @param {any} props.tx - Transaction object for database operations
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	sessions: {
 * 		deleteAllByUserId: SessionsProvider['deleteAllByUserId'];
 * 	};
 * 	jwt?: {
 * 		createRefreshToken: JWTProvider['createRefreshToken'];
 * 	};
 * 	users: {
 * 		updateOnePassword: UsersProvider['updateOnePassword'];
 * 		getOnePasswordHash: UsersProvider['getOnePasswordHash'];
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *    { session: ReturnType<typeof setOneAuthSessionToken> }
 *  >
 * >}
 */
export async function updatePasswordService(props) {
	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});

	if (!session) return UPDATE_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return UPDATE_PASSWORD_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
	}

	if (
		typeof props.input.currentPassword !== "string" ||
		typeof props.input.newPassword !== "string"
	) {
		return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORDS_REQUIRED;
	}

	const strongPassword = await verifyPasswordStrength(props.input.newPassword);
	if (!strongPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;

	const passwordHash = await props.authProviders.users.getOnePasswordHash(user.id);
	if (!passwordHash) return UPDATE_PASSWORD_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND;

	const validPassword = await verifyPasswordHash(passwordHash, props.input.currentPassword);
	if (!validPassword) return UPDATE_PASSWORD_MESSAGES_ERRORS.CURRENT_PASSWORD_INCORRECT;

	await Promise.all([
		props.authProviders.sessions.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: props.tx },
		),
		updateUserPassword(
			{ data: { password: props.input.newPassword }, where: { id: user.id } },
			{
				tx: props.tx,
				authProviders: {
					users: {
						updateOnePassword: props.authProviders.users.updateOnePassword,
					},
				},
			},
		),
	]);

	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: props.ipAddress ?? null,
		userAgent: props.userAgent ?? null,
		twoFactorVerifiedAt: session.twoFactorVerifiedAt,
		userId: user.id,
		metadata: session.metadata,
	};
	const sessionToken = generateAuthSessionToken(
		{ data: { user: user, metadata: sessionInputBasicInfo } },
		{
			authStrategy: props.authStrategy,
			authProviders: { jwt: { createRefreshToken: props.authProviders.jwt?.createRefreshToken } },
		},
	);
	const newSession = await createAuthSession(
		{
			data: {
				token: sessionToken,
				user: user,
				metadata: sessionInputBasicInfo,
			},
		},
		{
			authStrategy: props.authStrategy,
			authProviders: {
				sessions: { createOne: props.authProviders.sessions.createOne },
				jwt: { createTokenPair: props.authProviders.jwt?.createTokenPair },
			},
		},
	);
	const result = setOneAuthSessionToken(newSession, {
		cookies: props.cookies,
		userAgent: props.userAgent,
		authStrategy: props.authStrategy,
	});

	return {
		...UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY,
		data: { session: result },
	};
}
