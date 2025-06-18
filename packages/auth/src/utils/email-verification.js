/** @import { EmailVerificationRequest, CookiesProvider, UserEmailVerificationRequestsProvider } from "#types.ts"; */

import { encodeBase32 } from "@oslojs/encoding";

import {
	COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION,
	COOKIE_TOKEN_EMAIL_VERIFICATION_KEY,
} from "./constants.js";
import { generateRandomOTP } from "./generate-randomotp.js";

/**
 * Create an email verification request for a user.
 *
 * @param {Parameters<UserEmailVerificationRequestsProvider['deleteOneByUserId']>[0]} props
 * @param {object} ctx
 * @param {any} [ctx.tx]
 * @param {{
 * 	userEmailVerificationRequests: {
 * 		deleteOneByUserId: UserEmailVerificationRequestsProvider['deleteOneByUserId'];
 * 		createOne: UserEmailVerificationRequestsProvider['createOne'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<EmailVerificationRequest>} The email verification request.
 */
export async function createEmailVerificationRequest(props, ctx) {
	await ctx.authProviders.userEmailVerificationRequests.deleteOneByUserId(props, { tx: ctx.tx });
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32(idBytes).toLowerCase();

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION);
	const result = await ctx.authProviders.userEmailVerificationRequests.createOne(
		{
			id: id,
			userId: props.where.userId,
			code: code,
			email: props.where.email,
			expiresAt: expiresAt,
		},
		{ tx: ctx.tx },
	);

	if (!result) {
		throw new Error("Failed to create email verification request.");
	}

	return result;
}

/**
 * Send a verification email to a user.
 * @param {string} email - The email address.
 * @param {string} code - The verification code.
 *
 * TODO: Add rate limiting for Volmify production:
 * - Max 3 emails per 10 minutes per email address
 * - Per-tenant rate limiting for enterprise customers
 * - IP-based rate limiting for additional security
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sendVerificationEmail(email, code) {
	console.log(`To ${email}: Your verification code is ${code}`);
	console.warn("Email sending is not implemented");
}

/**
 * Set the email verification request cookie.
 * @param {EmailVerificationRequest} request - The email verification request.
 * @param {CookiesProvider} cookies - The cookies provider to set the cookie.
 */
export function setEmailVerificationRequestCookie(request, cookies) {
	cookies.set(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, request.id, {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: request.expiresAt,
	});
}

/**
 * Get the email verification request cookie.
 * @param {CookiesProvider} cookies - The cookies provider to set the cookie.
 */
export function getEmailVerificationRequestCookie(cookies) {
	return cookies.get(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY);
}

/**
 * Delete the email verification request cookie.
 * @param {CookiesProvider} cookies - The cookies provider to set the cookie.
 */
export function deleteEmailVerificationRequestCookie(cookies) {
	cookies.set(COOKIE_TOKEN_EMAIL_VERIFICATION_KEY, "", {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
	});
}

/**
 * Get the email verification request from the request.
 * @param {string} userId
 * @param {object} ctx
 * @param {CookiesProvider} ctx.cookies - The cookies provider to set the cookie.
 * @param {{ userEmailVerificationRequests: { findOneByIdAndUserId: UserEmailVerificationRequestsProvider['findOneByIdAndUserId'] }}} ctx.authProviders
 * @returns {Promise<EmailVerificationRequest | null>} The email verification request, or null if not found.
 */
export async function getUserEmailVerificationRequestFromRequest(userId, ctx) {
	const id = getEmailVerificationRequestCookie(ctx.cookies) ?? null;

	console.log("___ getUserEmailVerificationRequestFromRequest id", id);
	if (!id) return null;

	const request = await ctx.authProviders.userEmailVerificationRequests.findOneByIdAndUserId(
		userId,
		id,
	);
	console.log("____ getUserEmailVerificationRequestFromRequest request", request);
	console.log("____ getUserEmailVerificationRequestFromRequest !request", !request);
	if (!request) deleteEmailVerificationRequestCookie(ctx.cookies);
	console.log("____ getUserEmailVerificationRequestFromRequest request", request);
	console.log("____ getUserEmailVerificationRequestFromRequest !request", !request);
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
