import { loginUserService } from "@de100/auth-core/services/login";
import { registerService } from "@de100/auth-core/services/register";
import { resendEmailVerificationCodeService } from "@de100/auth-core/services/resend-email-verification-code";
import { verifyEmailUserService } from "@de100/auth-core/services/verify-email";
import {
	AUTHENTICATION_REQUIRED,
	INTERNAL_SERVER_ERROR,
	REGISTER_MESSAGES_ERRORS,
} from "@de100/auth-shared/constants";
// TODO: fix import
// import { RegisterServiceInputSchema } from "node_modules/@de100/auth-core/src/utils/validations.js";
import {
	LoginServiceInputSchema,
	RegisterServiceInputSchema,
	VerifyEmailServiceInputSchema,
} from "@de100/auth-shared/validations";
import {
	authStrategy,
	createOneEmailVerificationRequests,
	createOneIdSync,
	createOneSession,
	createOneUser,
	deleteAllPasswordResetSessionsByUserId,
	deleteOneEmailVerificationRequestsByUserId,
	findOneEmailVerificationRequestsByIdAndUserId,
	findOneUserByEmail,
	getOneUserPasswordHash,
	updateOneUserEmailAndVerify,
} from "@de100/db/auth/init";
import { db } from "@de100/db/client";
import { z } from "vinxi";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
// import { buildRedirectConfig } from "node_modules/@de100/i18n-solid-startjs/src/server/index.ts";
import { getSessionOptionsBasics } from "#libs/auth/server/utils.js";
import { CredentialSchema, TokenSchema } from "../../schemas/auth.ts";
import { UserSchema } from "../../schemas/user.ts";
import { authed, pub } from "./_root.ts";

export const register = pub
	.route({
		method: "POST",
		path: "/auth/register",
		summary: "Sign up a new user",
		tags: ["Authentication"],
	})
	.input(RegisterServiceInputSchema)
	// .output(UserSchema)
	.handler(({ input }) => {
		return registerService({
			...getSessionOptionsBasics(),
			// generateRandomId: createOneIdSync,
			input,
			authStrategy,
			authProviders: {
				userEmailVerificationRequests: {
					createOne: createOneEmailVerificationRequests,
					deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
				},
				users: {
					createOne: createOneUser,
					findOneByEmail: findOneUserByEmail,
				},
			},
		}).catch((error) => {
			console.error(error);
			return INTERNAL_SERVER_ERROR;
		});
	});
// .actionable();

// export const redirect_ = pub
// 	.route({
// 		method: "GET",
// 		path: "/redirect",
// 		successStatus: 307,
// 		outputStructure: "detailed",
// 	})
// 	.handler(async () => {
// 		return {
// 			headers: {
// 				location: "https://orpc.unnoq.com",
// 			},
// 		};
// 	});

export const login = pub
	.route({
		method: "POST",
		path: "/auth/login",
		summary: "Sign in a user",
		tags: ["Authentication"],
	})
	.input(LoginServiceInputSchema)
	// .output(TokenSchema)
	.handler(({ input }) => {
		return loginUserService({
			...getSessionOptionsBasics(),
			generateRandomId: createOneIdSync,
			input,
			authStrategy,
			authProviders: {
				sessions: { createOne: createOneSession },
				users: {
					findOneByEmail: findOneUserByEmail,
					getOnePasswordHash: getOneUserPasswordHash,
				},
			},
		}).catch((error) => {
			console.error(error);
			return INTERNAL_SERVER_ERROR;
		});
	});
// .actionable();

export const verifyEmail = pub
	.route({
		method: "POST",
		path: "/auth/verify-email",
		summary: "Verify user's email",
		tags: ["Authentication"],
	})
	.input(VerifyEmailServiceInputSchema)
	// .output(UserSchema)
	.handler(async ({ input }) => {
		try {
			const authProps = await generateAuthSessionProps({
				input,
				authProviders: {
					passwordResetSessions: {
						deleteAllByUserId: deleteAllPasswordResetSessionsByUserId,
					},
					users: { updateOneEmailAndVerify: updateOneUserEmailAndVerify },
					userEmailVerificationRequests: {
						findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
						createOne: createOneEmailVerificationRequests,
						deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
					},
				},
			});

			if (!authProps?.session) {
				return AUTHENTICATION_REQUIRED;
			}

			const result = await db.transaction(async (tx) =>
				verifyEmailUserService({ ...authProps, tx }),
			);
			return result;
		} catch (error) {
			console.error(error);
			return INTERNAL_SERVER_ERROR;
		}
	});
// .actionable();

export const resendEmailVerificationCode = authed
	.route({
		method: "POST",
		path: "/auth/resend-email-verification-code",
		summary: "Resend email verification code",
		tags: ["Authentication"],
	})
	// .input(z.object({ email: CredentialSchema.shape.email }))
	// .output(z.object({ success: z.boolean() }))
	.input(z.void())
	.handler(async () => {
		try {
			const authProps = await generateAuthSessionProps({
				authProviders: {
					userEmailVerificationRequests: {
						findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
						createOne: createOneEmailVerificationRequests,
						deleteOneByUserId: deleteOneEmailVerificationRequestsByUserId,
					},
				},
			});

			if (!authProps?.session) {
				return AUTHENTICATION_REQUIRED;
			}

			const result = await db.transaction(async (tx) =>
				resendEmailVerificationCodeService({
					...authProps,
					tx,
				}),
			);

			return result;
		} catch (error) {
			console.error(error);
			return INTERNAL_SERVER_ERROR;
		}
	});
// .actionable();

export const me = authed
	.route({
		method: "GET",
		path: "/auth/me",
		summary: "Get the current user",
		tags: ["Authentication"],
	})
	.output(UserSchema)
	.handler(async ({ input, context }) => {
		return context.user;
	});
