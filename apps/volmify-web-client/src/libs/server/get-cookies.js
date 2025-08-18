"use server";

import { dateLikeToDate } from "@de100/auth-core/utils/dates";
/** @import { CookiesProvider, HeadersProvider } from "@de100/auth-core/types"; */

/** @returns {Promise<CookiesProvider>} */
export async function getCookies() {
	return {
		get: (name) => getCookies(name),
		set: (name, value, { expires, ...options } = {}) => {
			cookies.set(name, value, {
				...options,
				expires: expires ? dateLikeToDate(expires) : undefined,
			});
		},
		delete: (name, { expires, ...options } = {}) => {
			cookies.set(name, "", {
				...options,
				expires: expires ? dateLikeToDate(expires) : undefined,
			});
		},
	};
}
