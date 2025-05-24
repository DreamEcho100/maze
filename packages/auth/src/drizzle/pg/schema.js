import { z } from "zod";

export const accountSchema = z.object({
	id: z.string(),
	providerId: z.string(),
	accountId: z.string(),
	userId: z.coerce.string(),
	accessToken: z.string().nullish(),
	refreshToken: z.string().nullish(),
	idToken: z.string().nullish(),
	/**
	 * Access token expires at
	 */
	accessTokenExpiresAt: z.date().nullish(),
	/**
	 * Refresh token expires at
	 */
	refreshTokenExpiresAt: z.date().nullish(),
	/**
	 * The scopes that the user has authorized
	 */
	scope: z.string().nullish(),
	/**
	 * Password is only stored in the credential provider
	 */
	password: z.string().nullish(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const userSchema = z.object({
	id: z.string(),
	email: z.string().transform((val) => val.toLowerCase()),
	emailVerified: z.boolean().default(false),
	name: z.string(),
	image: z.string().nullish(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const sessionSchema = z.object({
	id: z.string(),
	userId: z.coerce.string(),
	expiresAt: z.date(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
	token: z.string(),
	ipAddress: z.string().nullish(),
	userAgent: z.string().nullish(),
});

export const verificationSchema = z.object({
	id: z.string(),
	value: z.string(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
	expiresAt: z.date(),
	identifier: z.string(),
});