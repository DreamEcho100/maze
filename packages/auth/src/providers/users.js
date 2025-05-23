// /** @import { User } from "#types.ts"; */

// // import { createId } from "@paralleldrive/cuid2";
// import { decrypt, decryptToString } from "#utils/encryption.js";

// import { prisma as db } from "@acme/db/db";

// import { transformDbUserToUser } from "../utils/transform.js";

// /**
//  * Create a new user in the database.
//  * @param {string} email
//  * @param {string} name
//  * @param {string} passwordHash
//  * @param {Uint8Array} encryptedRecoveryCode
//  * @returns {Promise<User>}
//  */
// export async function createUserRepository(email, name, passwordHash, encryptedRecoveryCode) {
//   return await db.user
//     .create({
//       data: {
//         id: createId(),
//         email,
//         name,
//         passwordHash,
//         recoveryCode: Buffer.from(encryptedRecoveryCode),
//         emailVerifiedAt: null, // Default value as unverified
//       },
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Update the user's password in the database.
//  * @param {string} userId
//  * @param {string} passwordHash
//  * @returns {Promise<User>}
//  */
// export async function updateUserPasswordRepository(userId, passwordHash) {
//   return await db.user
//     .update({
//       where: { id: userId },
//       data: { passwordHash },
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Update the user's email in the database.
//  * @param {string} userId
//  * @param {string} email
//  * @returns {Promise<User>}
//  */
// export async function updateUserEmailAndSetEmailAsVerifiedRepository(userId, email) {
//   return await db.user
//     .update({
//       where: { id: userId },
//       data: { email, emailVerifiedAt: new Date() }, // Mark email as verified
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Get a user's password hash from the database.
//  * @param {string} userId
//  * @returns {Promise<string|null>}
//  */
// export async function getUserPasswordHashRepository(userId) {
//   const result = await db.user.findUnique({
//     where: { id: userId },
//     select: { passwordHash: true },
//   });
//   return result?.passwordHash ?? null;
// }

// /**
//  * Get a user's recovery code from the database and decrypt it.
//  * @param {string} userId
//  * @returns {Promise<string | null>}
//  */
// export async function getUserRecoveryCodeRepository(userId) {
//   const result = await db.user.findUnique({
//     where: { id: userId },
//     select: { recoveryCode: true },
//   });

//   return result?.recoveryCode ? decryptToString(result.recoveryCode) : null;
// }

// /**
//  * Get a user's TOTP key from the database and decrypt it.
//  * @param {string} userId
//  * @returns {Promise<Uint8Array | null>}
//  */
// export async function getUserTOTPKeyRepository(userId) {
//   const result = await db.user.findUnique({
//     where: { id: userId },
//     select: { totpKey: true },
//   });

//   if (!result?.totpKey) {
//     return null;
//   }

//   const encrypted = result.totpKey;

//   return decrypt(encrypted);
// }

// /**
//  * Update the user's TOTP key in the database.
//  * @param {string} userId
//  * @param {Uint8Array} encryptedKey
//  * @returns {Promise<User>}
//  */
// export async function updateUserTOTPKeyRepository(userId, encryptedKey) {
//   return await db.user
//     .update({
//       where: { id: userId },
//       data: { totpKey: Buffer.from(encryptedKey) },
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Reset the user's recovery code in the database.
//  * @param {string} userId
//  * @param {Uint8Array} encryptedRecoveryCode
//  * @returns {Promise<User>}
//  */
// export async function updateOneUserRecoveryCodeRepository(userId, encryptedRecoveryCode) {
//   return await db.user
//     .update({
//       where: { id: userId },
//       data: { recoveryCode: Buffer.from(encryptedRecoveryCode) },
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Set user email as verified if the provided email matches the one in the database.
//  * @param {string} userId
//  * @param {string} email
//  * @returns {Promise<User|null|undefined>}
//  */
// export async function setUserAsEmailVerifiedIfEmailMatchesRepository(userId, email) {
//   return await db.user
//     .update({
//       where: { id: userId, email },
//       data: { emailVerifiedAt: new Date() }, // Mark email as verified
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }

// /**
//  * Get a user by their email from the database.
//  * @param {string} email
//  * @returns {Promise<User | null>}
//  */
// export async function getUserByEmailRepository(email) {
//   return await db.user
//     .findUnique({
//       where: { email },
//       include: { organization: true },
//     })
//     .then((result) => result && transformDbUserToUser(result));
// }

// /**
//  * find user by id
//  * @param {string} userId
//  * @param {import("@prisma/client").Prisma.TransactionClient} [tx] - Transaction client
//  * @returns {Promise<Uint8Array | null | undefined>}
//  */
// export async function getOneUserRecoveryCodeRepository(userId, tx) {
//   return await (tx ?? db).user
//     .findUnique({
//       where: { id: userId },
//     })
//     .then(
//       (result) =>
//         result?.recoveryCode &&
//         new Uint8Array(
//           result.recoveryCode.buffer,
//           result.recoveryCode.byteOffset,
//           result.recoveryCode.byteLength,
//         ),
//     );
// }

// /**
//  * Update the user's recovery code in the database.
//  * @param {string} userId
//  * @param {Uint8Array} encryptedNewRecoveryCode
//  * @param {Uint8Array} userRecoveryCode
//  * @param {import("@prisma/client").Prisma.TransactionClient} [tx] - Transaction client
//  * @returns {Promise<Uint8Array | null>}
//  */
// export async function updateUserRecoveryCodeRepository(
//   userId,
//   encryptedNewRecoveryCode,
//   userRecoveryCode,
//   tx,
// ) {
//   return await (tx ?? db).user
//     .update({
//       where: { id: userId, recoveryCode: Buffer.from(userRecoveryCode) },
//       data: {
//         recoveryCode: Buffer.from(encryptedNewRecoveryCode),
//         totpKey: null,
//       },
//     })
//     .then(
//       (result) =>
//         result.recoveryCode &&
//         new Uint8Array(
//           result.recoveryCode.buffer,
//           result.recoveryCode.byteOffset,
//           result.recoveryCode.byteLength,
//         ),
//     );
// }

// /**
//  * Update the user's two factor enabled status in the database and optionally set the recovery code.
//  *
//  * @param {{
//  *  twoFactorEnabledAt: Date | null;
//  *  recoveryCode?: Uint8Array | null;
//  * }} data
//  * @param {{ userId: string; }} where
//  * @returns {Promise<User>}
//  */
// export async function updateUserTwoFactorEnabledRepository(data, where) {
//   return await db.user
//     .update({
//       where: { id: where.userId },
//       data: {
//         twoFactorEnabledAt: data.twoFactorEnabledAt,
//         recoveryCode: data.recoveryCode && Buffer.from(data.recoveryCode),
//         totpKey: !data.twoFactorEnabledAt ? null : undefined,
//       },
//       include: { organization: true },
//     })
//     .then(transformDbUserToUser);
// }


/** @import { UserProvider } from "#types.ts"; */


export let userProvider = /** @type {UserProvider} */({});

/** @param {UserProvider} newUserProvider  */
export function setUserProvider(newUserProvider) {
  userProvider = newUserProvider;
}


// export const userRepository = {
//   createOne: createUserRepository,
//   findOneByEmail: getUserByEmailRepository,
//   updateOnePassword: updateUserPasswordRepository,
//   updateEmailAndVerify: updateUserEmailAndSetEmailAsVerifiedRepository,
//   verifyOneEmailIfMatches: setUserAsEmailVerifiedIfEmailMatchesRepository,
//   getOnePasswordHash: getUserPasswordHashRepository,
//   getOneRecoveryCodeRaw: getOneUserRecoveryCodeRepository,
//   getOneRecoveryCode: getUserRecoveryCodeRepository,
//   updateOneRecoveryCode: updateOneUserRecoveryCodeRepository,
//   updateOneRecoveryCodeByUserId: updateUserRecoveryCodeRepository,
//   getOneTOTPKey: getUserTOTPKeyRepository,
//   updateOneTOTPKey: updateUserTOTPKeyRepository,
//   updateOne2FAEnabled: updateUserTwoFactorEnabledRepository,
// }