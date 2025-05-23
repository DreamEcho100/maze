/**
 * @import { DateLike, DBUser, User } from "#types.ts";
 */

import {
  userProvider
} from "#providers/users.js";
import { encrypt, encryptString } from "#utils/encryption.js";
import { generateRandomRecoveryCode } from "#utils/generate-random-recovery-code.js";
import { hashPassword } from "#utils/passwords.js";

import { dateLikeToDate } from "./dates.js";

/**
 * Create a new user.
 * @param {string} email
 * @param {string} name
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function createUser(email, name, password) {
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);

  // const result = await createUserRepository(email, name, passwordHash, encryptedRecoveryCode);
  const result = await userProvider.createOne(
    email,
    name,
    passwordHash,
    encryptedRecoveryCode,
  );

  return result;
}

/**
 * Reset the user's recovery code and return it.
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function resetUserRecoveryCode(userId) {
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedCode = encryptString(recoveryCode);

  // await updateOneUserRecoveryCodeRepository(userId, encryptedCode);
  await userProvider.updateOneRecoveryCodeByUserId(userId, encryptedCode);

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
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function updateUserPassword(userId, password) {
  const passwordHash = await hashPassword(password);
  // const result = await updateUserPasswordRepository(userId, passwordHash);
  const result = await userProvider.updateOnePassword(userId, passwordHash);

  return result;
}

/**
 * Update the user's TOTP key.
 * @param {string} userId
 * @param {Uint8Array} key
 * @returns {Promise<User>}
 */
export async function updateUserTOTPKey(userId, key) {
  const encryptedKey = encrypt(key);
  // const result = await updateUserTOTPKeyRepository(userId, encryptedKey);
  const result = await userProvider.updateOneTOTPKey(userId, encryptedKey);

  return result;
}

/**
 * Update the user's two factor enabled status in the database.
 * @param {string} userId
 * @param {DateLike | null} twoFactorEnabledAt
 * @returns {Promise<User>}
 */
export async function updateUserTwoFactorEnabledService(userId, twoFactorEnabledAt) {
  const encryptedRecoveryCode = twoFactorEnabledAt
    ? (() => {
        const recoveryCode = generateRandomRecoveryCode();
        const encryptedRecoveryCode = encryptString(recoveryCode);

        return encryptedRecoveryCode;
      })()
    : null;

  // return await updateUserTwoFactorEnabledRepository(
  return await userProvider.updateOne2FAEnabled(
    {
      twoFactorEnabledAt: twoFactorEnabledAt ? dateLikeToDate(twoFactorEnabledAt) : null,
      recoveryCode: encryptedRecoveryCode,
    },
    { userId },
  );
}
