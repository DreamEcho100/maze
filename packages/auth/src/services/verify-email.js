/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, UserEmailVerificationRequestsProvider, AuthStrategy, PasswordResetSessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import { VERIFY_EMAIL_MESSAGES_ERRORS, VERIFY_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToNumber } from "#utils/dates.js";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { generateGetCurrentAuthSessionProps } from "#utils/generate-get-current-auth-session-props.js";
import { getCurrentAuthSession } from "#utils/sessions/index.js";
import { verifyEmailServiceInputSchema } from "#utils/validations.js";

/**
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 		authProviders: AuthProvidersWithGetSessionProviders<{
 * 		userEmailVerificationRequests: {
 * 			findOneByIdAndUserId: UserEmailVerificationRequestsProvider['findOneByIdAndUserId'];
 * 			deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 			createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 		};
 *  	passwordResetSessions: {
 * 			deleteAllByUserId: PasswordResetSessionsProvider['deleteAllByUserId'];
 * 		};
 *  	users: {
 * 			updateOneEmailAndVerify: UsersProvider['updateOneEmailAndVerify'];
 * 		};
 * 	}>;
 * 	input: unknown;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_EMAIL_MESSAGES_ERRORS,
 *    VERIFY_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function verifyEmailUserService(props) {
	const input = verifyEmailServiceInputSchema.safeParse(props.input);
	if (!input.success) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
	}

	const { session, user } = await getCurrentAuthSession(
		await generateGetCurrentAuthSessionProps(props),
	);
	if (!session) return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	const verificationRequest = await getUserEmailVerificationRequestFromRequest(user.id, {
		cookies: props.cookies,
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId:
					props.authProviders.userEmailVerificationRequests.findOneByIdAndUserId,
			},
		},
	});
	if (!verificationRequest) return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (Date.now() >= dateLikeToNumber(verificationRequest.expiresAt)) {
		const newVerificationRequest = await createEmailVerificationRequest(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{
				tx: props.tx,
				authProviders: {
					userEmailVerificationRequests: {
						createOne: props.authProviders.userEmailVerificationRequests.createOne,
						deleteOneByUserId: props.authProviders.userEmailVerificationRequests.deleteOneByUserId,
					},
				},
			},
		);

		await sendVerificationEmail(newVerificationRequest.email, newVerificationRequest.code);
		setEmailVerificationRequestCookie(newVerificationRequest, props.cookies);
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED_WE_SENT_NEW_CODE;
	}
	if (verificationRequest.code !== input.data.code) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
	}

	await Promise.all([
		props.authProviders.userEmailVerificationRequests.deleteOneByUserId(
			{ where: { userId: user.id, email: verificationRequest.email } },
			{ tx: props.tx },
		),
		props.authProviders.passwordResetSessions.deleteAllByUserId(
			{ where: { userId: user.id } },
			{ tx: props.tx },
		),
		props.authProviders.users.updateOneEmailAndVerify(
			{ data: { email: verificationRequest.email }, where: { id: user.id } },
			{ tx: props.tx },
		),
	]);

	deleteEmailVerificationRequestCookie(props.cookies);

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		// return redirect("/2fa/setup");
		return VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE;
	}

	return VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY;
	// return redirect("/");
}
