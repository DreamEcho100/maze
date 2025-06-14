/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, AuthStrategy, UserEmailVerificationRequestsProvider, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts"; */

import { RESEND_EMAIL_MESSAGES_ERRORS, RESEND_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
	createEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getDefaultSessionAndJWTFromAuthProviders } from "#utils/get-defaults-session-and-jwt-from-auth-providers.js";
import { getCurrentAuthSession } from "#utils/strategy/index.js";

/**
 *
 * @param {object} props
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token.
 * @param {HeadersProvider} props.headers - The headers provider to access the session token.
 * @param {any} props.tx - Transaction object for database operations
 * @param {string|null|undefined} props.ipAddress - Optional IP address for the session
 * @param {UserAgent|null|undefined} props.userAgent - Optional user agent for the session
 * @param {AuthStrategy} props.authStrategy
 * @param {AuthProvidersWithSessionAndJWTDefaults<{
 * 	userEmailVerificationRequests: {
 * 		findOneByIdAndUserId: UserEmailVerificationRequestsProvider['findOneByIdAndUserId'];
 * 		createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 		deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 	};
 * }>} props.authProviders
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    RESEND_EMAIL_MESSAGES_ERRORS,
 *    RESEND_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function resendEmailVerificationCodeService(props) {
	const { session, user } = await getCurrentAuthSession({
		ipAddress: props.ipAddress,
		userAgent: props.userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	});
	if (!session) return RESEND_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

	if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(user.id, {
		cookies: props.cookies,
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
	setEmailVerificationRequestCookie(verificationRequest, props.cookies);

	return RESEND_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
