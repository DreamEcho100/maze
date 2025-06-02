import { z } from "zod/v4-mini";

// z
// .preprocess((value) => {
// 	if (typeof value === "boolean") {
// 		return value;
// 	}

// 	return value === "on";
// }, z.boolean().optional().default(false))
export const formBoolSchema = z.union([
	z.boolean(),
	z.stringbool({ truthy: ["on"], falsy: ["off"] }),
]);
export const codeSchema = z.string().check(z.minLength(6), z.maxLength(6), z.regex(/^\d+$/));
export const emailSchema = z.email();
// z
// .union([z.boolean(), z.string()])
// .check(
// 	z.overwrite((val) => {
// 		if (typeof val === "boolean") {
// 			return val;
// 		}
// 		return val === "on";
// 	}),
// );

export const registerServiceInputSchema = z.object({
	email: emailSchema,
	name: z.string().check(z.minLength(3), z.maxLength(32)),
	password: z.string().check(z.minLength(8)),
	enable2FA:
		// 	z.preprocess((value) => {
		// 	if (typeof value === "boolean") {
		// 		return value;
		// 	}
		// 	return value === "on";
		// }, z.boolean().optional().default(false)),
		// z.optional(z.union([z.boolean(), z.string()])).check(
		// 	z.overwrite(val => {
		// 		if (typeof val === "boolean") {
		// 			return val;
		// 		}
		// 		return val === "on";
		// 	})
		// ),
		z.prefault(formBoolSchema, false),
});

export const loginServiceInputSchema = z.object({
	email: emailSchema,
	password: z.string().check(z.minLength(6)),
});

export const verifyEmailServiceInputSchema = z.object({ code: codeSchema });

export const reset2FAServiceInputSchema = z.object({ code: codeSchema });

export const setup2FAServiceInputSchema = z.object({
	code: codeSchema,
	encodedKey: z.string().check(z.minLength(28)),
});

export const verify2FAServiceInputSchema = z.object({ code: codeSchema });

export const verifyPasswordResetEmailVerificationServiceSchemaInput = z.object({
	code: codeSchema,
});

export const verifyPasswordReset2FAViaRecoveryCodeServiceInputSchema = z.object({
	code: codeSchema,
});

export const adminRegisterServiceInputSchema = z.object({
	// email: z.string().email(),
	email: emailSchema,
	// name: z.string().min(3).max(32),
	name: z.string().check(z.minLength(3), z.maxLength(32)),
	// password: z.string().min(8),
	password: z.string().check(z.minLength(8)),
	// enable2FA: z.preprocess((value) => {
	// 	if (typeof value === "boolean") {
	// 		return value;
	// 	}
	// 	return value === "on";
	// }, z.boolean().optional().default(false)),
	enable2FA: z.prefault(formBoolSchema, false),
});

export const forgotPasswordServiceInputSchema = z.object({
	email: emailSchema,
});
