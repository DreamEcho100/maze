/** @import { MultiErrorSingleSuccessResponse, UsersProvider, UserEmailVerificationRequestsProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts" */

import {
	UPDATE_EMAIL_MESSAGES_ERRORS,
	UPDATE_EMAIL_MESSAGES_SUCCESS,
} from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { updateEmailServiceInputSchema } from "#utils/validations.js";

/**
 * Handles updating a user's email by validating input and creating a verification request.
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		users: {
 * 			findOneByEmail: UsersProvider['findOneByEmail'];
 * 		}
 * 		userEmailVerificationRequests: {
 * 			deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 			createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 		}
 * 	}>;
 * 	input: unknown;
 * }} props
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

	const { session, user } = props;

	if (
		user.twoFactorEnabledAt &&
		user.twoFactorRegisteredAt &&
		!session.twoFactorVerifiedAt
	) {
		return UPDATE_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
	}

	// const emailAvailable = await getUserByEmailRepository(validatedEmail);
	const emailAvailable =
		await props.authProviders.users.findOneByEmail(validatedEmail);
	if (emailAvailable)
		return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;

	const verificationRequest = await createEmailVerificationRequest(
		{
			where: { userId: user.id, email: validatedEmail },
		},
		{
			authProviders: {
				userEmailVerificationRequests: {
					createOne:
						props.authProviders.userEmailVerificationRequests.createOne,
					deleteOneByUserId:
						props.authProviders.userEmailVerificationRequests.deleteOneByUserId,
				},
			},
		},
	);
	await sendVerificationEmail(
		verificationRequest.email,
		verificationRequest.code,
	);
	setEmailVerificationRequestCookie({
		request: verificationRequest,
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
	});

	return UPDATE_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
