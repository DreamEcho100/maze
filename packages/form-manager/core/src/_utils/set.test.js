import { set } from "./set.js";

// Comprehensive test suite (uncomment to test)
const runTests = () => {
	console.log("Running comprehensive tests...");

	// Basic property setting
	/** @type {any} */
	const obj1 = {};
	set(obj1, "a.b.c", "value");
	console.assert(obj1.a.b.c === "value", "Basic nested property");

	// Array indices
	/** @type {any} */
	const obj2 = {};
	set(obj2, "a[0].b", "value");
	console.assert(obj2.a[0].b === "value", "Array index property");

	// Mixed paths
	/** @type {any} */
	const obj3 = {};
	set(obj3, ["a", 0, "b", "c"], "value");
	console.assert(obj3.a[0].b.c === "value", "Mixed array path");

	// Complex quoted keys
	/** @type {any} */
	const obj4 = {};
	set(obj4, 'a["complex key"].b', "value");
	console.assert(obj4.a["complex key"].b === "value", "Quoted key");

	// Symbol keys
	const sym = Symbol("test");
	/** @type {any} */
	const obj5 = {};
	set(obj5, [sym, "b"], "value");
	console.assert(obj5[sym].b === "value", "Symbol key");

	// Escaped quotes
	/** @type {any} */
	const obj6 = {};
	set(obj6, 'a["key with \\"quotes\\""].b', "value");
	console.assert(obj6.a['key with "quotes"'].b === "value", "Escaped quotes");

	// Null/undefined objects
	console.assert(set(null, "a", "value") === null, "Null object");
	console.assert(
		set(undefined, "a", "value") === undefined,
		"Undefined object",
	);

	// Overwriting existing values
	const obj7 = { a: { b: { c: "old" } } };
	set(obj7, "a.b.c", "new");
	console.assert(obj7.a.b.c === "new", "Overwrite existing");

	// NaN equality (SameValueZero)
	const obj8 = { key: NaN };
	const original = obj8.key;
	set(obj8, "key", NaN);
	console.assert(Object.is(obj8.key, original), "NaN equality check");

	console.log("All tests passed!");
};

runTests();
