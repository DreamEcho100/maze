"use server";

import { verifyPasswordReset2FAViaRecoveryCodeService } from "@de100/auth/services/reset-password/verify/2fa/recovery-code";
import { verifyPasswordReset2FAViaTOTPService } from "@de100/auth/services/reset-password/verify/2fa/totp";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
	getOneUserRecoveryCodeRaw,
	getOneUserTOTPKey,
	markOnePasswordResetSessionTwoFactorAsVerified,
	unMarkOneSession2FAForUser,
	updateOneUserRecoveryCodeById,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

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
				markOneTwoFactorAsVerified: markOnePasswordResetSessionTwoFactorAsVerified,
			},
			users: {
				getOneTOTPKey: getOneUserTOTPKey,
			},
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await verifyPasswordReset2FAViaTOTPService(authProps);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
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
				markOneTwoFactorAsVerified: markOnePasswordResetSessionTwoFactorAsVerified,
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
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await db.transaction(async (tx) =>
		verifyPasswordReset2FAViaRecoveryCodeService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}
