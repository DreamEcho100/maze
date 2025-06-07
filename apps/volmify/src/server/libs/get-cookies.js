"use server";

/** @import { CookiesProvider, HeadersProvider } from "@de100/auth/types"; */
import { cookies as _cookies, headers as _headers } from "next/headers";

import { dateLikeToDate } from "@de100/auth/utils/dates";

/** @returns {Promise<CookiesProvider>} */
export async function getCookies() {
	const cookies = await _cookies();

	return {
		get: (name) => cookies.get(name)?.value,
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
