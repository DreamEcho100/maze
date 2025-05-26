// date-like-to-date
/**
 * @param {Date|string|number|Object} dateLike - A value that can be converted to a Date object.
 * @returns {Date} - A Date object representing the input value.
 * @throws {TypeError} - If the input value cannot be converted to a Date.
 */
export function dateLikeToDate(dateLike) {
	if (dateLike instanceof Date) {
		return dateLike;
	} else if (typeof dateLike === "string" || typeof dateLike === "number") {
		return new Date(dateLike);
	} else if (dateLike && typeof dateLike === "object" && "toDate" in dateLike) {
		return /** @type {() => Date} */ (dateLike.toDate)();
	}
	throw new TypeError("Invalid date-like value");
}
