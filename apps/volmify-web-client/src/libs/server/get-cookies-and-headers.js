"use server";

/** @import { CookiesProvider, HeadersProvider } from "@de100/auth-core/types"; */
import { headers as _headers } from "next/headers";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { getCookies } from "./get-cookies";

/** * Retrieves the client's IP address and user agent from the request headers.
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 */
export async function getCookiesAndHeaders(reqHeaders) {
	const [cookies, headers] = await Promise.all([
		getCookiesManager(),
		reqHeaders ?? (await _headers()),
	]);
	return { cookies, headers };
}
