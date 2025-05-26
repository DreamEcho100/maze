/** @import { PasswordResetSession, PasswordResetSessionValidationResult } from "#types.ts"; */

// import { prisma as db } from "@de100/db/db";

// import { dateLikeToDate } from "../utils/dates.js";
// import {
//   transformDbPasswordResetSessionToPasswordResetSession,
//   transformDbUserToUser,
// } from "../utils/transform.js";

// /**
//  * @param {PasswordResetSession} data
//  * @returns {Promise<PasswordResetSession>}
//  */
// export async function createOnePasswordResetSessionRepository(data) {
//   return await db.passwordResetSession
//     .create({
//       data: {
//         ...data,
//         emailVerifiedAt: data.emailVerifiedAt ? dateLikeToDate(data.emailVerifiedAt) : null,
//         twoFactorVerifiedAt: data.twoFactorVerifiedAt
//           ? dateLikeToDate(data.twoFactorVerifiedAt)
//           : null,
//         expiresAt: dateLikeToDate(data.expiresAt),
//       },
//     })
//     .then(transformDbPasswordResetSessionToPasswordResetSession);
// }

// /**
//  * @param {string} sessionId - The ID of the password reset session.
//  * @returns {Promise<PasswordResetSessionValidationResult>}
//  */
// export async function findOnePasswordResetSessionWithUserRepository(sessionId) {
//   return await db.passwordResetSession
//     .findUnique({
//       where: { id: sessionId },
//       include: { user: { include: { organization: true } } },
//     })
//     .then((result) => {
//       if (!result?.user) {
//         return { session: null, user: null };
//       }

//       const { user, ...session } = result;
//       return {
//         session: transformDbPasswordResetSessionToPasswordResetSession(session),
//         user: transformDbUserToUser(user),
//       };
//     });
// }

// /**
//  * @param {string} sessionId - The ID of the password reset session.
//  */
// export async function deleteOnePasswordResetSessionRepository(sessionId) {
//   await db.passwordResetSession.delete({ where: { id: sessionId } });
// }

// /**
//  * @param {string} sessionId - The ID of the password reset session.
//  * @returns {Promise<void>}
//  */
// export async function updateOnePasswordResetSessionAsEmailVerifiedRepository(sessionId) {
//   await db.passwordResetSession.update({
//     where: { id: sessionId },
//     data: { emailVerifiedAt: new Date() },
//   });
// }

// /**
//  * @param {string} sessionId - The ID of the password reset session.
//  * @returns {Promise<void>}
//  */
// export async function updateOnePasswordResetSessionAs2FAVerifiedRepository(sessionId) {
//   await db.passwordResetSession.update({
//     where: { id: sessionId },
//     data: { twoFactorVerifiedAt: new Date() },
//   });
// }

// /**
//  * @param {string} userId - The ID of the user.
//  * @returns {Promise<void>}
//  */
// export async function deleteAllPasswordResetSessionsForUserRepository(userId) {
//   await db.passwordResetSession.deleteMany({ where: { userId } });
// }

/** @import { PasswordResetSessionProvider } from "#types.ts"; */

export let passwordResetSessionProvider = /** @type {PasswordResetSessionProvider} */ ({});

/** @param {PasswordResetSessionProvider} newPasswordResetSessionProvider */
export function setPasswordResetSessionProvider(newPasswordResetSessionProvider) {
	passwordResetSessionProvider = newPasswordResetSessionProvider;
}

// export const passwordResetSessionRepository = {
//   createOne: createOnePasswordResetSessionRepository,
//   findOneWithUser: findOnePasswordResetSessionWithUserRepository,
//   deleteOne: deleteOnePasswordResetSessionRepository,
//   markEmailVerified: updateOnePasswordResetSessionAsEmailVerifiedRepository,
//   mark2FAVerified: updateOnePasswordResetSessionAs2FAVerifiedRepository,
//   deleteAllByUserId: deleteAllPasswordResetSessionsForUserRepository,
// };
