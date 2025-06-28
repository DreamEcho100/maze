/** @import { AuthProvidersShape, AuthProvidersWithGetSessionUtils } from "@de100/auth/types"; */
import { cookies as _cookies, headers as _headers } from "next/headers";

import { getSessionOptionsBasics } from "../get-session-options-basics";
import {
	authStrategy,
	createOneIdSync,
	createOneSession,
	deleteOneSessionById,
	extendOneSessionExpirationDate,
	findOneSessionWithUser,
	revokeOneSessionById,
} from "./init";

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
		cookiesOptions: props.cookiesOptions ?? {},
		canMutateCookies: true,
		...props,
		authStrategy: authStrategy,
		generateRandomId: createOneIdSync,
		authProviders: {
			...props.authProviders,
			sessions: {
				...props.authProviders?.sessions,
				deleteOneById: deleteOneSessionById,
				extendOneExpirationDate: extendOneSessionExpirationDate,
				findOneWithUser: findOneSessionWithUser,
				revokeOneById: revokeOneSessionById,
				createOne: createOneSession,
			},
			jwt: {
				...props.authProviders?.jwt,
				// createRefreshToken: props.authProviders?.jwt?.createRefreshToken,
				// verifyRefreshToken: props.authProviders?.jwt?.verifyRefreshToken,
				// createAccessToken: props.authProviders?.jwt?.createAccessToken,
				// verifyAccessToken: props.authProviders?.jwt?.verifyAccessToken,
			},
		},
	};
}
