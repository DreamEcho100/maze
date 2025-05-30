/** @import { DateLike } from "#types.ts"  */

/**
 * @param {string|number|Date} dateLike
 * @returns {number}
 */
export function dateLikeToNumber(dateLike) {
	return typeof dateLike === "number"
		? dateLike
		: dateLike instanceof Date
			? dateLike.getTime()
			: new Date(dateLike).getTime();
}

/**
 * @param {string|number|Date} dateLike
 * @returns {Date}
 */
export function dateLikeToDate(dateLike) {
	return dateLike instanceof Date ? dateLike : new Date(dateLike);
}

/**
 * @param {DateLike} dateLike
 * @returns {string}
 */
export function dateLikeToISOString(dateLike) {
	return dateLikeToDate(dateLike).toISOString();
}
