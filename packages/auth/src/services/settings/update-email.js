/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, UsersProvider, UserEmailVerificationRequestsProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts" */

import { UPDATE_EMAIL_MESSAGES_ERRORS, UPDATE_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { updateEmailServiceInputSchema } from "#utils/validations.js";

/**
 * Handles updating a user's email by validating input and creating a verification request.
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
 * 		findOneByEmail: UsersProvider['findOneByEmail'];
 * 	}
 * 	userEmailVerificationRequests: {
 * 		deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 		createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 	}
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_EMAIL_MESSAGES_ERRORS,
 *    UPDATE_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function updateEmailService(props) {
	// const input = emailSchema.safeParse(email);
	const input = updateEmailServiceInputSchema.safeParse(props.input);
	if (!input.success) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_REQUIRED;

	const validatedEmail = input.data.email;

	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});
	if (!session) return UPDATE_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return UPDATE_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
	}

	// const emailAvailable = await getUserByEmailRepository(validatedEmail);
	const emailAvailable = await props.authProviders.users.findOneByEmail(validatedEmail);
	if (emailAvailable) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;

	const verificationRequest = await createEmailVerificationRequest(
		{
			where: { userId: user.id, email: validatedEmail },
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
	await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(verificationRequest, props.cookies);

	return UPDATE_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
