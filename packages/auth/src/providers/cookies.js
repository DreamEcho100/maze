/** @import { CookiesProvider } from '#types.ts'; */

export let cookiesProvider = /** @type {CookiesProvider} */({});

/** @param {CookiesProvider} newCookiesProvider */
export function setCookieProvider(newCookiesProvider) {
	cookiesProvider = newCookiesProvider;
}