import { registerService } from "@de100/auth-core/services/register";
import { REGISTER_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
// TODO: fix import
// import { RegisterServiceInputSchema } from "node_modules/@de100/auth-core/src/utils/validations.js";
import { RegisterServiceInputSchema } from "@de100/auth-shared/validations";
import {
	authStrategy,
	createOneEmailVerificationRequests,
	createOneUser,
	deleteOneEmailVerificationRequestsByUserId,
	findOneUserByEmail,
} from "@de100/db/auth/init";
// import { buildRedirectConfig } from "node_modules/@de100/i18n-solid-startjs/src/server/index.ts";
import { getSessionOptionsBasics } from "#libs/auth/server/utils.js";
import { CredentialSchema, TokenSchema } from "../../schemas/auth.ts";
import { UserSchema } from "../../schemas/user.ts";
import { authed, pub } from "./_root.ts";

export const signup = pub
	.route({
		method: "POST",
		path: "/auth/signup",
		summary: "Sign up a new user",
		tags: ["Authentication"],
	})
	.input(RegisterServiceInputSchema)
	// .output(UserSchema)
	.handler(async ({ input }) => {
		try {
			return await registerService({
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
			});
		} catch (error) {
			console.error("Error during signup:", error);
			return REGISTER_MESSAGES_ERRORS.INTERNAL_SERVER_ERROR;
		}
	});

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

export const signin = pub
	.route({
		method: "POST",
		path: "/auth/signin",
		summary: "Sign in a user",
		tags: ["Authentication"],
	})
	.input(CredentialSchema)
	.output(TokenSchema)
	.handler(async ({ input, context }) => {
		return { token: "token" };
	});

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
