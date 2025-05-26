/** @import { EmailVerificationRequest, SessionValidationResult } from "#types.ts"; */

import { encodeBase32 } from "@oslojs/encoding";

import { cookiesProvider } from "#providers/cookies.js";
import { userEmailVerificationRequestProvider } from "#providers/email-verification.js";
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
	return await userEmailVerificationRequestProvider.findOneByIdAndUserId(userId, id);
}

/**
 * Create an email verification request for a user.
 *
 * @param {Parameters<typeof userEmailVerificationRequestProvider.deleteOneByUserId>[0]} props
 * @param {Parameters<typeof userEmailVerificationRequestProvider.deleteOneByUserId>[1]} [options]
 * @returns {Promise<EmailVerificationRequest>} The email verification request.
 */
export async function createEmailVerificationRequest(props, options) {
	await deleteUserEmailVerificationRequest(props, options);
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32(idBytes).toLowerCase();

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION);
	const result = await userEmailVerificationRequestProvider.createOne({
		id: id,
		userId: props.where.userId,
		code: code,
		email: props.where.email,
		expiresAt: expiresAt,
	});

	if (!result) {
		throw new Error("Failed to create email verification request.");
	}

	return result;
}

/**
 * Delete all email verification requests for a user.
 *
 * @param {Parameters<typeof userEmailVerificationRequestProvider.deleteOneByUserId>[0]} props
 * @param {Parameters<typeof userEmailVerificationRequestProvider.deleteOneByUserId>[1]} [options]
 * @returns {Promise<void>} A promise that resolves when the requests have been deleted.
 */
export async function deleteUserEmailVerificationRequest(props, options) {
	await userEmailVerificationRequestProvider.deleteOneByUserId(props, options);
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
 * @returns {void}
 */
export function setEmailVerificationRequestCookie(request) {
	cookiesProvider.set(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, request.id, {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: request.expiresAt,
	});
}

/**
 * Delete the email verification request cookie.
 * @returns {void}
 */
export function deleteEmailVerificationRequestCookie() {
	cookiesProvider.set(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, "", {
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
 * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
 */
export async function getUserEmailVerificationRequestFromRequest(getCurrentSession) {
	const { user } = await getCurrentSession();
	if (user === null) {
		return null;
	}
	const id = cookiesProvider.get(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY) ?? null;
	if (id === null) {
		return null;
	}
	const request = await getUserEmailVerificationRequest(user.id, id);
	if (!request) {
		deleteEmailVerificationRequestCookie();
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
