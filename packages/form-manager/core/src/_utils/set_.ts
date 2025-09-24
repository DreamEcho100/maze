/**
 * Checks if a property key is unsafe to modify directly.
 *
 * This function is used in functions like `merge` to prevent prototype pollution attacks
 * by identifying property keys that could modify the object's prototype chain or constructor.
 *
 * @param key - The property key to check
 * @returns `true` if the property is unsafe to modify directly, `false` otherwise
 * @internal
 */
export function isUnsafeProperty(key: PropertyKey) {
	return key === "__proto__";
}

/**
 * Performs a `SameValueZero` comparison between two values to determine if they are equivalent.
 *
 * @param {any} value - The value to compare.
 * @param {any} other - The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 *
 * @example
 * eq(1, 1); // true
 * eq(0, -0); // true
 * eq(NaN, NaN); // true
 * eq('a', Object('a')); // false
 */
export function eq(value: any, other: any): boolean {
	return value === other || (Number.isNaN(value) && Number.isNaN(other));
}

export const assignValue = (
	object: any,
	key: PropertyKey,
	value: any,
): void => {
	const objValue = object[key];
	if (
		!(Object.hasOwn(object, key) && eq(objValue, value)) ||
		(value === undefined && !(key in object))
	) {
		object[key] = value;
	}
};

const IS_UNSIGNED_INTEGER = /^(?:0|[1-9]\d*)$/;

export function isIndex(
	value: PropertyKey,
	length = Number.MAX_SAFE_INTEGER,
): boolean {
	switch (typeof value) {
		case "number": {
			return Number.isInteger(value) && value >= 0 && value < length;
		}
		case "symbol": {
			return false;
		}
		case "string": {
			return IS_UNSIGNED_INTEGER.test(value);
		}
	}
}

/**
 * Check whether a value is a symbol.
 *
 * This function can also serve as a type predicate in TypeScript, narrowing the type of the argument to `symbol`.
 *
 * @param {unknown} value The value to check.
 * @returns {value is symbol} Returns `true` if `value` is a symbol, else `false`.
 *
 * @example
 * import { isSymbol } from 'es-toolkit/predicate';
 *
 * isSymbol(Symbol('a')); // true
 * isSymbol(Symbol.for('a')); // true
 * isSymbol(Symbol.iterator); // true
 *
 * isSymbol(null); // false
 * isSymbol(undefined); // false
 * isSymbol('123'); // false
 * isSymbol(false); // false
 * isSymbol(123n); // false
 * isSymbol({}); // false
 * isSymbol([1, 2, 3]); // false
 */
export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol";
}

/**  Matches any deep property path. (e.g. `a.b[0].c`)*/
const regexIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
/**  Matches any word character (alphanumeric & underscore).*/
const regexIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path. (It's ok that the `value` is not in the keys of the `object`)
 * @param {unknown} value The value to check.
 * @param {unknown} object The object to query.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 *
 * @example
 * isKey('a', { a: 1 });
 * // => true
 *
 * isKey('a.b', { a: { b: 2 } });
 * // => false
 */
export function isKey(value?: unknown, object?: unknown): value is PropertyKey {
	if (Array.isArray(value)) {
		return false;
	}

	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		value == null ||
		isSymbol(value)
	) {
		return true;
	}

	return (
		(typeof value === "string" &&
			(regexIsPlainProp.test(value) || !regexIsDeepProp.test(value))) ||
		(object != null && Object.hasOwn(object, value as PropertyKey))
	);
}

export type Many<T> = T | readonly T[];
export type PropertyPath = Many<PropertyKey>;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
export function toKey(value: any) {
	if (typeof value === "string" || typeof value === "symbol") {
		return value;
	}
	if (Object.is(value?.valueOf?.(), -0)) {
		return "-0";
	}
	return String(value);
}

/**
 * Checks if the given value is an object. An object is a value that is
 * not a primitive type (string, number, boolean, symbol, null, or undefined).
 *
 * This function tests whether the provided value is an object or not.
 * It returns `true` if the value is an object, and `false` otherwise.
 *
 * This function can also serve as a type predicate in TypeScript, narrowing the type of the argument to an object value.
 *
 * @param {any} value - The value to check if it is an object.
 * @returns {value is object} `true` if the value is an object, `false` otherwise.
 *
 * @example
 * const value1 = {};
 * const value2 = [1, 2, 3];
 * const value3 = () => {};
 * const value4 = null;
 *
 * console.log(isObject(value1)); // true
 * console.log(isObject(value2)); // true
 * console.log(isObject(value3)); // true
 * console.log(isObject(value4)); // false
 */

export function isObject(value?: any): value is object {
	return (
		value !== null && (typeof value === "object" || typeof value === "function")
	);
}

/**
 * Converts `value` to a string.
 *
 * An empty string is returned for `null` and `undefined` values.
 * The sign of `-0` is preserved.
 *
 * @param {any} value - The value to convert.
 * @returns {string} Returns the converted string.
 *
 * @example
 * toString(null) // returns ''
 * toString(undefined) // returns ''
 * toString(-0) // returns '-0'
 * toString([1, 2, -0]) // returns '1,2,-0'
 * toString([Symbol('a'), Symbol('b')]) // returns 'Symbol(a),Symbol(b)'
 */
export function toString_(value: any): string {
	if (value == null) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(toString_).join(",");
	}

	const result = String(value);

	if (result === "0" && Object.is(Number(value), -0)) {
		return "-0";
	}

	return result;
}

/**
 * Converts a deep key string into an array of path segments.
 *
 * This function takes a string representing a deep key (e.g., 'a.b.c' or 'a[b][c]') and breaks it down into an array of strings, each representing a segment of the path.
 *
 * @param {any} deepKey - The deep key string to convert.
 * @returns {string[]} An array of strings, each representing a segment of the path.
 *
 * Examples:
 *
 * toPath('a.b.c') // Returns ['a', 'b', 'c']
 * toPath('a[b][c]') // Returns ['a', 'b', 'c']
 * toPath('.a.b.c') // Returns ['', 'a', 'b', 'c']
 * toPath('a["b.c"].d') // Returns ['a', 'b.c', 'd']
 * toPath('') // Returns []
 * toPath('.a[b].c.d[e]["f.g"].h') // Returns ['', 'a', 'b', 'c', 'd', 'e', 'f.g', 'h']
 */
export function toPath(deepKey: any): string[] {
	if (Array.isArray(deepKey)) {
		// @types/lodash defines this as string[], but lodash itself returns (string | symbol)[]
		return deepKey.map(toKey) as string[];
	}
	if (typeof deepKey === "symbol") {
		// @types/lodash defines this as string[], but lodash itself returns [symbol]
		return [deepKey as unknown as string];
	}
	deepKey = toString_(deepKey);
	const result: string[] = [];
	const length = deepKey.length;

	if (length === 0) {
		return result;
	}

	let index = 0;
	let key = "";
	let quoteChar = "";
	let bracket = false;

	// Leading dot
	if (deepKey.charCodeAt(0) === 46) {
		result.push("");
		index++;
	}

	while (index < length) {
		const char = deepKey[index];

		if (quoteChar) {
			if (char === "\\" && index + 1 < length) {
				// Escape character
				index++;
				key += deepKey[index];
			} else if (char === quoteChar) {
				// End of quote
				quoteChar = "";
			} else {
				key += char;
			}
		} else if (bracket) {
			if (char === '"' || char === "'") {
				// Start of quoted string inside brackets
				quoteChar = char;
			} else if (char === "]") {
				// End of bracketed segment
				bracket = false;
				result.push(key);
				key = "";
			} else {
				key += char;
			}
		} else {
			if (char === "[") {
				// Start of bracketed segment
				bracket = true;
				if (key) {
					result.push(key);
					key = "";
				}
			} else if (char === ".") {
				if (key) {
					result.push(key);
					key = "";
				}
			} else {
				key += char;
			}
		}

		index++;
	}

	if (key) {
		result.push(key);
	}

	return result;
}

/**
 * Updates the value at the specified path of the given object using an updater function and a customizer.
 * If any part of the path does not exist, it will be created.
 *
 * @template T - The type of the object.
 * @param {T} object - The object to modify.
 * @param {PropertyPath} path - The path of the property to update.
 * @param {(oldValue: any) => any} updater - The function to produce the updated value.
 * @param {(value: any, key: string, object: T) => any} customizer - The function to customize the update process.
 * @returns {T} - The modified object.
 *
 * @example
 * const object = { 'a': [{ 'b': { 'c': 3 } }] };
 * updateWith(object, 'a[0].b.c', (n) => n * n);
 * // => { 'a': [{ 'b': { 'c': 9 } }] }
 */
export function updateWith<T extends object>(
	object: T,
	path: PropertyPath,
	updater: (oldValue: any) => any,
	customizer?: (value: any, key: string, object: T) => any,
): T;

/**
 * Updates the value at the specified path of the given object using an updater function and a customizer.
 * If any part of the path does not exist, it will be created.
 *
 * @template T - The type of the object.
 * @template R - The type of the return value.
 * @param {T} object - The object to modify.
 * @param {PropertyPath} path - The path of the property to update.
 * @param {(oldValue: any) => any} updater - The function to produce the updated value.
 * @param {(value: any, key: string, object: T) => any} customizer - The function to customize the update process.
 * @returns {R} - The modified object.
 *
 * @example
 * const object = { 'a': [{ 'b': { 'c': 3 } }] };
 * updateWith(object, 'a[0].b.c', (n) => n * n);
 * // => { 'a': [{ 'b': { 'c': 9 } }] }
 */
export function updateWith<T extends object, R>(
	object: T,
	path: PropertyPath,
	updater: (oldValue: any) => any,
	customizer?: (value: any, key: string, object: T) => any,
): R;

/**
 * Updates the value at the specified path of the given object using an updater function and a customizer.
 * If any part of the path does not exist, it will be created.
 *
 * @template T - The type of the object.
 * @template R - The type of the return value.
 * @param {T} obj - The object to modify.
 * @param {PropertyPath} path - The path of the property to update.
 * @param {(value: any) => any} updater - The function to produce the updated value.
 * @param {(value: any, key: string, object: T) => any} customizer - The function to customize the update process.
 * @returns {T | R} - The modified object.
 *
 * @example
 * const object = { 'a': [{ 'b': { 'c': 3 } }] };
 * updateWith(object, 'a[0].b.c', (n) => n * n);
 * // => { 'a': [{ 'b': { 'c': 9 } }] }
 */
export function updateWith<T extends object, R>(
	obj: T,
	path: PropertyPath,
	updater: (value: any) => any,
	customizer?: (value: any, key: string, object: T) => any,
): T | R {
	if (obj == null && !isObject(obj)) {
		return obj;
	}

	const resolvedPath = isKey(path, obj)
		? [path]
		: Array.isArray(path)
			? path
			: typeof path === "string"
				? toPath(path)
				: [path];

	let current: any = obj;

	for (let i = 0; i < resolvedPath.length && current != null; i++) {
		const key = toKey(resolvedPath[i]);

		if (isUnsafeProperty(key)) {
			continue;
		}

		let newValue: unknown;

		if (i === resolvedPath.length - 1) {
			newValue = updater(current[key]);
		} else {
			const objValue = current[key];
			const customizerResult = customizer?.(objValue, key as string, obj);
			newValue =
				customizerResult !== undefined
					? customizerResult
					: isObject(objValue)
						? objValue
						: isIndex(resolvedPath[i + 1])
							? []
							: {};
		}

		assignValue(current, key, newValue);
		current = current[key];
	}

	return obj;
}

/**
 * Sets the value at the specified path of the given object. If any part of the path does not exist, it will be created.
 *
 * @template T - The type of the object.
 * @param {T} object - The object to modify.
 * @param {PropertyPath} path - The path of the property to set.
 * @param {any} value - The value to set.
 * @returns {T} - The modified object.
 *
 * @example
 * // Set a value in a nested object
 * const obj = { a: { b: { c: 3 } } };
 * set(obj, 'a.b.c', 4);
 * console.log(obj.a.b.c); // 4
 *
 * @example
 * // Set a value in an array
 * const arr = [1, 2, 3];
 * set(arr, 1, 4);
 * console.log(arr[1]); // 4
 *
 * @example
 * // Create non-existent path and set value
 * const obj = {};
 * set(obj, 'a.b.c', 4);
 * console.log(obj); // { a: { b: { c: 4 } } }
 */
export function set<T extends object>(
	object: T,
	path: PropertyPath,
	value: any,
): T;

/**
 * Sets the value at the specified path of the given object. If any part of the path does not exist, it will be created.
 *
 * @template R - The return type.
 * @param {object} object - The object to modify.
 * @param {PropertyPath} path - The path of the property to set.
 * @param {any} value - The value to set.
 * @returns {R} - The modified object.
 *
 * @example
 * // Set a value in a nested object
 * const obj = { a: { b: { c: 3 } } };
 * set(obj, 'a.b.c', 4);
 * console.log(obj.a.b.c); // 4
 *
 * @example
 * // Set a value in an array
 * const arr = [1, 2, 3];
 * set(arr, 1, 4);
 * console.log(arr[1]); // 4
 *
 * @example
 * // Create non-existent path and set value
 * const obj = {};
 * set(obj, 'a.b.c', 4);
 * console.log(obj); // { a: { b: { c: 4 } } }
 */
export function set<R>(object: object, path: PropertyPath, value: any): R;

/**
 * Sets the value at the specified path of the given object. If any part of the path does not exist, it will be created.
 *
 * @template T - The type of the object.
 * @param {T} obj - The object to modify.
 * @param {PropertyPath} path - The path of the property to set.
 * @param {any} value - The value to set.
 * @returns {T} - The modified object.
 *
 * @example
 * // Set a value in a nested object
 * const obj = { a: { b: { c: 3 } } };
 * set(obj, 'a.b.c', 4);
 * console.log(obj.a.b.c); // 4
 *
 * @example
 * // Set a value in an array
 * const arr = [1, 2, 3];
 * set(arr, 1, 4);
 * console.log(arr[1]); // 4
 *
 * @example
 * // Create non-existent path and set value
 * const obj = {};
 * set(obj, 'a.b.c', 4);
 * console.log(obj); // { a: { b: { c: 4 } } }
 */
export function set<T extends object>(
	obj: T,
	path: PropertyPath,
	value: any,
): T {
	return updateWith(
		obj,
		path,
		() => value,
		() => undefined,
	);
}
