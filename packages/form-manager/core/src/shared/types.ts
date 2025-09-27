import type {
	FieldNode,
	FieldNodeConfigNeverLevel,
	FieldNodeConfigPrimitiveLevel,
} from "#fields/shape/types.js";
import type {
	fieldNodeConfigValidationEventsEnum,
	fieldNodePresenceEnum,
	fieldNodeTokenEnum,
	fnConfigKey,
	fnIOValueToInfer,
} from "../constants.js";

export type AnyRecord = Record<string, any>;
export type NeverRecord = Record<string, never>;
export type PathSegmentItem = string | number; //| PathSegment;
export type Literal = string | number | bigint | boolean | null | undefined;

export type FnConfigKey = typeof fnConfigKey;
export type FnIOValueToInfer = typeof fnIOValueToInfer;

// export type FieldNodeConfigTokenEnum['arrayItem'] = typeof ARRAY_ITEM_TOKEN;
export type FieldNodeConfigPresenceEnum = typeof fieldNodePresenceEnum;
export type FieldNodeConfigPresence =
	FieldNodeConfigPresenceEnum[keyof FieldNodeConfigPresenceEnum];
export type FieldNodeConfigTokenEnum = typeof fieldNodeTokenEnum;
export type FieldNodeConfigToken =
	FieldNodeConfigTokenEnum[keyof FieldNodeConfigTokenEnum];

// form-manger/shared.ts
export type ValuesShape = Record<string, any>;
// export type ValidationEvents = "input" | "blur" | "touch" | "submit";
/** Validation triggers */
export type FormFieldNodeConfigValidationEventsEnum =
	typeof fieldNodeConfigValidationEventsEnum;
export type FieldNodeConfigValidationEvent =
	FormFieldNodeConfigValidationEventsEnum[keyof FormFieldNodeConfigValidationEventsEnum];
export interface FieldNodeConfigValidateOptions {
	/** The validation event that triggered the validation. */
	validationEvent: FieldNodeConfigValidationEvent;
}
/**
 * This is used by the user/dev to add a specific metadata to the field for further extension and functionalities.
 */
// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface FieldNodeConfigUserMetadata {}

type JoinPath<
	P extends string,
	K extends string | number | bigint,
> = P extends "" ? `${K}` : `${P}.${K}`;
type IntegerString<T> = T extends `${number}`
	? T extends `${number}.${number}`
		? never // Reject if it contains a decimal
		: T
	: never;

const t = {} as JoinPath<"a.b", 0>; // Expected: "a.b.0"
//    ^?

export interface Config {
	// So the user can configure/override this if needed
	maxDepthForNestedPath: 10; // default is 24, can be increased if needed
}

export type CreateDepthArray<
	N extends number,
	R extends unknown[] = [],
> = R["length"] extends N ? R : CreateDepthArray<N, [unknown, ...R]>;
type DepthArray = CreateDepthArray<Config["maxDepthForNestedPath"]>;
// <https://www.esveo.com/en/blog/how-to-workaround-the-max-recursion-depth-in-typescript/>
// <https://medium.com/@wastecleaner/advanced-typescript-depth-control-of-recursive-structures-b2c66ef0af95>
// <https://herringtondarkholme.github.io/2023/04/30/typescript-magic/>
export type NestedPath<
	T,
	Path extends string = "",
	// NOTE:
	// Type-level recursion depth tracking to prevent infinite recursion
	// Used on some places here to avoid the error:
	// "Type instantiation is excessively deep and possibly infinite. ts(2589)"
	CurrentDepth extends unknown[] = // Config["maxDepthForNestedArr"],
	DepthArray,
> = CurrentDepth extends [any, ...infer DepthRest]
	? // Tuple branch
		T extends readonly [any, ...any[]]
		? {
				[K in IntegerString<keyof T>]: T[K] extends Record<PropertyKey, any> // T & `${number}`
					? // NOTE: Not providing `DepthRest` here didn't cause issues in practice
						JoinPath<Path, K> | NestedPath<T[K], JoinPath<Path, K>>
					: JoinPath<Path, K>;
			}[IntegerString<keyof T>] // T & `${number}`
		: // Array branch
			T extends (infer U)[]
			? // NOTE: we use `bigint` because `number` causes issues like accidentally allowing decimals so it can allow excessive paths
				// e.g. `{ a: string[] }` with path `a`, `a.0`, `a.1`, but also `a.1.5` which is not desired
				// Sometimes the "wrong" solution is the right solution! :D
				// Credits to <https://stackoverflow.com/a/61199349/13961420>
					| JoinPath<Path, bigint | FieldNodeConfigTokenEnum["arrayItem"]>
					| (U extends Record<PropertyKey, any>
							? NestedPath<
									U,
									JoinPath<
										Path,
										bigint | FieldNodeConfigTokenEnum["arrayItem"]
									>,
									DepthRest
								>
							: never)
			: // | JoinPath<Path, FieldNodeConfigTokenEnum['arrayItem']>
				// | (T[number] extends Record<PropertyKey, any>
				// 		? NestedPath<T[number], JoinPath<Path, FieldNodeConfigTokenEnum['arrayItem']>, Rest>
				// 		: never)
				// Object branch
				{
					[K in keyof T]: NonNullable<T[K]> extends Record<PropertyKey, any>
						?
								| JoinPath<Path, K & string>
								| NestedPath<
										NonNullable<T[K]>,
										JoinPath<Path, K & string>,
										DepthRest
								  >
						: JoinPath<Path, K & string>;
				}[keyof T & string]
	: never;

type NormalizedPathSegment<Segment extends PathSegmentItem> =
	Segment extends FieldNodeConfigTokenEnum["arrayItem"]
		? number
		: Segment extends FieldNodeConfigTokenEnum["recordProperty"]
			? PathSegmentItem
			: Segment extends FieldNodeConfigTokenEnum["unionOptionOn"]
				? ""
				: Segment;

type NormalizedPathStringSegment<
	Segment extends PathSegmentItem,
	PathSegments extends PathSegmentItem[] = [],
	ParentNode extends FieldNode = {
		[Key in FnConfigKey]: FieldNodeConfigNeverLevel;
	},
	NormalizedPathSegments extends PathSegmentItem[] = [],
> = Segment extends FieldNodeConfigTokenEnum["arrayItem"]
	? ParentNode[FnConfigKey]["level"] extends "array"
		? {
				normalizedPathString: PathSegmentsToString<
					[...NormalizedPathSegments, number]
				>;
				normalizedPathSegments: [...NormalizedPathSegments, number];
			}
		: {
				normalizedPathString: PathSegmentsToString<
					[...NormalizedPathSegments, Segment]
				>;
				normalizedPathSegments: [...NormalizedPathSegments, Segment];
			}
	: Segment extends FieldNodeConfigTokenEnum["recordProperty"]
		? ParentNode[FnConfigKey]["level"] extends "record"
			? {
					normalizedPathString: PathSegmentsToString<
						[...NormalizedPathSegments, PathSegmentItem]
					>;
					normalizedPathSegments: [...NormalizedPathSegments, PathSegmentItem];
				}
			: {
					normalizedPathString: PathSegmentsToString<
						[...NormalizedPathSegments, Segment]
					>;
					normalizedPathSegments: [...NormalizedPathSegments, Segment];
				}
		: Segment extends number
			? PathSegments extends [
					...infer PrevPathSegments extends PathSegmentItem[],
					FieldNodeConfigTokenEnum["unionOptionOn"],
				]
				? {
						normalizedPathString: PathSegmentsToString<PrevPathSegments>;
						normalizedPathSegments: PrevPathSegments;
					}
				: {
						normalizedPathString: PathSegmentsToString<
							[...NormalizedPathSegments]
						>;
						normalizedPathSegments: [...NormalizedPathSegments];
					}
			: {
					normalizedPathString: PathSegmentsToString<
						[...NormalizedPathSegments, Segment]
					>;
					normalizedPathSegments: [...NormalizedPathSegments, Segment];
				};

type Values<T> = T[keyof T];
type IsFieldNodePrimitive<
	ParentNode extends FieldNode,
	K extends keyof ParentNode,
> = ParentNode[K] extends FieldNodeConfigPrimitiveLevel
	? K extends FieldNodeConfigTokenEnum["recordProperty"]
		? 0
		: 1
	: 0;
export type DeepFieldNodePath<
	ParentNode extends FieldNode,
	Path extends string = "",
	PathSegments extends PathSegmentItem[] = [],
	NormalizedPathSegments extends PathSegmentItem[] = [],
> = Values<{
	[K in keyof ParentNode & string]: IsFieldNodePrimitive<
		ParentNode,
		K
	> extends 1
		? {
				pathString: JoinPath<Path, K>;
				pathSegments: [...PathSegments, K];
				fieldNode: ParentNode[K];
				// plevel: ParentNode[FnConfigKey]["level"];
				// segment__arrItemTest: K extends FieldNodeConfigTokenEnum["arrayItem"]
				// 	? ParentNode[FnConfigKey]["level"] extends "array"
				// 		? 1
				// 		: 0.1
				// 	: 0;
				// segment__rcrdPrpTest: K extends FieldNodeConfigTokenEnum["recordProperty"]
				// 	? ParentNode[FnConfigKey]["level"] extends "record"
				// 		? 1
				// 		: 0.1
				// 	: 0;
			} & NormalizedPathStringSegment<
				K,
				PathSegments,
				ParentNode,
				NormalizedPathSegments
			>
		:
				| ({
						pathString: JoinPath<Path, K>;
						pathSegments: [...PathSegments, K];
						fieldNode: ParentNode[K];
						// plevel: ParentNode[FnConfigKey]["level"];
						// segment__arrItemTest: K extends FieldNodeConfigTokenEnum["arrayItem"]
						// 	? ParentNode[FnConfigKey]["level"] extends "array"
						// 		? 1
						// 		: 0.1
						// 	: 0;
						// segment__rcrdPrpTest: K extends FieldNodeConfigTokenEnum["recordProperty"]
						// 	? ParentNode[FnConfigKey]["level"] extends "record"
						// 		? 1
						// 		: 0.1
						// 	: 0;
				  } & NormalizedPathStringSegment<
						K,
						PathSegments,
						ParentNode,
						NormalizedPathSegments
				  >)
				| DeepFieldNodePath<
						ParentNode[K],
						JoinPath<Path, K>,
						[...PathSegments, K],
						NormalizedPathStringSegment<
							K,
							PathSegments,
							ParentNode,
							NormalizedPathSegments
						>["normalizedPathSegments"]
				  >;
}>;

export type PathSegmentsToString<
	S extends PathSegmentItem[],
	Acc extends string = "",
> = S extends [infer First, ...infer Rest extends PathSegmentItem[]]
	? First extends PathSegmentItem
		? PathSegmentsToString<
				Rest,
				Acc extends "" ? `${First}` : `${Acc}.${First}`
			>
		: never
	: Acc;

// normalizedPathString: "b";
// normalizedPathSegments: ["b"];
export type DeepFieldNodePathEntry<T extends FieldNode> =
	// DeepFieldNodePath<T> extends infer U
	// 	? U extends {
	// 			normalizedPathString: infer NPS;
	// 			pathSegments: infer PS;
	// 			fieldNode: infer FN;
	// 		}
	// 		? {
	// 				normalizedPathString: NPS extends string ? NPS : never;
	// 				pathSegments: PS extends PathSegmentItem[] ? PS : never;
	// 				fieldNode: FN extends FieldNode ? FN : never;
	// 			}
	// 		: never
	// 	: never;
	DeepFieldNodePath<T> extends {
		normalizedPathString: infer NPS extends string;
		pathSegments: infer PS extends PathSegmentItem[];
		fieldNode: infer FN extends FieldNode;
	}
		? {
				normalizedPathString: NPS;
				pathSegments: PS;
				fieldNode: FN;
			}
		: never;

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
