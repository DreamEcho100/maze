/** @import { UserAgent } from "#types.ts"; */

/** @param {UserAgent} ua */
export const checkIsDeviceMobileOrTablet = (ua) =>
	ua.device.type === "mobile" || ua.device.type === "tablet";
