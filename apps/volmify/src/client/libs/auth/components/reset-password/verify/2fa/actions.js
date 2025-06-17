"use server";

import { verifyPasswordReset2FAViaRecoveryCodeService } from "@de100/auth/services/reset-password/verify/2fa/recovery-code";
import { verifyPasswordReset2FAViaTOTPService } from "@de100/auth/services/reset-password/verify/2fa/totp";

import { redirect } from "#i18n/server";
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
import { generateGetCurrentAuthSessionProps } from "#server/libs/generate-get-current-auth-session-props";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 */

// TODO: Make sure every service needs the auth verification to have it

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithTOTPAction(_prev, formData) {
	const result = await verifyPasswordReset2FAViaTOTPService(
		await generateGetCurrentAuthSessionProps({
			input: { code: formData.get("code") },
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
		}),
	);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}

/**
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function verifyPasswordReset2FAWithRecoveryCodeAction(_prev, formData) {
	const code = formData.get("code");
	const result = await db.transaction(async (tx) =>
		verifyPasswordReset2FAViaRecoveryCodeService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { code },
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
			}),
		),
	);

	if (result.type === "success") {
		return redirect("/auth/reset-password");
	}

	return result;
}
