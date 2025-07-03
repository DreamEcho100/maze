/** @import { AuthProvidersShape, AuthProvidersWithGetSessionUtils } from "@de100/auth/types"; */
import { getSessionOptionsBasics } from "../get-session-options-basics";
import { getCurrentSession } from "./get-current-session";
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
export async function generateAuthSessionProps(props) {
	const input = await generateGetCurrentAuthSessionProps(props);
	const result = await getCurrentSession(input);

	if (!result.session) {
		return null;
	}

	return {
		...input,
		user: result.user,
		session: result.session,
		sessionMetadata: result.metadata,
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
	const input = {
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

	return input;
}
