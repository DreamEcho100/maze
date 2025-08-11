/**
 * @template Value
 * @param {Value | Promise<Value>} value
 * @returns {value is Promise<Value>}
 */
export function isPromise(value) {
	// https://github.com/amannn/next-intl/issues/1711
	return typeof (/** @type {any} */ (value)?.then) === "function";
}
