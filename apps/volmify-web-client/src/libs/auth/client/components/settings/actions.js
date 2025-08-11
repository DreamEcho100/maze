"use server";

import { regenerateRecoveryCodeService } from "@de100/auth-core/services/settings/regenerate-recovery-code";
import { updateEmailService } from "@de100/auth-core/services/settings/update-email";
import { updateIsTwoFactorService } from "@de100/auth-core/services/settings/update-is-two-factor";
/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; }} ActionIdleResult
 * @typedef {{ type: 'error', statusCode: number; message: string; }} ActionErrorResult
 * @typedef {{ type: 'success', statusCode: number; message: string; }} ActionSuccessResult
 * @typedef {ActionIdleResult | ActionErrorResult | ActionSuccessResult} ActionResult
 */

import { updatePasswordService } from "@de100/auth-core/services/settings/update-password";
import { AUTH_URLS, AUTHENTICATION_REQUIRED } from "@de100/auth-core/utils/constants";
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
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
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
		await redirect(AUTH_URLS.SUCCESS_UPDATE_EMAIL);
		return result;
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
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
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}
	const result = await db.transaction(async (tx) =>
		updateIsTwoFactorService({
			...authProps,
			tx,
		}),
	);

	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_UPDATE_2FA);
		return result;
	}

	return result;
}
