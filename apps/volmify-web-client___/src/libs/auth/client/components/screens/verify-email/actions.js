import { resendEmailVerificationCodeService } from "@de100/auth-core/services/resend-email-verification-code";
import { verifyEmailUserService } from "@de100/auth-core/services/verify-email";
import { AUTHENTICATION_REQUIRED } from "@de100/auth-shared/constants";
import {
	createOneEmailVerificationRequests,
	deleteAllPasswordResetSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneEmailVerificationRequestsByIdAndUserId,
	updateOneUserEmailAndVerify,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";

export const verifyEmailAction =
	/**
	 * @param {{ code: unknown }} input
	 */
	async (input) => {
		"use server";
		const authProps = await generateAuthSessionProps({
			input,
			authProviders: {
				passwordResetSessions: {
					deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
				},
				users: { updateOneEmailAndVerify: updateOneUserEmailAndVerify },
				userEmailVerificationRequests: {
					findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
					createOne: createOneEmailVerificationRequests,
					deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
				},
			},
		});

		if (!authProps?.session) {
			return AUTHENTICATION_REQUIRED;
		}

		const result = await db.transaction(async (tx) =>
			verifyEmailUserService({ ...authProps, tx }),
		);
		return result;
	};

export const resendEmailVerificationCodeAction = async () => {
	"use server";
	const authProps = await generateAuthSessionProps({
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
				createOne: createOneEmailVerificationRequests,
				deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
			},
		},
	});

	if (!authProps?.session) {
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		resendEmailVerificationCodeService({
			...authProps,
			tx,
		}),
	);

	return result;
};
