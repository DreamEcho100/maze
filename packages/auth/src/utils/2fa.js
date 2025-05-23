// import { prisma as db } from "@acme/db/db";

import { sessionProvider } from "#providers/sessions.js";
import { userProvider } from "#providers/users.js";
import { decryptToString, encryptString } from "./encryption.js";
import { generateRandomRecoveryCode } from "./generate-random-recovery-code.js";

// import { generateRandomRecoveryCode } from "./utils";

/**
 * Reset the user's 2FA with a recovery code.
 * @param {string} userId - The user ID.
 * @param {string} recoveryCode - The recovery code.
 * @param {any} tx - The transaction object.
 * @returns {Promise<boolean>} - True if the 2FA was reset, false otherwise.
 */
export async function resetUser2FAWithRecoveryCode(userId, recoveryCode, tx) {
  // Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
  // return await db.$transaction(async (tx) => {
    //
    const userRecoveryCodeStored = await userProvider.getOneRecoveryCodeRaw(userId, tx);
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
    await sessionProvider.unMarkOne2FAForUser(userId, tx);

    // const updatedUserRecoveryCode = await updateUserRecoveryCodeRepository(
    const updatedUserRecoveryCode = await userProvider.updateOneRecoveryCode(
      userId,
      encryptedNewRecoveryCode,
      userRecoveryCodeStored,
      tx,
    );

    return !!updatedUserRecoveryCode && updatedUserRecoveryCode !== userRecoveryCodeStored;
  // });
}
