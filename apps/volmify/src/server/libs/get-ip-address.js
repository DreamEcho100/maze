"use server";

import { headers } from "next/headers";
import { userAgent as getUserAgent } from "next/server";

/** * Retrieves the client's IP address and user agent from the request headers.
 *
 * @param {Headers} [reqHeaders] - Optional request headers object.
 * @returns {Promise<{ ipAddress: string | null, userAgent: ReturnType<typeof getUserAgent> }>} An object containing the IP address and user agent.
 */
export async function getIPAddressAndUserAgent(reqHeaders) {
	const header = reqHeaders ?? (await headers());
	let ipAddress = null;
	// const ip = header.get("x-forwarded-for") || header.get("x-real-ip") || "";
	// return ip;
	const forwardedFor = header.get("x-forwarded-for");
	if (forwardedFor) {
		// x-forwarded-for can contain multiple IPs, we take the first one
		ipAddress = forwardedFor.split(",")[0]?.trim() ?? null;
	}
	const realIp = header.get("x-real-ip");
	if (realIp) {
		ipAddress = realIp.trim();
	}

	const userAgent = getUserAgent({ headers: header });

	return { ipAddress, userAgent };
}
