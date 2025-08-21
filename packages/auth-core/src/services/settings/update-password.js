/** @import { MultiErrorSingleSuccessResponse, SessionMetadata, SessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, JWTProvider, AuthProvidersWithGetSessionUtils } from "@de100/auth-shared/types" */

import {
	UPDATE_PASSWORD_MESSAGES_ERRORS,
	UPDATE_PASSWORD_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { verifyPasswordHash, verifyPasswordStrength } from "#utils/passwords.js";
import { createAuthSession } from "#utils/sessions/index.js";
import { updateUserPassword } from "#utils/users.js";

/**
 *
 * Handles updating a user's password, including validation and session management.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	ipAddress?: Exclude<AuthProvidersWithGetSessionUtils['ipAddress'], ((...props: any[]) => any)>;
 *  userAgent?: Exclude<AuthProvidersWithGetSessionUtils['userAgent'], ((...props: any[]) => any)>;
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		sessions: {
 * 			deleteAllByUserId: SessionsProvider['deleteAllByUserId'];
 * 		};
 * 		users: {
 * 			updateOnePassword: UsersProvider['updateOnePassword'];
 * 			getOnePasswordHash: UsersProvider['getOnePasswordHash'];
 * 		};
 * 	}>;
 * 	input: { currentPassword: unknown; newPassword: unknown };
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_PASSWORD_MESSAGES_ERRORS,
 *    UPDATE_PASSWORD_MESSAGES_SUCCESS,
 *    { session: Awaited<ReturnType<typeof createAuthSession>> }
 *  >
 * >}
 */
export async function updatePasswordService(props) {
	const { session, user } = props;

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

	const newSession = await createAuthSession({
		generateRandomId: props.generateRandomId,
		user: user,
		metadata: sessionInputBasicInfo,
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
		userAgent: props.userAgent,
		authStrategy: props.authStrategy,
		authProviders: {
			sessions: { createOne: props.authProviders.sessions.createOne },
			jwt: {
				createRefreshToken: props.authProviders.jwt?.createRefreshToken,
				createAccessToken: props.authProviders.jwt?.createAccessToken,
			},
		},
	});

	return {
		...UPDATE_PASSWORD_MESSAGES_SUCCESS.PASSWORD_UPDATED_SUCCESSFULLY,
		data: { session: newSession },
	};
}
