"use server";

import { dateLikeToDate } from "@de100/auth-core/utils/dates";
/** @import { CookiesProvider, HeadersProvider } from "@de100/auth-core/types"; */
import { cookies as _cookies } from "next/headers";

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
