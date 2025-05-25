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
  const result = await userProvider.createOne({
    email,
    name,
    passwordHash,
    encryptedRecoveryCode,
  });

  if (!result) {
    throw new Error(`Failed to create user with email ${email}`);
  }

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
  await userProvider.updateOneRecoveryCode(userId, encryptedCode);

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
 * @param {{ tx?: any }} [options] - Additional options for the operation.
 * @returns {Promise<User>}
 */
export async function updateUserPassword(props, options) {
  const passwordHash = await hashPassword(props.data.password);
  // const result = await updateUserPasswordRepository(id, passwordHash);
  const result = await userProvider.updateOnePassword({ data: { passwordHash }, where: { id: props.where.id } }, options);

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
 * @param {{ tx?: any }} [options] - Additional options for the operation.
 * @returns {Promise<User>}
 */
export async function updateUserTOTPKey(props, options) {
  const encryptedKey = encrypt(props.data.key);
  // const result = await updateUserTOTPKeyRepository(userId, encryptedKey);
  const result = await userProvider.updateOneTOTPKey(
    { data: { totpKey: encryptedKey }, where: { id: props.where.userId } },
    options
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
    const result = await userProvider.updateOne2FAEnabled(
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
