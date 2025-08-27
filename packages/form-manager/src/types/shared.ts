import type { FORM_VALIDATION_EVENTS } from "../constants";

// form-manger/shared.ts
export type ValuesShape = Record<string, any>;
// export type ValidationEvents = "input" | "blur" | "touch" | "submit";
/** Validation triggers */
export type FormValidationEvent =
	(typeof FORM_VALIDATION_EVENTS)[keyof typeof FORM_VALIDATION_EVENTS];

type JoinPath<
	P extends string,
	K extends string | number | bigint,
> = P extends "" ? `${K}` : `${P}.${K}`;
type IntegerString<T> = T extends `${number}`
	? T extends `${number}.${number}`
		? never // Reject if it contains a decimal
		: T
	: never;
export type NestedPath<T, P extends string = ""> = T extends readonly [
	// Tuple branch
	any,
	...any[],
]
	? {
			[K in IntegerString<keyof T>]: T[K] extends Record<PropertyKey, any> // T & `${number}`
				? JoinPath<P, K> | NestedPath<T[K], JoinPath<P, K>>
				: JoinPath<P, K>;
		}[IntegerString<keyof T>] // T & `${number}`
	: // Array branch
		T extends (infer U)[]
		? // NOTE: we use `bigint` because `number` causes issues like accidentally allowing decimals so it can allow excessive paths
			// e.g. `{ a: string[] }` with path `a`, `a.0`, `a.1`, but also `a.1.5` which is not desired
			// Sometimes the "wrong" solution is the right solution! :D
				| JoinPath<P, bigint>
				| (U extends Record<PropertyKey, any>
						? NestedPath<U, JoinPath<P, number>>
						: never)
		: // Object branch
			{
				[K in keyof T]: NonNullable<T[K]> extends Record<PropertyKey, any>
					?
							| JoinPath<P, K & string>
							| NestedPath<NonNullable<T[K]>, JoinPath<P, K & string>>
					: JoinPath<P, K & string>;
			}[keyof T & string];
// type Test_1_NestedPath = NestedPath<{ a: { b: { c: [ { e: string } ] } }; d: number[] }>; // Expected: "a" | "a.b" | "a.b.c" | "a.b.c.0" | "a.b.c.0.e" | "d" | "d.0"
//    //^?
// const test_1_1 = "a.b.c.0.e" satisfies Test_1_NestedPath; // ok
// const test_1_2 = "d" satisfies Test_1_NestedPath ; // ok// ok
// const test_1_3 = "d.0" satisfies Test_1_NestedPath ; // ok
// type Test_2_NestedPath = NestedPath<[0, { a: {c:0} }]>; // Expected: "0" | "1" | "1.a" | "1.a.c"
//     //^?
// const test_2_1 = "1.a.c" satisfies Test_2_NestedPath; // ok
// const test_2_2 = "0" satisfies Test_2_NestedPath; // ok
// const test_2_3 = "1.a" satisfies Test_2_NestedPath; // ok
// const test_2_4 = "1" satisfies Test_2_NestedPath; // ok
// type Test_3_NestedPath = NestedPath<{ a:  { b: string[] } }>; // Expected: "a" | "a.b" | "a.b.0"
//     //^?
// const test_3_1 = "a" satisfies Test_3_NestedPath; // ok
// const test_3_2 = "a.b.2" satisfies Test_3_NestedPath // ok
// const test_3_3 = "a.b.ddd" satisfies Test_3_NestedPath // should error, ok
// const test_3_4 = "a.b.3.4" satisfies Test_3_NestedPath // should error, and it doesn't, not ok
// const test_3_5 = "a.b.3.4.5" satisfies Test_3_NestedPath // should error, ok

type HasNull<T> = null extends T ? true : false;
type HasUndefined<T> = undefined extends T ? true : false;
type NullOrUndefinedOrBoth<T> = HasNull<T> extends true
	? HasUndefined<T> extends true
		? null | undefined
		: null
	: HasUndefined<T> extends true
		? undefined
		: never;
// type Test_1_NullOrUndefinedOrBoth = NullOrUndefinedOrBoth<string | null | undefined>; // Expected: null | undefined
//     //^?
// type Test_2_NullOrUndefinedOrBoth = NullOrUndefinedOrBoth<string | null>; // Expected: null
//     //^?
// type Test_3_NullOrUndefinedOrBoth = NullOrUndefinedOrBoth<string | undefined>; // Expected: undefined
//     //^?

// Helper: check if a type is an array/tuple and extract element type
type UnwrappedElement<T> = T extends ReadonlyArray<infer U>
	? U
	: T extends Array<infer U>
		? U
		: never;
export type NestedPathValue<
	Obj,
	Path extends string,
> = Path extends `${infer Key}.${infer Rest}`
	? Key extends keyof Obj
		? NestedPathValue<Obj[Key], Rest>
		: Key extends keyof NonNullable<Obj> // if Obj is nullable, try NonNullable<Obj>
			?
					| NestedPathValue<NonNullable<Obj>[Key], Rest>
					| NullOrUndefinedOrBoth<Obj>
			: never
	: Path extends keyof Obj
		? Obj[Path]
		: UnwrappedElement<Obj>;
