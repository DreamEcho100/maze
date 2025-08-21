/**
 * @import { DateLike, User, UsersProvider } from "@de100/auth-shared/types";
 */

import { encrypt, encryptString } from "#utils/encryption.js";
import { generateRandomRecoveryCode } from "#utils/generate-random-recovery-code.js";
import { hashPassword } from "#utils/passwords.js";
import { dateLikeToDate } from "./dates.js";

/**
 * Create a new user.
 *
 * @param {Object} data - The user data.
 * @param {string} data.email
 * @param {string} data.name
 * @param {string} data.displayName
 * @param {string} data.password
 * @param {Object} ctx - Context object containing auth providers.
 * @param {{ users: { createOne: UsersProvider['createOne']; } }} ctx.authProviders
 * @returns {Promise<User>}
 */
export async function createUser(data, ctx) {
	const passwordHash = await hashPassword(data.password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);

	// const result = await createUserRepository(email, name, passwordHash, encryptedRecoveryCode);
	// @ts-expect-error
	const result = await ctx.authProviders.users.createOne({
		email: data.email,
		name: data.name,
		displayName: data.displayName,
		passwordHash,
		encryptedRecoveryCode,
	});

	if (!result) {
		throw new Error(`Failed to create user with email ${data.email}`);
	}

	return result;
}

/**
 * Reset the user's recovery code and return it.
 * @param {string} userId
 * @param {Object} ctx - Context object containing auth providers.
 * @param {{ users: { updateOneRecoveryCode: UsersProvider['updateOneRecoveryCode']; } }} ctx.authProviders
 * @returns {Promise<string>}
 */
export async function resetUserRecoveryCode(userId, ctx) {
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedCode = encryptString(recoveryCode);

	// await updateOneUserRecoveryCodeRepository(userId, encryptedCode);
	await ctx.authProviders.users.updateOneRecoveryCode(userId, encryptedCode);

	return recoveryCode;
}

// /**
//  * Update the user's email and mark the email as verified.
//  * @param {string} userId
//  * @param {string} email
//  * @returns {Promise<User>}
//  */
// export async function updateUserEmailAndSetEmailAsVerified(userId, email) {
//   const result = await updateUserEmailRepository(userId, email);

//   if (!result) {
//     throw new Error(`User with ID ${userId} not found`);
//   }

//   return result;
// }

/**
 * Update a user's password.
 *
 * @param {Object} props - The properties to identify the user.
 * @param {Object} props.data - The data to be updated.
 * @param {string} props.data.password - The new password to be set.
 * @param {Object} props.where - The properties to identify the user.
 * @param {string} props.where.id - The ID of the user to update.
 * @param {Object} ctx
 * @param {any} [ctx.tx] - Additional options for the operation.
 * @param {{
 * 	users: {
 * 		updateOnePassword: UsersProvider['updateOnePassword'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<User>}
 */
export async function updateUserPassword(props, ctx) {
	const passwordHash = await hashPassword(props.data.password);
	// const result = await updateUserPasswordRepository(id, passwordHash);
	const result = await ctx.authProviders.users.updateOnePassword(
		{ data: { passwordHash }, where: { id: props.where.id } },
		{ tx: ctx.tx },
	);

	if (!result) {
		throw new Error(`User with ID ${props.where.id} not found`);
	}

	return result;
}

/**
 * Update the user's TOTP key.
 *
 * @param {Object} props
 * @param {Object} props.where - The properties to identify the user.
 * @param {string} props.where.userId - The ID of the user.
 * @param {object} props.data - The data to be updated.
 * @param {Uint8Array} props.data.key - The TOTP key to be updated.
 * @param {{
 * 	tx: any;
 * 	authProviders: {
 * 		users: { updateOneTOTPKey: UsersProvider['updateOneTOTPKey']; }
 * 	}
 * }} ctx - Additional options for the operation.
 * @returns {Promise<User>}
 */
export async function updateUserTOTPKey(props, ctx) {
	const encryptedKey = encrypt(props.data.key);
	// const result = await updateUserTOTPKeyRepository(userId, encryptedKey);
	const result = await ctx.authProviders.users.updateOneTOTPKey(
		{ data: { totpKey: encryptedKey }, where: { id: props.where.userId } },
		ctx,
	);

	if (!result) {
		throw new Error(`User with ID ${props.where.userId} not found`);
	}

	return result;
}

/**
 * Update the user's two factor enabled status in the database.
 * @param {string} userId
 * @param {DateLike | null} twoFactorEnabledAt
 * @param {Object} ctx - Context object containing auth providers.
 * @param {{ users: { updateOne2FAEnabled: UsersProvider['updateOne2FAEnabled']; } }} ctx.authProviders
 * @returns {Promise<User>}
 */
export async function updateUserTwoFactorEnabledService(userId, twoFactorEnabledAt, ctx) {
	const encryptedRecoveryCode = twoFactorEnabledAt
		? (() => {
				const recoveryCode = generateRandomRecoveryCode();
				const encryptedRecoveryCode = encryptString(recoveryCode);

				return encryptedRecoveryCode;
			})()
		: null;

	// return await updateUserTwoFactorEnabledRepository(
	const result = await ctx.authProviders.users.updateOne2FAEnabled(
		{
			twoFactorEnabledAt: twoFactorEnabledAt ? dateLikeToDate(twoFactorEnabledAt) : null,
			recoveryCode: encryptedRecoveryCode,
		},
		{ userId },
	);

	if (!result) {
		throw new Error(`User with ID ${userId} not found`);
	}

	return result;
}
