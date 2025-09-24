// @ts-check

// Constants
const FUNC_ERROR_TEXT = "Expected a function";
const INFINITY = 1 / 0;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

// Optimized regex patterns
const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
const reIsPlainProp = /^\w*$/;
const reLeadingDot = /^\./;
const rePropName =
	/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;
const reIsUint = /^(?:0|[1-9]\d*)$/;

// Core utility functions - optimized for performance
/**
 * SameValueZero equality comparison
 * @param {unknown} value
 * @param {unknown} other
 * @returns {boolean}
 */
const eq = (value, other) =>
	// biome-ignore lint/suspicious/noSelfCompare: SameValueZero comparison for NaN
	value === other || (value !== value && other !== other);

const isArray = Array.isArray;

/**
 * @param {unknown} v
 * @returns {v is Record<PropertyKey, unknown>}
 */
const isObject = (v) =>
	v !== null && (typeof v === "object" || typeof v === "function");

/**
 * @param {unknown} v
 * @returns {v is symbol}
 */
const isSymbol = (v) =>
	typeof v === "symbol" ||
	(v !== null &&
		typeof v === "object" &&
		Object.prototype.toString.call(v) === "[object Symbol]");

/**
 * Convert value to string with special handling for symbols and -0
 * @param {unknown} v
 * @returns {string}
 */
const toString_ = (v) => {
	if (v == null) return "";
	if (typeof v === "string") return v;
	if (isSymbol(v)) {
		return Symbol.prototype.toString ? Symbol.prototype.toString.call(v) : "";
	}
	const result = String(v);
	return result === "0" && 1 / /** @type {number} */ (v) === -INFINITY
		? "-0"
		: result;
};

/**
 * Check if value is a valid array index
 * @param {unknown} value
 * @param {number} [length=MAX_SAFE_INTEGER]
 * @returns {boolean}
 */
const isIndex = (value, length = MAX_SAFE_INTEGER) => {
	return (
		!!length &&
		(typeof value === "number" || reIsUint.test(String(value))) &&
		/** @type {number} */ (value) > -1 &&
		/** @type {number} */ (value) % 1 === 0 &&
		/** @type {number} */ (value) < length
	);
};

/**
 * Check if value is a property name (not a path)
 * @param {unknown} value
 * @param {Record<PropertyKey, unknown>} [object]
 * @returns {boolean}
 */
const isKey = (value, object) => {
	if (isArray(value)) return false;
	const type = typeof value;
	if (
		type === "number" ||
		type === "symbol" ||
		type === "boolean" ||
		value == null ||
		isSymbol(value)
	)
		return true;
	return (
		reIsPlainProp.test(String(value)) ||
		!reIsDeepProp.test(String(value)) ||
		// biome-ignore lint/suspicious/noTsIgnore: <explanation>
		// @ts-ignore
		(object != null && value in Object(object))
	);
};

/**
 * Convert value to a property key
 * @param {unknown} value
 * @returns {PropertyKey}
 */
const toKey = (value) => {
	if (typeof value === "string" || isSymbol(value)) return value;
	const result = String(value);
	return result === "0" && 1 / /** @type {number} */ (value) === -INFINITY
		? "-0"
		: result;
};

/**
 * Simple memoization using Map
 * @template {(...args: any[]) => any} T
 * @param {T} func
 * @param {((...args: Parameters<T>[]) => unknown) | undefined} [resolver]
 * @returns {T & { cache: Map<unknown, ReturnType<T>> }}
 */
const memoize = (func, resolver) => {
	if (
		typeof func !== "function" ||
		(resolver && typeof resolver !== "function")
	) {
		throw new TypeError(FUNC_ERROR_TEXT);
	}

	/**
	 * @this {unknown}
	 * @param {...Parameters<T>} args
	 * @returns {ReturnType<T>}
	 */
	const memoized = function (...args) {
		const key = resolver ? resolver.apply(this, args) : args[0];
		const cache = /** @type {Map<unknown, ReturnType<T>>} */ (memoized.cache);

		if (cache.has(key)) return /** @type {ReturnType<T>} */ (cache.get(key));

		const result = func.apply(this, args);
		cache.set(key, result);
		return result;
	};

	memoized.cache = new Map();
	return /** @type {T & { cache: Map<unknown, ReturnType<T>> }} */ (memoized);
};

/**
 * Parse string path into array of property keys (memoized for performance)
 */
const stringToPath = memoize(
	/**
	 * @param {string} str
	 * @returns {PropertyKey[]}
	 */
	(str) => {
		const normalizedStr = toString_(str);
		/** @type {PropertyKey[]} */
		const result = [];

		if (reLeadingDot.test(normalizedStr)) result.push("");

		normalizedStr.replace(rePropName, (match, number, quote, subString) => {
			result.push(
				quote ? subString.replace(reEscapeChar, "$1") : number || match,
			);
			return match;
		});

		return result;
	},
);

/**
 * Cast value to property path array
 * @param {unknown} value
 * @returns {PropertyKey[]}
 */
const castPath = (value) =>
	isArray(value) ? value : stringToPath(String(value));

/**
 * Assign value to object property only if different (SameValueZero comparison)
 * @param {Record<PropertyKey, unknown>} obj
 * @param {PropertyKey} key
 * @param {unknown} value
 */
const assignValue = (obj, key, value) => {
	const existing = obj[key];
	if (
		!(Object.hasOwn(obj, key) && eq(existing, value)) ||
		(value === undefined && !(key in obj))
	) {
		obj[key] = value;
	}
};

/**
 * Base implementation of set function
 * @param {Record<PropertyKey, unknown>} object
 * @param {PropertyKey | PropertyKey[]} path
 * @param {unknown} value
 * @param {((objValue: unknown, key: PropertyKey, object: Record<PropertyKey, unknown>) => unknown) | undefined} [customizer]
 * @returns {Record<PropertyKey, unknown>}
 */
const baseSet = (object, path, value, customizer) => {
	if (!isObject(object)) return object;

	const keys = isKey(path, object) ? [path] : castPath(path);
	let nested = object;

	for (let i = 0; i < keys.length; i++) {
		const key = toKey(keys[i]);
		let newValue = value;

		if (i !== keys.length - 1) {
			const objValue = nested[key];
			newValue = customizer ? customizer(objValue, key, nested) : undefined;

			if (newValue === undefined) {
				newValue = isObject(objValue)
					? objValue
					: isIndex(keys[i + 1])
						? []
						: {};
			}
		}

		assignValue(nested, key, newValue);
		nested = /** @type {Record<PropertyKey, unknown>} */ (nested[key]);
	}

	return object;
};

/**
 * Sets the value at path of object. If a portion of path doesn't exist, it's created.
 * Arrays are created for missing index properties while objects are created for all other missing properties.
 *
 * @template T
 * @param {T} object - The object to modify
 * @param {PropertyKey | PropertyKey[]} path - The path of the property to set
 * @param {unknown} value - The value to set
 * @returns {T} Returns object
 *
 * @example
 * const obj = { a: [{ b: { c: 3 } }] };
 *
 * set(obj, 'a[0].b.c', 4);
 * console.log(obj.a[0].b.c); // => 4
 *
 * set(obj, ['x', '0', 'y', 'z'], 5);
 * console.log(obj.x[0].y.z); // => 5
 */
export const set = (object, path, value) =>
	object == null
		? object
		: /** @type {typeof object} */ (baseSet(object, path, value));
