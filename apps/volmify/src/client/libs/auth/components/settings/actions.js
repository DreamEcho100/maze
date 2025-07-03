"use server";

import { regenerateRecoveryCodeService } from "@de100/auth/services/settings/regenerate-recovery-code";
import { updateEmailService } from "@de100/auth/services/settings/update-email";
import { updateIsTwoFactorService } from "@de100/auth/services/settings/update-is-two-factor";
/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; }} ActionIdleResult
 * @typedef {{ type: 'error', statusCode: number; message: string; }} ActionErrorResult
 * @typedef {{ type: 'success', statusCode: number; message: string; }} ActionSuccessResult
 * @typedef {ActionIdleResult | ActionErrorResult | ActionSuccessResult} ActionResult
 */

import { updatePasswordService } from "@de100/auth/services/settings/update-password";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";
import {
	createOneEmailVerificationRequests,
	createOneSession,
	deleteAllSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneUserByEmail,
	getOneUserPasswordHash,
	updateOneUser2FAEnabled,
	updateOneUserPassword,
	updateOneUserRecoveryCode,
} from "#server/libs/auth/init";
import { db } from "#server/libs/db";

/**
 *
 * Processes the update password form action, validating inputs and handling session updates.
 *
 * @param {{ currentPassword: unknown, newPassword: unknown }} input - The input containing the current and new passwords.
 */
export async function updatePasswordAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			sessions: {
				createOne: createOneSession,
				deleteAllByUserId: deleteAllSessionsByUserId,
			},
			users: {
				updateOnePassword: updateOneUserPassword,
				getOnePasswordHash: getOneUserPasswordHash,
			},
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	if (typeof input.currentPassword !== "string" || typeof input.newPassword !== "string") {
		return {
			message: "Invalid or missing fields",
			type: "error",
			statusCode: 400,
		};
	}

	const result = await db.transaction(async (tx) =>
		updatePasswordService({
			...authProps,
			tx,
		}),
	);

	return result;
}

/**
 * @param {{ email: unknown }} input
 */
export async function updateEmailAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			userEmailVerificationRequests: {
				createOne: createOneEmailVerificationRequests,
				deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
			},
			users: { findOneByEmail: findOneUserByEmail },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	if (typeof input.email !== "string") {
		return {
			message: "Invalid or missing fields",
			type: "error",
			statusCode: 400,
		};
	}

	const result = await db.transaction(async (tx) =>
		updateEmailService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_EMAIL);
	}

	return result;
}

/**
 * @returns {Promise<ActionIdleResult | ActionErrorResult | (ActionSuccessResult & { data: { recoveryCode: string; } })>}
 */
export async function regenerateRecoveryCodeAction() {
	const authProps = await generateAuthSessionProps({
		authProviders: {
			users: { updateOneRecoveryCode: updateOneUserRecoveryCode },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	return db.transaction(async (tx) =>
		regenerateRecoveryCodeService({
			...authProps,
			tx,
		}),
	);
}

/**
 * @param {{ isTwoFactorEnabled: unknown }} input
 */
export async function updateIsTwoFactorEnabledAction(input) {
	const authProps = await generateAuthSessionProps({
		input,
		authProviders: {
			users: { updateOne2FAEnabled: updateOneUser2FAEnabled },
		},
	});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}
	const result = await db.transaction(async (tx) =>
		updateIsTwoFactorService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_UPDATE_2FA);
	}

	return result;
}
