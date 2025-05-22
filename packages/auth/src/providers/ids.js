/** @import { IdsProvider } from '#types.ts'; */

export let ids = /** @type {IdsProvider} */({});

/** @param {IdsProvider} newIds */
export function setIds(newIds) {
	ids = newIds;
}