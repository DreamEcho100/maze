/** @import { UserAgent, MultiErrorSingleSuccessResponse, User, SessionMetadata, CookiesProvider, UserEmailVerificationRequestsProvider, SessionsProvider, UsersProvider, AuthStrategy, JWTProvider } from "#types.ts"; */

import { REGISTER_MESSAGES_ERRORS, REGISTER_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createUser } from "#utils/users.js";
import { registerServiceInputSchema } from "#utils/validations.js";

/**
 * Handles register by deleting the user session and clearing session cookies.
 *
 * @param {object} props - Options for the service.
 * @param {unknown} props.input
 * @param {CookiesProvider} props.cookies - Cookies provider for session management.
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session.
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session.
 * @param {AuthStrategy} props.authStrategy
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
 *    REGISTER_MESSAGES_ERRORS,
 *    REGISTER_MESSAGES_SUCCESS,
 *  >
 * >}
 */
export async function registerService(props) {
	const input = registerServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return REGISTER_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const emailAvailable = await props.authProviders.users.findOneByEmail(input.data.email);

	if (emailAvailable) {
		return REGISTER_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;
	}

	const strongPassword = await verifyPasswordStrength(input.data.password);

	if (!strongPassword) {
		return REGISTER_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
	}

	const user = await createUser(input.data.email, input.data.name, input.data.password, {
		authProviders: { users: { createOne: props.authProviders.users.createOne } },
	});

	const userEmailVerificationRequests = await createEmailVerificationRequest(
		{ where: { userId: user.id, email: user.email } },
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
	setEmailVerificationRequestCookie(userEmailVerificationRequests, props.cookies);

	return REGISTER_MESSAGES_SUCCESS.REGISTRATION_SUCCESSFUL;

	// /** @type {SessionMetadata} */
	// const sessionInputBasicInfo = {
	// 	ipAddress: props.ipAddress ?? null,
	// 	userAgent: props.userAgent ?? null,
	// 	twoFactorVerifiedAt: null,
	// 	userId: user.id,
	// 	metadata: null,
	// };
	// const sessionToken = generateAuthSessionToken(
	// 	{ data: { user: user, metadata: sessionInputBasicInfo, sessionId: session.id } },
	// 	{
	// 		authStrategy: props.authStrategy,
	// 		authProviders: { jwt: { createRefreshToken: props.authProviders.jwt?.createRefreshToken } },
	// 	},
	// );
	// const session = await createAuthSession({
	// 	// token: sessionToken,
	// 	generateRandomId: props.generateRandomId,
	// 	cookies: props.cookies,
	// 	userAgent: props.userAgent,
	// 	user,
	// 	metadata: sessionInputBasicInfo,
	// 	authStrategy: props.authStrategy,
	// 	authProviders: {
	// 		sessions: {
	// 			createOne: props.authProviders.sessions.createOne,
	// 		},
	// 		jwt: { createTokenPair: props.authProviders.jwt?.createTokenPair },
	// 	},
	// });
	// const result = setOneAuthSessionToken(session, {
	// 	cookies: props.cookies,
	// 	userAgent: props.userAgent,
	// 	authStrategy: props.authStrategy,
	// });

	// if (user.twoFactorEnabledAt) {
	// 	return REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED;
	// }

	// redirect("/auth/2fa/setup");
	// return redirect("/auth/login");
	// return {
	// 	...REGISTER_MESSAGES_SUCCESS.REGISTRATION_SUCCESSFUL,
	// 	data: { user, session: result },
	// };
}
