"use server";

/** @import { CookiesProvider, DynamicCookiesOptions, HeadersProvider } from "@de100/auth/types"; */
import { cookies as _cookies, headers as _headers } from "next/headers";
import { userAgent as getUserAgent } from "next/server";

import { getCookiesAndHeaders } from "./get-cookies-and-headers";

/** * Retrieves the client's IP address and user agent from the request headers.
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 * @returns {Promise<{ ipAddress: string | null, userAgent: ReturnType<typeof getUserAgent>; cookies: CookiesProvider; headers: HeadersProvider; cookiesOptions: DynamicCookiesOptions }>} An object containing the IP address and user agent.
 */
export async function getSessionOptionsBasics(reqHeaders) {
	const { cookies, headers } = await getCookiesAndHeaders(reqHeaders);

	let ipAddress = null;
	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, we take the first one
		ipAddress = forwardedFor.split(",")[0]?.trim() ?? null;
	}
	const realIp = headers.get("x-real-ip");
	if (realIp) {
		ipAddress = realIp.trim();
	}

	const userAgent = getUserAgent({ headers: headers });

	/** @type {DynamicCookiesOptions} */
	const cookiesOptions = {};

	return { ipAddress, userAgent, cookies, headers, cookiesOptions };
}
