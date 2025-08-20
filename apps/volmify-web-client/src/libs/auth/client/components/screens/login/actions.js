import { loginUserService } from "@de100/auth-core/services/login";
import {
	authStrategy,
	createOneIdSync,
	createOneSession,
	findOneUserByEmail,
	getOneUserPasswordHash,
} from "@de100/db/auth/init";
import { getSessionOptionsBasics } from "#libs/server/get-session-options-basics.js";
// import { getSessionOptionsBasics } from "#libs/server/get-session-options-basics.js";

/**
 * @param {{ email: unknown, password: unknown }} input
 */
export async function loginAction(input) {
	"use server";

	const result = await loginUserService({
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
	});

	return result;
}
