/** @import { DateLike, PasswordResetSession, PasswordResetSessionValidationResult, CookiesProvider, PasswordResetSessionsProvider, DynamicCookiesOptions } from "#types.ts"; */

import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";

import {
	COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION,
	COOKIE_TOKEN_PASSWORD_RESET_KEY,
} from "./constants.js";
import { dateLikeToDate, dateLikeToNumber } from "./dates.js";
import { generateRandomOTP } from "./generate-randomotp.js";

/**
 * Creates a password reset session.
 *
 * @param {Object} props - The properties for the password reset session.
 * @param {Object} props.data - The data for the password reset session.
 * @param {string} props.data.token - The token to be used to create the password reset session.
 * @param {string} props.data.userId - The user ID associated with the password reset session.
 * @param {string} props.data.email - The user email associated with the password reset session.
 * @returns {Promise<PasswordResetSession>} A promise that resolves to the created password reset session.
 * @param {{
 * 	tx: any;
 * 	authProviders: { passwordResetSession: { createOne: PasswordResetSessionsProvider['createOne']; } };
 * }} ctx - The properties for the password reset session.
 */
export async function createPasswordResetSession(props, ctx) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(props.data.token)));

	/** @type {PasswordResetSession} */
	const session = {
		id: sessionId,
		userId: props.data.userId,
		email: props.data.email,
		expiresAt: new Date(Date.now() + COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION),
		code: generateRandomOTP(),
		emailVerifiedAt: null,
		twoFactorVerifiedAt: null,
		createdAt: new Date(),
	};

	// await createOnePasswordResetSessionRepository(session).then(
	await ctx.authProviders.passwordResetSession.createOne({ data: session }, ctx).then(
		/** @returns {PasswordResetSession} session */
		(result) => {
			if (!result) {
				throw new Error("Failed to create password reset session.");
			}

			return {
				id: result.id,
				userId: result.userId,
				email: result.email,
				code: result.code,
				expiresAt: dateLikeToDate(result.expiresAt),
				emailVerifiedAt: result.emailVerifiedAt ? dateLikeToDate(result.emailVerifiedAt) : null,
				twoFactorVerifiedAt: result.twoFactorVerifiedAt
					? dateLikeToDate(result.twoFactorVerifiedAt)
					: null,
				createdAt: dateLikeToDate(result.createdAt),
			};
		},
	);

	return session;
}

/**
 * @param {string} token - The token to be validated.
 * @param {object} ctx
 * @param {{
 * 	passwordResetSession: {
 * 		findOneWithUser: PasswordResetSessionsProvider['findOneWithUser'];
 * 		deleteOne: PasswordResetSessionsProvider['deleteOne'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<PasswordResetSessionValidationResult>} A promise that resolves to the validation result.
 */
export async function validatePasswordResetSessionToken(token, ctx) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	// const result = await findOnePasswordResetSessionWithUserRepository(sessionId);
	const result = await ctx.authProviders.passwordResetSession.findOneWithUser(sessionId);

	if (!result.session || Date.now() >= dateLikeToNumber(result.session.expiresAt)) {
		// await deleteOnePasswordResetSessionRepository(sessionId);
		await ctx.authProviders.passwordResetSession.deleteOne(sessionId);
		return { session: null, user: null };
	}

	return result;
}

/**
 * @param {object} ctx
 * @param {CookiesProvider} ctx.cookies - The cookies provider to access the session token cookie.
 * @param {{
 * 	passwordResetSession: {
 * 		findOneWithUser: PasswordResetSessionsProvider['findOneWithUser'];
 * 		deleteOne: PasswordResetSessionsProvider['deleteOne'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<PasswordResetSessionValidationResult>}
 */
export async function validatePasswordResetSessionRequest(ctx) {
	const token = ctx.cookies.get(COOKIE_TOKEN_PASSWORD_RESET_KEY) ?? null;
	if (!token) return { session: null, user: null };
	const result = await validatePasswordResetSessionToken(token, ctx);
	if (!result.session) deletePasswordResetSessionTokenCookie(ctx.cookies);
	return result;
}

const defaultPasswordResetSessionOptions = {
	sameSite: "lax",
	httpOnly: true,
	path: "/",
	secure: process.env.NODE_ENV === "production",
};

/**
 * @param {object} props
 * @param {string} props.token - The token to be used to create the password reset session.
 * @param {DateLike} props.expiresAt - The date at which the password reset session expires.
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token cookie.
 * @param {DynamicCookiesOptions} props.cookiesOptions - The options for the cookies.
 */
export function setPasswordResetSessionTokenCookie(props) {
	const expiresAt = dateLikeToDate(props.expiresAt);
	const cookiesOptions = {
		...defaultPasswordResetSessionOptions,
		expires: expiresAt,
		...(typeof props.cookiesOptions.PASSWORD_RESET_SESSION === "function"
			? props.cookiesOptions.PASSWORD_RESET_SESSION({ expiresAt })
			: props.cookiesOptions.PASSWORD_RESET_SESSION),
	};
	props.cookies.set(COOKIE_TOKEN_PASSWORD_RESET_KEY, props.token, cookiesOptions);
}

/**
 * @warning needs refactor to be able to work with mobile tablet devices
 * @param {object} props
 * @param {CookiesProvider} props.cookies - The cookies provider to access the session token cookie.
 * @param {DynamicCookiesOptions} props.cookiesOptions - The options for the cookies.
 */
export function deletePasswordResetSessionTokenCookie(props) {
	const cookiesOptions = {
		...defaultPasswordResetSessionOptions,
		maxAge: 0,
		...(typeof props.cookiesOptions.PASSWORD_RESET_SESSION === "function"
			? props.cookiesOptions.PASSWORD_RESET_SESSION()
			: props.cookiesOptions.PASSWORD_RESET_SESSION),
	};
	props.cookies.set(COOKIE_TOKEN_PASSWORD_RESET_KEY, "", cookiesOptions);
}

/**
 * @param {string} email - The email to send the password reset email to.
 * @param {string} code - The code to be sent in the password reset email.
 * @returns {Promise<void>}
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function sendPasswordResetEmail(email, code) {
	console.log(`To ${email}: Your reset code is ${code}`);
	console.warn("Email sending is not implemented.");
}
