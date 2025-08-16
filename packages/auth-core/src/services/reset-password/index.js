/** @import { MultiErrorSingleSuccessResponse, SessionMetadata, PasswordResetSessionsProvider, SessionsProvider, UsersProvider, JWTProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import {
	RESET_PASSWORD_MESSAGES_ERRORS,
	RESET_PASSWORD_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import {
	deletePasswordResetSessionTokenCookie,
	validatePasswordResetSessionRequest,
} from "#utils/password-reset.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createAuthSession } from "#utils/sessions/index.js";
import { updateUserPassword } from "#utils/users.js";
import { resetPasswordServiceInputSchema } from "#utils/validations.js";

/**
 * Handles the reset password process, including validation and session management.
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
 * 		};
 * 		passwordResetSession: {
 * 		  findOneWithUser: PasswordResetSessionsProvider["findOneWithUser"];
 * 		  deleteOne: PasswordResetSessionsProvider["deleteOne"];
 * 			deleteAllByUserId: PasswordResetSessionsProvider["deleteAllByUserId"];
 * 		};
 * 	}>;
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESET_PASSWORD_MESSAGES_ERRORS,
 *    RESET_PASSWORD_MESSAGES_SUCCESS,
 *    { session: Awaited<ReturnType<typeof newSession>> }
 *  >
 * >}
 */
export async function resetPasswordService(props) {
	const { user } = props;

	const input = resetPasswordServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return RESET_PASSWORD_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { password } = input.data;

	const { session: passwordResetSession } =
		await validatePasswordResetSessionRequest({
			cookies: props.cookies,
			authProviders: {
				passwordResetSession: {
					deleteOne: props.authProviders.passwordResetSession.deleteOne,
					findOneWithUser:
						props.authProviders.passwordResetSession.findOneWithUser,
				},
			},
		});

	if (!passwordResetSession) {
		return RESET_PASSWORD_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
	}

	if (!passwordResetSession.emailVerifiedAt) {
		return RESET_PASSWORD_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED;
	}

	if (
		user.twoFactorEnabledAt &&
		user.twoFactorRegisteredAt &&
		!passwordResetSession.twoFactorVerifiedAt
	) {
		return RESET_PASSWORD_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return RESET_PASSWORD_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
	}
	/** @type {SessionMetadata} */
	const sessionInputBasicInfo = {
		ipAddress: props.ipAddress ?? null,
		userAgent: props.userAgent ?? null,
		twoFactorVerifiedAt: passwordResetSession.twoFactorVerifiedAt,
		userId: user.id,
		metadata: null,
	};
	await Promise.all([
		props.authProviders.passwordResetSession.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		props.authProviders.sessions.deleteAllByUserId(
			{ where: { userId: passwordResetSession.userId } },
			{ tx: props.tx },
		),
		updateUserPassword(
			{ data: { password }, where: { id: user.id } },
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
	deletePasswordResetSessionTokenCookie({
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
	});

	const newSession = await createAuthSession({
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
		userAgent: props.userAgent,
		generateRandomId: props.generateRandomId,
		metadata: sessionInputBasicInfo,
		user,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: {
			sessions: {
				createOne: props.authProviders.sessions.createOne,
			},
			jwt: {
				createRefreshToken: props.authProviders.jwt?.createRefreshToken,
				createAccessToken: props.authProviders.jwt?.createAccessToken,
			},
		},
	});

	return {
		...RESET_PASSWORD_MESSAGES_SUCCESS.PASSWORD_RESET_SUCCESSFUL,
		data: { session: newSession },
	};
}
