"use server";

/** @import { CookiesProvider, HeadersProvider } from "@de100/auth-core/types"; */
import { headers as _headers } from "next/headers";

import { getCookies } from "./get-cookies";

/** * Retrieves the client's IP address and user agent from the request headers.
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 */
export async function getCookiesAndHeaders(reqHeaders) {
	const [cookies, headers] = await Promise.all([
		getCookies(),
		reqHeaders ?? (await _headers()),
	]);
	return { cookies, headers };
}
