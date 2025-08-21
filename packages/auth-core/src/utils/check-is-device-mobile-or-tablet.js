/** @import { UserAgent } from "@de100/auth-shared/types"; */

/** @param {UserAgent} ua */
export const checkIsDeviceMobileOrTablet = (ua) =>
	ua.device.type === "mobile" || ua.device.type === "tablet";
