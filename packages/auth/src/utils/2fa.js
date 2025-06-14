// import { prisma as db } from "@de100/db/db";
/** @import { UsersProvider, SessionsProvider } from "#types.ts"; */

import { decryptToString, encryptString } from "./encryption.js";
import { generateRandomRecoveryCode } from "./generate-random-recovery-code.js";

// import { generateRandomRecoveryCode } from "./utils";

/**
 * Reset the user's 2FA with a recovery code.
 * @param {string} userId - The user ID.
 * @param {string} recoveryCode - The recovery code.
 * @param {object} ctx
 * @param {any} ctx.tx - Transaction object for database operations
 * @param {{
 *  users: {
 * 		getOneRecoveryCodeRaw: UsersProvider['getOneRecoveryCodeRaw'];
 * 		updateOneRecoveryCodeByUserId: UsersProvider['updateOneRecoveryCodeById'];
 * }
 * 	sessions: {
 * 		unMarkOne2FAForUser: SessionsProvider['unMarkOne2FAForUser'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<boolean>} - True if the 2FA was reset, false otherwise.
 */
export async function resetUser2FAWithRecoveryCode(userId, recoveryCode, ctx) {
	// Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
	// return await db.$transaction(async (tx) => {
	//
	const userRecoveryCodeStored = await ctx.authProviders.users.getOneRecoveryCodeRaw(
		userId,
		ctx.tx,
	);
	if (!userRecoveryCodeStored) {
		return false;
	}
	const userRecoveryCode = decryptToString(userRecoveryCodeStored);
	if (recoveryCode !== userRecoveryCode) {
		return false;
	}

	const newRecoveryCode = generateRandomRecoveryCode();
	const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
	// await unMarkOne2FAForUserRepository(userId, tx);
	await ctx.authProviders.sessions.unMarkOne2FAForUser(userId, ctx.tx);

	// const updatedUserRecoveryCode = await updateUserRecoveryCodeRepository(
	const updatedUserRecoveryCode = await ctx.authProviders.users.updateOneRecoveryCodeByUserId(
		userId,
		encryptedNewRecoveryCode,
		userRecoveryCodeStored,
		ctx.tx,
	);

	return !!updatedUserRecoveryCode && updatedUserRecoveryCode !== userRecoveryCodeStored;
	// });
}
