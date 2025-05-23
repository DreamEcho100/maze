/** @import { IdsProvider } from '#types.ts'; */

export let idsProvider = /** @type {IdsProvider} */({});

/** @param {IdsProvider} newIdsProvider */
export function setIdsProvider(newIdsProvider) {
	idsProvider = newIdsProvider;
}