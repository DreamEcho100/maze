/** @import { MultiErrorSingleSuccessResponse, User, UserEmailVerificationRequestsProvider, UsersProvider } from "@de100/auth-shared/types"; */

import {
	ADMIN_REGISTER_MESSAGES_ERRORS,
	ADMIN_REGISTER_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { adminRegisterServiceInputSchema } from "@de100/auth-shared/validations";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
} from "#utils/email-verification.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createUser } from "#utils/users.js";

/**
 * Handles register by deleting the user session and clearing session cookies.
 *
 * @param {object} props
 * @param {unknown} props.input
 * @param {{
 * 	userEmailVerificationRequests: {
 * 		createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 		deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 	};
 * 	users: {
 * 		createOne: UsersProvider['createOne'];
 * 		findOneByEmail: UsersProvider['findOneByEmail'];
 * 	};
 * }} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    ADMIN_REGISTER_MESSAGES_ERRORS,
 *    ADMIN_REGISTER_MESSAGES_SUCCESS,
 *    { user: User; }
 *  >
 * >}
 */
export async function adminRegisterService(props) {
	const input = adminRegisterServiceInputSchema.safeParse(props.input);

	if (!input.success) {
		return ADMIN_REGISTER_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const emailAvailable = await props.authProviders.users.findOneByEmail(input.data.email);

	if (emailAvailable) {
		return ADMIN_REGISTER_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;
	}

	const strongPassword = await verifyPasswordStrength(input.data.password);

	if (!strongPassword) {
		return ADMIN_REGISTER_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
	}

	const user = await createUser(
		{
			name: input.data.name,
			email: input.data.email,
			password: input.data.password,
			displayName: input.data.displayName,
		},
		{
			authProviders: {
				users: { createOne: props.authProviders.users.createOne },
			},
		},
	);

	const userEmailVerificationRequests = await createEmailVerificationRequest(
		{
			where: { userId: user.id, email: user.email },
		},
		{
			authProviders: {
				userEmailVerificationRequests: {
					createOne: props.authProviders.userEmailVerificationRequests.createOne,
					deleteOneByUserId: props.authProviders.userEmailVerificationRequests.deleteOneByUserId,
				},
			},
		},
	);

	await sendVerificationEmail(
		userEmailVerificationRequests.email,
		userEmailVerificationRequests.code,
	);

	// await setEmailVerificationRequestCookie(
	//   userEmailVerificationRequests,
	//   options.setCookie,
	// );

	// const sessionToken = generateSessionToken();
	// const session = await createSession(sessionToken, user.id, {
	//   twoFactorVerifiedAt: null,
	// });

	// setSessionTokenCookie({
	//   token: sessionToken,
	//   expiresAt: session.expiresAt,
	//   setCookie: options.setCookie,
	// });

	if (user.twoFactorEnabledAt) {
		return ADMIN_REGISTER_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VALIDATION_REQUIRED;
	}

	// redirect("/auth/2fa/setup");
	// return redirect("/auth/login");
	return {
		...ADMIN_REGISTER_MESSAGES_SUCCESS.REGISTRATION_SUCCESSFUL,
		data: { user },
	};
}
