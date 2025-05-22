/** @import { CookiesProvider } from '#types.ts'; */

export let jar = /** @type {CookiesProvider} */({});

/** @param {CookiesProvider} newJar */
export function setJar(newJar) {
	jar = newJar;
}