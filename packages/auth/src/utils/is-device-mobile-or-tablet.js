/** @import { UserAgent } from "#types.ts"; */

/** @param {UserAgent} ua */
export const isDeviceMobileOrTablet = (ua) =>
	ua.device.type === "mobile" || ua.device.type === "tablet";
