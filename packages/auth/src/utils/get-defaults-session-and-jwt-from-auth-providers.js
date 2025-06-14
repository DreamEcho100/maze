/** @import { AuthProvidersShape, AuthProvidersWithSessionAndJWTDefaults } from "#types.ts"; */

/**
 * @template U
 * @template {AuthProvidersShape} [AdditionalAuthProviders=object]
 * @param {AuthProvidersWithSessionAndJWTDefaults} authProvidersFromInput
 * @param {AdditionalAuthProviders} [additionalAuthProviders]
 * @returns U
 */
export function getDefaultSessionAndJWTFromAuthProviders(
	authProvidersFromInput,
	additionalAuthProviders,
) {
	return {
		...additionalAuthProviders,
		sessions: {
			...additionalAuthProviders?.sessions,
			deleteOneById: authProvidersFromInput.sessions.deleteOneById,
			extendOneExpirationDate: authProvidersFromInput.sessions.extendOneExpirationDate,
			findOneWithUser: authProvidersFromInput.sessions.findOneWithUser,
			revokeOneById: authProvidersFromInput.sessions.revokeOneById,
			createOne: authProvidersFromInput.sessions.createOne,
		},
		jwt: {
			...additionalAuthProviders?.jwt,
			verifyAccessToken: authProvidersFromInput.jwt?.verifyAccessToken,
			createTokenPair: authProvidersFromInput.jwt?.createTokenPair,
		},
	};
}
