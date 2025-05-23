/** @import { EmailVerificationRequest, GetCookie, SessionValidationResult, SetCookie } from "#types.ts"; */

import { encodeBase32 } from "@oslojs/encoding";
import {
userEmailVerificationRequestProvider} from "#providers/email-verification.js";

import {
  COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION,
  COOKIE_TOKEN_EMAIL_VERIFICATION_KEY,
} from "./constants.js";
import { generateRandomOTP } from "./generate-randomotp.js";

/**
 * Get the email verification request for a user.
 * @param {string} userId - The user ID.
 * @param {string} id - The request ID.
 * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
 */
export async function getUserEmailVerificationRequest(userId, id) {
  // return await findOneUserEmailVerificationRequestRepository(userId, id);
  return await userEmailVerificationRequestProvider.getOne(
    userId,
    id,
  );
}

/**
 * Create an email verification request for a user.
 * @param {string} userId - The user ID.
 * @param {string} email - The email address.
 * @returns {Promise<EmailVerificationRequest>} The email verification request.
 */
export async function createEmailVerificationRequest(userId, email) {
  await deleteUserEmailVerificationRequest(userId);
  const idBytes = new Uint8Array(20);
  crypto.getRandomValues(idBytes);
  const id = encodeBase32(idBytes).toLowerCase();

  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION);
  return await userEmailVerificationRequestProvider.createOne({
    id: id,
    userId: userId,
    code: code,
    email: email,
    expiresAt: expiresAt,
  });
}

/**
 * Delete all email verification requests for a user.
 * @param {string} userId - The user ID.
 * @returns {Promise<void>} A promise that resolves when the requests have been deleted.
 */
export async function deleteUserEmailVerificationRequest(userId) {
  await userEmailVerificationRequestProvider.deleteOne(userId); 
}

/**
 * Send a verification email to a user.
 * @param {string} email - The email address.
 * @param {string} code - The verification code.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sendVerificationEmail(email, code) {
  console.log(`To ${email}: Your verification code is ${code}`);
  console.warn("Email sending is not implemented");
}

/**
 * Set the email verification request cookie.
 * @param {EmailVerificationRequest} request - The email verification request.
 * @param {SetCookie} setCookie - The function to set a cookie.
 * @returns {void}
 */
export function setEmailVerificationRequestCookie(request, setCookie) {
  setCookie(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, request.id, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: request.expiresAt,
  });
}

/**
 * Delete the email verification request cookie.
 * @param {SetCookie} setCookie - The function to set a cookie.
 * @returns {void}
 */
export function deleteEmailVerificationRequestCookie(setCookie) {
  setCookie(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

/**
 * Get the email verification request from the request.
 * @param {() => Promise<SessionValidationResult> | SessionValidationResult} getCurrentSession - A function that returns the current session.
 * @param {GetCookie} getCookie - The function to get a cookie.
 * @param {SetCookie} setCookie - The function to set a cookie.
 * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
 */
export async function getUserEmailVerificationRequestFromRequest(
  getCurrentSession,
  getCookie,
  setCookie,
) {
  const { user } = await getCurrentSession();
  if (user === null) {
    return null;
  }
  const id = getCookie(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY) ?? null;
  if (id === null) {
    return null;
  }
  const request = await getUserEmailVerificationRequest(user.id, id);
  if (!request) {
    deleteEmailVerificationRequestCookie(setCookie);
  }
  return request;
}

// export const sendVerificationEmailBucket = new ExpiringTokenBucket<number>(
//   3,
//   60 * 10,
// );

// export interface EmailVerificationRequest {
//   id: string;
//   userId: number;
//   code: string;
//   email: string;
//   expiresAt: Date;
// }
