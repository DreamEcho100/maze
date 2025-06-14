/** @import { DateLike, PasswordResetSession, PasswordResetSessionValidationResult, CookiesProvider, PasswordResetSessionsProvider } from "#types.ts"; */

import {
	COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION,
	COOKIE_TOKEN_PASSWORD_RESET_KEY,
} from "./constants.js";
import { dateLikeToDate, dateLikeToNumber } from "./dates.js";
import { generateRandomOTP } from "./generate-randomotp.js";
import { getSessionId } from "./get-session-id.js";

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
	const sessionId = getSessionId(props.data.token);

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
	const sessionId = getSessionId(token);
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
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 * @param {object} ctx
 * @param {{
 * 	passwordResetSession: {
 * 		findOneWithUser: PasswordResetSessionsProvider['findOneWithUser'];
 * 		deleteOne: PasswordResetSessionsProvider['deleteOne'];
 * 	}
 * }} ctx.authProviders
 * @returns {Promise<PasswordResetSessionValidationResult>}
 */
export async function validatePasswordResetSessionRequest(cookies, ctx) {
	const token = cookies.get(COOKIE_TOKEN_PASSWORD_RESET_KEY) ?? null;
	if (!token) return { session: null, user: null };
	const result = await validatePasswordResetSessionToken(token, ctx);
	if (!result.session) deletePasswordResetSessionTokenCookie(cookies);
	return result;
}

/**
 * @param {string} token - The token to be used to create the password reset session.
 * @param {DateLike} expiresAt - The date at which the password reset session expires.
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export function setPasswordResetSessionTokenCookie(token, expiresAt, cookies) {
	cookies.set(COOKIE_TOKEN_PASSWORD_RESET_KEY, token, {
		expires: dateLikeToDate(expiresAt),
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
	});
}

/**
 * @warning needs refactor to be able to work with mobile tablet devices
 * @param {CookiesProvider} cookies - The cookies provider to access the session token cookie.
 */
export function deletePasswordResetSessionTokenCookie(cookies) {
	cookies.set(COOKIE_TOKEN_PASSWORD_RESET_KEY, "", {
		maxAge: 0,
		sameSite: "lax",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
	});
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
