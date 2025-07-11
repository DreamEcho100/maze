/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, UserEmailVerificationRequestsProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import { RESEND_EMAIL_MESSAGES_ERRORS, RESEND_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";

/**
 *
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders<{
 * 		userEmailVerificationRequests: {
 * 			findOneByIdAndUserId: UserEmailVerificationRequestsProvider['findOneByIdAndUserId'];
 * 			createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 			deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 		};
 * 	}>;
 * }} props
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESEND_EMAIL_MESSAGES_ERRORS,
 *    RESEND_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function resendEmailVerificationCodeService(props) {
	const { session, user } = props;

	if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest({
		userId: user.id,
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId:
					props.authProviders.userEmailVerificationRequests.findOneByIdAndUserId,
			},
		},
	});

	if (!verificationRequest) {
		if (user.emailVerifiedAt) {
			return RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
		}

		verificationRequest = await createEmailVerificationRequest(
			{ where: { userId: user.id, email: user.email } },
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
	} else {
		verificationRequest = await createEmailVerificationRequest(
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
	}

	await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie({
		request: verificationRequest,
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
	});

	return RESEND_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
