"use server";

import { verifyPasswordReset2FAViaRecoveryCodeService } from "@de100/auth-core/services/reset-password/verify/2fa/recovery-code";
import { verifyPasswordReset2FAViaTOTPService } from "@de100/auth-core/services/reset-password/verify/2fa/totp";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
} from "@de100/auth-core/utils/constants";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	getOneUserRecoveryCodeRaw,
	getOneUserTOTPKey,
	markOnePasswordResetSessionTwoFactorAsVerified,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

// TODO: Make sure every service needs the auth verification to have it

/**
 * @param {{ code: unknown }} input
 */
export async function verifyPasswordReset2FAWithTOTPAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
				markOneTwoFactorAsVerified:
					markOnePasswordResetSessionTwoFactorAsVerified,
			},
			users: {
				getOneTOTPKey: getOneUserTOTPKey,
			},
		},
	});

	if (!authProps?.session) {
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await verifyPasswordReset2FAViaTOTPService(authProps);

	if (result.type === "success") {
		await redirect("/auth/reset-password");
		return result;
	}

	return result;
}

/**
 * @param {{ code: unknown }} input
 */
export async function verifyPasswordReset2FAWithRecoveryCodeAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
				markOneTwoFactorAsVerified:
					markOnePasswordResetSessionTwoFactorAsVerified,
			},
			sessions: {
				unMarkOne2FAForUser: unMarkOneSession2FAForUser,
			},
			users: {
				getOneRecoveryCodeRaw: getOneUserRecoveryCodeRaw,
				updateOneRecoveryCodeById: updateOneUserRecoveryCodeById,
			},
		},
	});

	if (!authProps?.session) {
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await db.transaction(async (tx) =>
		verifyPasswordReset2FAViaRecoveryCodeService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		await redirect("/auth/reset-password");
		return result;
	}

	return result;
}
