/** @import { AuthProvidersWithGetSessionProviders, AuthProvidersWithGetSessionUtils } from "#types.ts"; */

import { isPromise } from "util/types";

/**
 * @param {AuthProvidersWithGetSessionProviders} authProvidersFromInput
 */
export function getDefaultSessionAndJWTFromAuthProviders(authProvidersFromInput) {
	return {
		...authProvidersFromInput,
		sessions: {
			...authProvidersFromInput.sessions,
			deleteOneById: authProvidersFromInput.sessions.deleteOneById,
			extendOneExpirationDate: authProvidersFromInput.sessions.extendOneExpirationDate,
			findOneWithUser: authProvidersFromInput.sessions.findOneWithUser,
			revokeOneById: authProvidersFromInput.sessions.revokeOneById,
			createOne: authProvidersFromInput.sessions.createOne,
		},
		jwt: {
			...authProvidersFromInput.jwt,
			verifyAccessToken: authProvidersFromInput.jwt?.verifyAccessToken,
			createTokenPair: authProvidersFromInput.jwt?.createTokenPair,
			verifyRefreshToken: authProvidersFromInput.jwt?.verifyRefreshToken,
			createAccessToken: authProvidersFromInput.jwt?.createAccessToken,
		},
	};
}

/**
 * @param {AuthProvidersWithGetSessionUtils & {
 * 	authProviders: AuthProvidersWithGetSessionProviders
 * }} props
 */
export async function generateGetCurrentAuthSessionProps(props) {
	const [userAgent, ipAddress] = await Promise.all([
		props.userAgent
			? typeof props.userAgent === "function"
				? isPromise(props.userAgent)
					? await props.userAgent()
					: props.userAgent()
				: props.userAgent
			: null,
		props.ipAddress
			? typeof props.ipAddress === "function"
				? isPromise(props.ipAddress)
					? await props.ipAddress()
					: props.ipAddress()
				: props.ipAddress
			: null,
	]);

	return {
		ipAddress: ipAddress,
		userAgent: userAgent,
		cookies: props.cookies,
		headers: props.headers,
		tx: props.tx,
		authStrategy: props.authStrategy,
		generateRandomId: props.generateRandomId,
		authProviders: getDefaultSessionAndJWTFromAuthProviders(props.authProviders),
	};
}
