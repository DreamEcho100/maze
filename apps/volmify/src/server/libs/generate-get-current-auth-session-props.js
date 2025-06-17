"use server";

/** @import { AuthProvidersShape, AuthProvidersWithGetSessionUtils } from "@de100/auth/types"; */
import { cookies as _cookies, headers as _headers } from "next/headers";

import {
	authStrategy,
	createOneIdSync,
	createOneSession,
	deleteOneSessionById,
	extendOneSessionExpirationDate,
	findOneSessionWithUser,
	revokeOneSessionById,
} from "./auth/init";
import { getSessionOptionsBasics } from "./get-session-options-basics";

/**
 * @param {AuthProvidersShape} [authProvidersFromInput]
 */
export function getDefaultSessionAndJWTFromAuthProviders(authProvidersFromInput) {
	return {
		...authProvidersFromInput,
		sessions: {
			...authProvidersFromInput?.sessions,
			deleteOneById: deleteOneSessionById,
			extendOneExpirationDate: extendOneSessionExpirationDate,
			findOneWithUser: findOneSessionWithUser,
			revokeOneById: revokeOneSessionById,
			createOne: createOneSession,
		},
		jwt: {
			...authProvidersFromInput?.jwt,
			// createRefreshToken: authProvidersFromInput.jwt?.createRefreshToken,
			// verifyRefreshToken: authProvidersFromInput.jwt?.verifyRefreshToken,
			// createAccessToken: authProvidersFromInput.jwt?.createAccessToken,
			// verifyAccessToken: authProvidersFromInput.jwt?.verifyAccessToken,
		},
	};
}

/**
 * @template {Partial<AuthProvidersWithGetSessionUtils> & {
 * 	authProviders?: AuthProvidersShape
 * 	reqHeaders?: Headers;
 * }} TProps
 * @param {TProps} props
 */
export async function generateGetCurrentAuthSessionProps(props) {
	return {
		...(await getSessionOptionsBasics(props.reqHeaders)),
		...props,
		authStrategy: authStrategy,
		generateRandomId: createOneIdSync,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	};
}
