/** @import { UserAgent, MultiErrorSingleSuccessResponse, CookiesProvider, HeadersProvider, UserEmailVerificationRequestsProvider, AuthStrategy, PasswordResetSessionsProvider, UsersProvider, AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "@de100/auth-shared/types"; */

import {
	VERIFY_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_SUCCESS,
} from "@de100/auth-shared/constants";
import { verifyEmailServiceInputSchema } from "@de100/auth-shared/validations";
import { dateLikeToNumber } from "#utils/dates.js";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	getEmailVerificationRequestCookie,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";

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

	const { session, user } = props;

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
	}
	const id = getEmailVerificationRequestCookie(props.cookies) ?? null;

	const verificationRequest = await getUserEmailVerificationRequestFromRequest({
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
		setEmailVerificationRequestCookie({
			request: newVerificationRequest,
			cookies: props.cookies,
			cookiesOptions: props.cookiesOptions,
		});
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
		// Needs to refresh the tokens
	]);

	deleteEmailVerificationRequestCookie({
		cookies: props.cookies,
		cookiesOptions: props.cookiesOptions,
	});

	if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
		// return redirect("/2fa/setup");
		return VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE;
	}

	return VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY;
	// return redirect("/");
}
