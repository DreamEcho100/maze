// /** @import { UserEmailVerificationRequestRepository, EmailVerificationRequest, SessionValidationResult, DateLike } from "#types.ts"; */
// import { dateLikeToDate, } from "#utils/dates.js";

// // import { prisma as db } from "@de100/db/db";

// import { transformDbEmailVerificationRequestToEmailVerificationRequest } from "../utils/transform.js";

// /**
//  * Get the email verification request for a user.
//  * @param {string} userId - The user ID.
//  * @returns {Promise<void>} A promise that resolves when the requests have been deleted.
//  */
// export async function deleteOneUserEmailVerificationRequestRepository(userId) {
//   await db.emailVerificationRequest.deleteMany({ where: { userId: userId } });
// }

// /**
//  * Create an email verification request for a user.
//  * @param {string} userId - The user ID.
//  * @param {string} id - The request ID.
//  * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
//  */
// export async function findOneUserEmailVerificationRequestRepository(userId, id) {
//   return await db.emailVerificationRequest.findUnique({ where: { id: id, userId: userId } }).then(
//     /** @returns {EmailVerificationRequest | null} */
//     (result) => result && transformDbEmailVerificationRequestToEmailVerificationRequest(result),
//   );
// }

// /**
//  * Create an email verification request for a user.
//  * @param {{
//  *  id: string;
//  *  userId: string;
//  *  code: string;
//  *  email: string;
//  *  expiresAt: DateLike;
//  * }} data - The request data.
//  * @returns {Promise<EmailVerificationRequest>} The email verification request.
//  */
// export async function createOneEmailVerificationRequestRepository(data) {
//   return await db.emailVerificationRequest
//     .create({
//       data: {
//         ...data,
//         expiresAt: dateLikeToDate(data.expiresAt),
//       },
//     })
//     .then(transformDbEmailVerificationRequestToEmailVerificationRequest);
// }

/** @import { UserEmailVerificationRequestProvider } from "#types.ts"; */
export let userEmailVerificationRequestProvider =
	/** @type {UserEmailVerificationRequestProvider} */ ({});

/** @param {UserEmailVerificationRequestProvider} newUserEmailVerificationRequestProvider  */
export function setUserEmailVerificationRequestProvider(newUserEmailVerificationRequestProvider) {
	userEmailVerificationRequestProvider = newUserEmailVerificationRequestProvider;
}

// const userEmailVerificationRequestRepository = {
//   deleteOneByUser: deleteOneUserEmailVerificationRequestRepository,
//   findOneByIdAndUserId: findOneUserEmailVerificationRequestRepository,
//   createOne: createOneEmailVerificationRequestRepository,
// }
