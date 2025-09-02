// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import z from "zod/v4";

export const name = "form-manager-resolver-zod";

interface PathSegment {
	/** The key representing a path segment. */
	readonly key: PropertyKey;
}
type PathSegmentItem = PropertyKey; //| PathSegment;

const ARRAY_ITEM_TOKEN = "@@__ARRAY_ITEM__@@";
type FormValidationEvent = "input" | "blur" | "touch" | "submit";
interface FormManagerError<PathAcc extends PathSegmentItem[] = string[]> {
	/** The error message of the issue. */
	message: string | null;
	/** The path of the issue, if any. */
	pathString: string; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	pathSegments: PathAcc;
}

interface SuccessResult<Output> {
	/** The typed output value. */
	value: Output;
	/** The non-existent issues. */
	issues?: undefined;
}
/** The result interface if validation fails. */
interface FailureResult<PathAcc extends PathSegmentItem[] = string[]> {
	/** The issues of failed validation. */
	issues: ReadonlyArray<FormManagerError<PathAcc>>;
}
type ValidationResult<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> = SuccessResult<ValidValue> | FailureResult<PathAcc>;
interface ValidateOptions {
	/** The validation event that triggered the validation. */
	validationEvent: FormValidationEvent;
}

type Presence = "required" | "optional" | "nullable" | "nullish";

/**
 * This is used by the user/dev to add a specific metadata to the field for further extension and functionalities.
 */
// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
interface FormFieldOptionUserMetadata {}

type AnyRecord = Record<string, any>;
type NeverRecord = Record<string, never>;

interface FormFieldOption<
	LevelName extends string,
	InputValue,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = [],
	NativeRules extends AnyRecord = AnyRecord,
> {
	level: LevelName;
	pathString: string;
	pathSegments: PathSegmentItem[];
	default?: InputValue;
	validation: {
		rules: NativeRules;
		onEvent?: {
			[key in FormValidationEvent]?:
				| boolean
				| {
						debounceMs?: number; // Debounce time in milliseconds, useful for "input" event
						isDebounceLeading?: boolean; // Leading is a boolean indicating whether to trigger on the leading edge of the debounce interval, useful for handling immediate feedback scenarios and cases of when the user stops typing or interacting, default is false (only trailing aka after the user stops)
				  };
		};
		validate: (
			value: any,
			options: ValidateOptions,
		) => Promise<ValidateReturnShape<PathAcc, OutputValue>>;
		isPending?: boolean;
	};
	isDirty?: boolean;
	isTouched?: boolean;
	isDisabled?: boolean;
	isFocused?: boolean;
	// Q: Any need for the following?
	// tabIndex?: number;
	userMetadata: FormFieldOptionUserMetadata;
	metadata?: {
		[key in
			| "object-property"
			| "tuple-direct-item"
			| "array-token-item"
			| "marked-never"]?: boolean;
	} & {
		"intersection-item"?: {
			[pathString: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
		};
		"union-item-descendant"?: {
			originDivergencePathToInfo: Record<
				string,
				{
					originDivergencePath: string;
					originDivergencePathSegments: PathSegmentItem[];
					paths: Set<string>;
				}
			>;
		};
	};
}
interface FormFieldOptionTempRootLevel
	extends FormFieldOption<"temp-root", string[], never, never, AnyRecord> {}
interface FormFieldOptionNeverLevel<
	InputValue = never,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	NativeRules extends Record<string, any> = AnyRecord,
> extends FormFieldOption<
		"never",
		InputValue,
		OutputValue,
		PathAcc,
		NativeRules
	> {}
interface FormFieldOptionUnknownLevel<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	InputValue = unknown,
	OutputValue = InputValue,
	NativeRules extends Record<string, any> = {
		default?: string;
		presence: Presence;
	},
> extends FormFieldOption<
		"unknown",
		InputValue,
		OutputValue,
		PathAcc,
		NativeRules
	> {}
interface FormFieldOptionPrimitiveLevelBase<
	InputValue = any,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	NativeRules extends Record<string, any> = AnyRecord,
> extends FormFieldOption<
		"primitive",
		InputValue,
		OutputValue,
		PathAcc,
		NativeRules & { coerce?: boolean; presence: Presence }
	> {}
interface FormFieldOptionStringPrimitiveLevel<
	InputValue = string,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOptionPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: string;
			minLength?: number;
			maxLength?: number;
			regex?: RegExp;
		}
	> {
	type: "string";
	metadata?: FormFieldOptionPrimitiveLevelBase<any>["metadata"] & {
		enum?: string[];
		"native-enum"?: Record<string, string | number>;
		literal?: string | number | boolean | null;
	};
}
interface FormFieldOptionNumberPrimitiveLevel<
	InputValue = number,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOptionPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: number;
			min?: number;
			inclusiveMin?: boolean;
			max?: number;
			inclusiveMax?: boolean;
			int?: boolean;
			multipleOf?: number | bigint;
		}
	> {
	type: "number";
	metadata?: FormFieldOptionPrimitiveLevelBase<any>["metadata"] & {
		enum?: number[];
		"native-enum"?: Record<string, string | number>;
		literal?: string | number | boolean | null;
	};
}

// type DateLike = Date | string | number;
interface FormFieldOptionDatePrimitiveLevel<
	InputValue = Date,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOptionPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: Date;
			min?: Date;
			inclusiveMin?: boolean;
			max?: Date;
			inclusiveMax?: boolean;
		}
	> {
	type: "date";
}
interface FormFieldOptionBooleanPrimitiveLevel<
	InputValue = boolean,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOptionPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{ default?: boolean }
	> {
	type: "boolean";
}
type FormFieldOptionPrimitiveLevel =
	| FormFieldOptionStringPrimitiveLevel
	| FormFieldOptionNumberPrimitiveLevel
	| FormFieldOptionDatePrimitiveLevel
	| FormFieldOptionBooleanPrimitiveLevel;

interface FormFieldOptionObjectLevel<
	InputValue = AnyRecord,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"object",
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: InputValue;
			presence: Presence;
		}
	> {
	// No need to store `shape` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// shape: Record<string, TrieNode>;
}
interface FormFieldOptionArrayLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"array",
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: any[];
			presence: Presence;
			minLength?: number;
			maxLength?: number;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode; // Need to find a way to reference the main type here
}
interface FormFieldOptionTupleLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"tuple",
		InputValue,
		OutputValue,
		PathAcc,
		{
			default?: any[];
			presence: Presence;
			exactLength?: number;
			minLength?: number;
			maxLength?: number;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode[];
}
interface FormFieldOptionUnionItemLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"union-item",
		InputValue,
		OutputValue,
		PathAcc,
		NeverRecord
	> {
	// No need to store `options` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	options: TrieNode[];
}

interface ValidateReturnShape<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> {
	result: ValidationResult<PathAcc, ValidValue>;
	metadata?: {
		// /** The validation event that triggered the validation, if any. */
		validationEvent: FormValidationEvent;
		"union-item"?: { firstValidOptionIndex: number };
	};
}

type FormFieldOptionShape =
	| FormFieldOptionTempRootLevel
	| FormFieldOptionUnknownLevel
	| FormFieldOptionNeverLevel
	| FormFieldOptionPrimitiveLevel
	| FormFieldOptionObjectLevel
	| FormFieldOptionArrayLevel
	| FormFieldOptionTupleLevel
	| FormFieldOptionUnionItemLevel;

/* Trie structure for path-based storage and retrieval */
const FIELD_CONFIG = Symbol("FIELD_CONFIG");
// interface TrieNode {
// }
type TrieNode<
	Config extends FormFieldOptionShape = FormFieldOptionShape,
	T = Record<string | number, TrieNode<any, any>>,
> = T & {
	[FIELD_CONFIG]: Config;
};
/* End Trie structure */

type ZodAny = z.ZodTypeAny | z.core.$ZodType<any, any, any> | z.core.SomeType;

type ZodCollectionType = z.ZodObject | z.ZodArray | z.ZodTuple;
type FormFieldCollectionType =
	| FormFieldOptionObjectLevel
	| FormFieldOptionArrayLevel
	| FormFieldOptionTupleLevel;
type ZodTupleItemResolverMap<
	T extends readonly ZodAny[],
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionItemDescendant?: boolean } = {},
> = {
	[K in keyof T as K extends `${number}` ? K : never]: ZodResolverTrieResult<
		T[K] extends ZodAny ? T[K] : never,
		T[K] extends ZodAny ? T[K] : never,
		[...PathAcc, K extends `${infer TNum extends number}` ? TNum : never],
		Options
	>;
};

type GetFormFieldOptionGenericParams<TFormFieldOption> =
	TFormFieldOption extends FormFieldOption<
		infer LevelName,
		infer InputValue,
		infer OutputValue,
		infer PathAcc,
		infer NativeRules
	>
		? {
				level: LevelName;
				input: InputValue;
				output: OutputValue;
				pathAcc: PathAcc;
				nativeRules: NativeRules;
			}
		: never;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type AttachCollectableTypeTrieNodesToUnionItemResolverMap<
	Options extends readonly any[],
	PathAcc extends PathSegmentItem[] = [],
> = Prettify<
	Options extends readonly (infer U)[]
		? U extends z.ZodObject
			? {
					[key in keyof U["shape"]]: ZodResolverTrieResult<
						U["shape"][key],
						U["shape"][key],
						[...PathAcc, Extract<key, string>],
						{ isUnionItemDescendant: true }
					>;
				}
			: U extends z.ZodArray
				? {
						[ARRAY_ITEM_TOKEN]: ZodResolverTrieResult<
							U["element"],
							U["element"],
							[...PathAcc, typeof ARRAY_ITEM_TOKEN],
							{ isUnionItemDescendant: true }
						>;
					}
				: U extends z.ZodTuple
					? ZodTupleItemResolverMap<
							U["def"]["items"],
							PathAcc,
							{ isUnionItemDescendant: true }
						>
					: AnyRecord
		: AnyRecord
>;

/*
Prettify<
	{
		[K in keyof Options as K extends `${number}`
			? Options[K] extends ZodCollectionType
				? K
				: never
			: never]: Options[K] extends ZodCollectionType
			? ZodResolverTrieResult<
					Options[K],
					Options[K],
					PathAcc,
					{ isUnionItemDescendant: true }
				>
			: never;
	}[string | number]
>;
*/

type ZodResolverTrieResult<
	ZodSchemaToUnwrap extends ZodAny,
	ZodSchemaToInfer extends ZodAny = ZodSchemaToUnwrap,
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionItemDescendant?: boolean } = {},
> = ZodSchemaToUnwrap extends z.ZodDefault
	? ZodResolverTrieResult<
			ZodSchemaToUnwrap["_zod"]["def"]["innerType"],
			ZodSchemaToInfer,
			PathAcc
		>
	: ZodSchemaToUnwrap extends z.ZodOptional
		? ZodResolverTrieResult<
				ZodSchemaToUnwrap["_zod"]["def"]["innerType"],
				ZodSchemaToInfer,
				PathAcc
			>
		: ZodSchemaToUnwrap extends z.ZodNullable
			? ZodResolverTrieResult<
					ZodSchemaToUnwrap["_zod"]["def"]["innerType"],
					ZodSchemaToInfer,
					PathAcc
				>
			: ZodSchemaToUnwrap extends z.ZodString | z.ZodLiteral | z.ZodEnum
				? TrieNode<
						Options extends { isUnionItemDescendant: true }
							? FormFieldOptionUnionItemLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
							: FormFieldOptionStringPrimitiveLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
					>
				: ZodSchemaToUnwrap extends z.ZodNumber
					? TrieNode<
							Options extends { isUnionItemDescendant: true }
								? FormFieldOptionUnionItemLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
								: FormFieldOptionNumberPrimitiveLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
						>
					: ZodSchemaToUnwrap extends z.ZodBoolean
						? TrieNode<
								Options extends { isUnionItemDescendant: true }
									? FormFieldOptionUnionItemLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
									: FormFieldOptionBooleanPrimitiveLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
							>
						: ZodSchemaToUnwrap extends z.ZodDate
							? TrieNode<
									Options extends { isUnionItemDescendant: true }
										? FormFieldOptionUnionItemLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
										: FormFieldOptionDatePrimitiveLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
								>
							: ZodSchemaToUnwrap extends z.ZodObject
								? TrieNode<
										Options extends { isUnionItemDescendant: true }
											? FormFieldOptionUnionItemLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
											: FormFieldOptionObjectLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
									> & {
										[key in keyof ZodSchemaToUnwrap["shape"]]: ZodResolverTrieResult<
											ZodSchemaToUnwrap["shape"][key],
											ZodSchemaToUnwrap["shape"][key],
											[...PathAcc, Extract<key, string>],
											Options
										>;
									}
								: ZodSchemaToUnwrap extends z.ZodArray
									? TrieNode<
											Options extends { isUnionItemDescendant: true }
												? FormFieldOptionUnionItemLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
												: FormFieldOptionArrayLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
										> & {
											[ARRAY_ITEM_TOKEN]: ZodResolverTrieResult<
												ZodSchemaToUnwrap["element"],
												ZodSchemaToUnwrap["element"],
												[...PathAcc, typeof ARRAY_ITEM_TOKEN],
												Options
											>;
										}
									: ZodSchemaToUnwrap extends z.ZodTuple
										? TrieNode<
												Options extends { isUnionItemDescendant: true }
													? FormFieldOptionUnionItemLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
													: FormFieldOptionTupleLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
											> &
												ZodTupleItemResolverMap<
													ZodSchemaToUnwrap["def"]["items"],
													PathAcc,
													Options
												>
										: // ------------------------------------------------
											//  UNION  (z.union([...]))
											// ------------------------------------------------
											// :
											ZodSchemaToUnwrap extends z.ZodUnion<infer Options>
											? TrieNode<
													FormFieldOptionUnionItemLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
												> &
													AttachCollectableTypeTrieNodesToUnionItemResolverMap<
														Options,
														PathAcc
													>
											: //
												// ZodSchemaToUnwrap extends z.ZodUnion<infer U>
												// ? TrieNode<
												// 		FormFieldOptionUnionItemLevel<
												// 			z.input<ZodSchemaToInfer>,
												// 			z.output<ZodSchemaToInfer>,
												// 			PathAcc
												// 		>
												// 	> & {
												// 		// expose branches under numeric keys so you can write:
												// 		//   trie.unionField[0]  -> string branch
												// 		//   trie.unionField[1]  -> number branch
												// 		[K in keyof U as K extends `${number}`
												// 			? K
												// 			: never]: ZodResolverTrieResult<
												// 			U[K],
												// 			U[K],
												// 			PathAcc,
												// 			{ isUnionItemDescendant: true }
												// 		>;
												// 	}
												// :
												// ------------------------------------------------
												//  INTERSECTION  (z.intersection(...))
												// ------------------------------------------------
												ZodSchemaToUnwrap extends z.ZodIntersection<
														infer L,
														infer R
													>
												? // Intersection = both sides at the same path; we simply merge the
													// two branch results.  At runtime your resolver already does
													// “right wins” for conflicting keys; the type does the same.
													ZodResolverTrieResult<L, L, PathAcc, Options> &
														ZodResolverTrieResult<R, R, PathAcc, Options>
												: //
													{};
const zodSchemaTest = z
	.object({
		stringField: z
			.string()
			.min(2)
			.max(5)
			.regex(/^[a-z]+$/),
		numberField: z.number().min(1).max(10).int(),
		booleanField: z.boolean().default(true),
		dateField: z.date().min(new Date("2020-01-01")).max(new Date("2030-12-31")),
		nestedObject: z.object({
			nestedString: z.string().optional(),
			nestedNumber: z.number().nullable(),
		}),
		arrayField: z.array(z.string().min(1)).min(1).max(3),
		arrayOfObjects: z.array(
			z.object({
				id: z.uuidv7(),
				value: z.number().positive(),
			}),
		),
		tupleField: z.tuple([
			z.string(),
			z.number().optional(),
			z.boolean().default(false),
		]),
		unionField: z.union([z.string(), z.number(), z.boolean()]),
		unionOfObjects: z.union([
			z.object({ type: z.literal("A"), value: z.string() }),
			z.object({ type: z.literal("B"), value: z.number() }),
			z.object({ type: z.literal("C"), value: z.boolean() }),
		]),
		unionOfArrays: z.union([z.array(z.string()), z.array(z.number())]),
		unionOfTuples: z.union([
			z.tuple([z.string(), z.number()]),
			z.tuple([z.boolean(), z.string()]),
		]),
		unionOfDifferent: z.union([z.string(), z.number()]),
	})
	.optional();
type ZodSchemaTest = typeof zodSchemaTest;
type ZodSchemaTestTrieResult = ZodResolverTrieResult<
	ZodSchemaTest,
	ZodSchemaTest
>;
//^?
const zodSchemaTestTrieResult = {} as ZodSchemaTestTrieResult;
zodSchemaTestTrieResult.stringField[FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.stringField[FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.nestedObject.nestedNumber[FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.arrayField[FIELD_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayField[ARRAY_ITEM_TOKEN][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.arrayField[ARRAY_ITEM_TOKEN][FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.arrayOfObjects[FIELD_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayOfObjects[ARRAY_ITEM_TOKEN][FIELD_CONFIG].level; // "object"
zodSchemaTestTrieResult.arrayOfObjects[ARRAY_ITEM_TOKEN].value[FIELD_CONFIG]
	.level; // "primitive"
zodSchemaTestTrieResult.arrayOfObjects[ARRAY_ITEM_TOKEN].value[FIELD_CONFIG]
	.type; // "number"
zodSchemaTestTrieResult.tupleField[FIELD_CONFIG].level; // "tuple"
zodSchemaTestTrieResult.tupleField[0][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[0][FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.tupleField[1][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[1][FIELD_CONFIG].type; // "number"
zodSchemaTestTrieResult.unionField[FIELD_CONFIG].level; // "union-item"
zodSchemaTestTrieResult.unionOfArrays[0].level;
zodSchemaTestTrieResult.unionOfArrays.options[0][FIELD_CONFIG].level; // "array"
zodSchemaTestTrieResult.unionOfObjects.options;
zodSchemaTestTrieResult.unionOfArrays.options[0][ARRAY_ITEM_TOKEN][FIELD_CONFIG]
	.level; // "primitive"
zodSchemaTestTrieResult.unionOfObjects.type[FIELD_CONFIG].level;
zodSchemaTestTrieResult.unionOfObjects[FIELD_CONFIG].level; // "union-item"
zodSchemaTestTrieResult.unionOfObjects[FIELD_CONFIG].level; // "object"

type T = { a: { b: { c: "d" } } } & { a: { b: { e: "f" } } };
type X = T["a"]["b"]["c"];
type Y = T["a"]["b"]["e"];

async function customValidate<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	T = unknown,
>(
	props: {
		value: any;
		currentParentPathString: string;
		currentParentSegments: PathSegmentItem[];
		schema: ZodAny;
	},
	options: ValidateOptions,
): Promise<ValidateReturnShape<PathAcc, T>> {
	try {
		if (!("~standard" in props.schema)) {
			throw new Error("Provided schema is not a valid Zod schema");
		}

		const result = await props.schema["~standard"].validate(props.value);

		if ("issues" in result && result.issues) {
			return {
				result: {
					issues: result.issues.map((issue) => ({
						message: issue.message,
						pathString: issue.path?.join(".") || props.currentParentPathString,
						pathSegments: (issue.path ||
							props.currentParentSegments) as PathAcc,
					})),
				},
			};
		}

		if ("value" in result) {
			return {
				result: { value: result.value as unknown as T },
				metadata: { validationEvent: options.validationEvent },
			};
		}

		// This case should never happen with proper Zod usage
		return {
			result: {
				issues: [
					{
						message: "Unknown validation error",
						pathString: props.currentParentPathString,
						pathSegments: props.currentParentSegments as PathAcc,
					},
				],
			},
			metadata: { validationEvent: options.validationEvent },
		};
	} catch (error) {
		// Handle sync validation errors
		return {
			result: {
				issues: [
					{
						message:
							error instanceof Error ? error.message : "Validation failed",
						pathString: props.currentParentPathString,
						pathSegments: props.currentParentSegments as PathAcc,
					},
				],
			},
			metadata: { validationEvent: options.validationEvent },
		};
	}
}

interface InheritedMetadata {
	"intersection-item"?: {
		[pathString: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
	};
	"union-item-descendant"?: {
		originDivergencePathToInfo: Record<
			string,
			{
				originDivergencePath: string;
				originDivergencePathSegments: PathSegmentItem[];
				paths: Set<string>;
			}
		>;
	};
	"marked-never"?: boolean;
}

interface ZodResolverAcc {
	pathToNode: Record<string, TrieNode>;
	node: TrieNode;
}

/**
 * Update it on the `pathToResolverConfig` by using the `path`
 * @warning it's not accounting for "union-item" yet or recursive compatible intersections
 */
function resolveIntersectionItemConfig(props: {
	acc: ZodResolverAcc;
	existingNode?: TrieNode;
	newNode: TrieNode;
}): TrieNode {
	const existingNode = props.existingNode;
	if (existingNode) {
		if (
			existingNode[FIELD_CONFIG].level === props.newNode[FIELD_CONFIG].level &&
			(existingNode[FIELD_CONFIG].level !== "primitive" ||
				(existingNode[FIELD_CONFIG].level === "primitive" &&
					existingNode[FIELD_CONFIG].type ===
						(
							props.newNode[FIELD_CONFIG] as FormFieldOptionShape &
								FormFieldOptionPrimitiveLevel
						).type))
		) {
			const newConfig = props.newNode[FIELD_CONFIG];
			const existingConfig = existingNode[FIELD_CONFIG];

			const newMetadata = props.newNode[FIELD_CONFIG].metadata;
			if (newMetadata) {
				existingConfig.metadata = {
					...(existingConfig.metadata || {}),
					...newMetadata,
				};
			}
			for (const ruleKey in newConfig.validation.rules) {
				const element = (newConfig.validation.rules as Record<string, any>)[
					ruleKey
				];
				if (typeof element === "undefined") continue;
				(existingConfig.validation.rules as Record<string, any>)[ruleKey] =
					element;
			}

			return existingNode;
		} else {
			try {
				// We will override the existing config to be of never type
				// Since if we do `"marked-never": true` it won't be logical
				// `"marked-never": true` will be used outside for the descendent if there is though
				// To avoid losing the other paths, metadata, and information
				// biome-ignore lint/suspicious/noTsIgnore: <explanation>
				// @ts-ignore
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				return (props.acc.pathToNode[props.newNode[FIELD_CONFIG].pathString][
					FIELD_CONFIG
				] = {
					level: "never",
					pathString: existingNode[FIELD_CONFIG].pathString,
					pathSegments: existingNode[FIELD_CONFIG].pathSegments,
					userMetadata: {},
					metadata: { ...existingNode.metadata, "marked-never": true },
					validation: {
						rules: {},
						validate: async (value, options) =>
							customValidate(
								{
									value,
									currentParentPathString:
										existingNode[FIELD_CONFIG].pathString,
									currentParentSegments:
										existingNode[FIELD_CONFIG].pathSegments,
									schema: z.never(),
								},
								options,
							),
					},
				} satisfies FormFieldOptionShape);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	props.acc.pathToNode[props.newNode[FIELD_CONFIG].pathString] = props.newNode;
	return props.newNode;
}

/**
 * Attach the child node to the current parent node based on the parent node level
 * It's handled on the `pushToAcc` function
 * @returns the current parent node after attaching the child node, or the child node itself if no parent node is provided
 */
function attachChildToParentNode(props: {
	currentParentNode?: TrieNode;
	childKey?: string | number;
	childNode: TrieNode;
}): TrieNode {
	if (!props.currentParentNode || !props.childKey) {
		return props.childNode;
	}

	const parentConfig = props.currentParentNode[FIELD_CONFIG];
	switch (parentConfig.level) {
		case "object": {
			props.currentParentNode[props.childKey] ??= props.childNode;
			break;
		}
		case "array": {
			if (props.childKey !== ARRAY_ITEM_TOKEN) {
				throw new Error(
					`Array parent can only have "${ARRAY_ITEM_TOKEN}" as child key, got "${props.childKey}"`,
				);
			}
			props.currentParentNode[props.childKey] ??= props.childNode;
			break;
		}
		case "tuple": {
			if (typeof props.childKey !== "number") {
				throw new Error(
					`Tuple parent can only have numeric keys as child key, got "${props.childKey}"`,
				);
			}
			props.currentParentNode[props.childKey] ??= props.childNode;
			break;
		}
		default: {
			throw new Error(
				`Parent node must be of level "object", "array", or "tuple" to attach child nodes, got "${parentConfig.level}"`,
			);
		}
	}
	return props.currentParentNode;
}

function pushToAcc(props: {
	pathString: string;
	acc: ZodResolverAcc;
	node: TrieNode;
	currentAttributes?: CurrentAttributes;
	inheritedMetadata: InheritedMetadata;
	currentParentNode?: TrieNode;
	childKey?: string | number;
}): ZodResolverAcc & { isNew: boolean } {
	let existingNode: TrieNode | undefined =
		props.acc.pathToNode[props.pathString];
	let isNew = true;

	if (existingNode && existingNode[FIELD_CONFIG].level !== "temp-root") {
		isNew = false;

		if (existingNode.metadata?.["intersection-item"]) {
			//
			existingNode = resolveIntersectionItemConfig({
				acc: props.acc,
				existingNode: existingNode,
				newNode: props.node,
			});

			if (existingNode[FIELD_CONFIG].level === "never") {
				// If it was marked as never, we need to update the inheritedMetadata to have marked-never true
				props.inheritedMetadata["marked-never"] = true;
			}
		}

		if (
			existingNode[FIELD_CONFIG].level &&
			existingNode[FIELD_CONFIG].level === "union-item"
		) {
			// TODO: needs to check the `marked-never`
			// Merge union-item options
			const itemsToPush =
				props.node[FIELD_CONFIG].level === "union-item"
					? props.node[FIELD_CONFIG].options
					: [props.node];
			existingNode[FIELD_CONFIG].options.push(...itemsToPush);
		}

		return { node: existingNode, isNew, pathToNode: props.acc.pathToNode };
	}

	let newNode = props.node;
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const metadata = (newNode[FIELD_CONFIG].metadata ??= {});
	if (props.currentAttributes) {
		for (const key in props.currentAttributes) {
			// @ts-expect-error
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			metadata[key] = props.currentAttributes[key];
		}
	}

	if (props.inheritedMetadata) {
		if (props.inheritedMetadata["intersection-item"]) {
			metadata["intersection-item"] =
				props.inheritedMetadata["intersection-item"];
		}

		const unionItemDescendant =
			props.inheritedMetadata["union-item-descendant"];
		if (unionItemDescendant) {
			// // Will this be used?
			// const originPath = unionItemDescendant.originDivergencePathToInfo[props.path]!;
			const oldNode = newNode;
			newNode = {
				[FIELD_CONFIG]: {
					level: "union-item",
					options: [oldNode],
					pathString: oldNode[FIELD_CONFIG].pathString,
					pathSegments: oldNode[FIELD_CONFIG].pathSegments,
					userMetadata: {},
					metadata: {
						"union-item-descendant": unionItemDescendant,
					},
					validation: {
						rules: {},
						async validate(value, options): Promise<ValidateReturnShape> {
							const config = newNode[
								FIELD_CONFIG
							] as FormFieldOptionUnionItemLevel;
							for (let i = 0; i < config.options.length; i++) {
								const opt = config.options[i];
								if (!opt) {
									console.warn(
										`\`${config.pathString}.options[${i}]\` is undefined`,
									);
									continue;
								}
								const { result } = await opt[FIELD_CONFIG].validation.validate(
									value,
									options,
								);
								if (!("issues" in result)) {
									return {
										result,
										metadata: {
											validationEvent: options.validationEvent,
											"union-item": { firstValidOptionIndex: i },
										},
									};
								}
							}
							return {
								result: {
									issues: [
										{
											message: "No union option matched",
											pathString: config.pathString,
											pathSegments: config.pathSegments,
										},
									],
								},
								metadata: { validationEvent: options.validationEvent },
							};
						},
					},
				} satisfies FormFieldOptionUnionItemLevel,
			};
		}

		// Instead of overriding the config level to be of never type
		// we will just mark it as never and handle it in the validation phase
		// to avoid losing the other paths, metadata, and information
		if (props.inheritedMetadata["marked-never"]) {
			metadata["marked-never"] = true;
		}
	}

	props.acc.pathToNode[props.pathString] = newNode;
	attachChildToParentNode({
		currentParentNode: props.currentParentNode,
		childKey: props.childKey,
		childNode: newNode,
	});
	return { node: newNode, isNew, pathToNode: props.acc.pathToNode };
}

interface CurrentAttributes {
	"object-property"?: boolean;
	"array-item"?: boolean;
	"array-token-item"?: boolean;
	"tuple-direct-item"?: boolean;
}

const calcPresence = (props?: {
	optional?: boolean;
	nullable?: boolean;
}): Presence =>
	(props &&
		(props.optional ? "optional" : props.nullable ? "nullable" : undefined)) ||
	"required";

/*
NOTE: `schema._zod.def.*` **is needed** since it interacts will with TS
The following are not enough:
From Zod docs:
	- `schema.describe()` - human label `Returns a new instance that has been registered in z.globalRegistry with the specified description` 
	- `schema.isNullable()`: @deprecated Try safe-parsing null (this is what isNullable does internally)
	- ``schema.isOptional()``: @deprecated Try safe-parsing undefined (this is what isOptional does internally)
`schema.unwrap()` - will work only for for some types so the recursive functionality is needed anyway
`pushToAcc` is needed to easily access the accumulator by path and use it when needed instead of always recursing or looping through the whole thing again and again
`inheritedMetadata` is needed for properly handling and passing `intersection-item` and `union-item` metadata to the needed path because they can be defined at a higher level and need to be passed down to apply them properly

The system looks as it is because I'm trying different ways before changing the data structure to a Trie like one, to support many advanced functionalities and to make propagation cheap, and yes the tokenization will play a huge role on it
*/
function zodResolverImpl(
	schema: ZodAny,
	ctx: {
		//
		currentParentPathString: string;
		currentParentPathSegments: PathSegmentItem[];
		currentParentNode?: TrieNode;
		currentSchema: ZodAny;
		childKey?: string | number;
		//
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		//
		acc: ZodResolverAcc;
		//
		default?: any;
		optional?: boolean;
		nullable?: boolean;
	},
): {
	pathToNode: Record<string, TrieNode>;
	node: TrieNode;
} {
	const currentParentPathString = ctx.currentParentPathString;
	const currentParentPathSegments = ctx.currentParentPathSegments;
	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (schema instanceof z.ZodDefault) {
		const defaultValue = schema.def.defaultValue;
		schema = schema.def.innerType;
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema, {
				...ctx,
				acc: ctx.acc,
				default: defaultValue,
			}).node,
		};
	}
	if (schema instanceof z.ZodOptional) {
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema.unwrap(), {
				...ctx,
				optional: true,
			}).node,
		};
	}
	if (schema instanceof z.ZodNullable) {
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema.unwrap(), {
				...ctx,
				nullable: true,
			}).node,
		};
	}
	/* End unwrap **/

	/** Handle primitives **/
	if (
		schema instanceof z.ZodString ||
		schema instanceof z.ZodLiteral ||
		schema instanceof z.ZodEnum
	) {
		let minLength: number | undefined;
		let maxLength: number | undefined;
		let regex: RegExp | undefined;
		let coerce: boolean | undefined;

		if (schema instanceof z.ZodLiteral) {
			regex = new RegExp(
				`^${schema.def.values
					.map((v) =>
						// Need to escape special regex characters if the literal is a string
						typeof v === "string"
							? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
							: String(v),
					)
					.join("|")}$`,
			);
		} else if (schema instanceof z.ZodEnum) {
			regex = new RegExp(
				`^${Object.values(schema.def.entries)
					.map((v) =>
						// Need to escape special regex characters if the enum value is a string
						typeof v === "string"
							? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
							: String(v),
					)
					.join("|")}$`,
			);
		} else {
			coerce = schema.def.coerce;
			if (schema.def.checks) {
				for (const check of schema.def.checks) {
					if (check instanceof z.core.$ZodCheckMinLength) {
						minLength = check._zod.def.minimum as number;
					} else if (check instanceof z.core.$ZodCheckMaxLength) {
						maxLength = check._zod.def.maximum as number;
					} else if (check instanceof z.core.$ZodCheckRegex) {
						regex = check._zod.def.pattern;
					}
				}
			}
		}

		const config: FormFieldOptionStringPrimitiveLevel = {
			level: "primitive",
			type: "string",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			userMetadata: {},
			validation: {
				rules: {
					default: ctx.default,
					presence: calcPresence(ctx),
					minLength,
					maxLength,
					regex,
					coerce,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
			},
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				pathString: currentParentPathString,
				node: { [FIELD_CONFIG]: config },
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodNumber) {
		let min: number | undefined;
		let max: number | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		let multipleOf: number | undefined;
		// Q: Fo need to account for if `finite` when present? will it be useful?
		const int: boolean = schema.format === "safeint";
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckLessThan) {
					max = check._zod.def.value as number;
					inclusiveMax = check._zod.def.inclusive;
				} else if (check instanceof z.core.$ZodCheckGreaterThan) {
					min = check._zod.def.value as number;
					inclusiveMin = check._zod.def.inclusive;
				} else if (check instanceof z.core.$ZodCheckMultipleOf) {
					multipleOf = check._zod.def.value as number;
				}
			}
		}

		const config: FormFieldOptionNumberPrimitiveLevel = {
			level: "primitive",
			type: "number",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			userMetadata: {},
			validation: {
				rules: {
					default: ctx.default,
					presence: calcPresence(ctx),
					min,
					max,
					inclusiveMin,
					inclusiveMax,
					int,
					multipleOf,
					coerce: schema.def.coerce,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
			},
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodDate) {
		let min: Date | undefined;
		let max: Date | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckLessThan) {
					max = check._zod.def.value as Date;
					inclusiveMax = check._zod.def.inclusive;
				} else if (check instanceof z.core.$ZodCheckGreaterThan) {
					min = check._zod.def.value as Date;
					inclusiveMin = check._zod.def.inclusive;
				}
			}
		}
		const config: FormFieldOptionDatePrimitiveLevel = {
			level: "primitive",
			type: "date",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			userMetadata: {},
			validation: {
				rules: {
					default: ctx.default,
					presence: calcPresence(ctx),
					min,
					max,
					inclusiveMin,
					inclusiveMax,
					coerce: schema.def.coerce,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
			},
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodBoolean) {
		const config: FormFieldOptionBooleanPrimitiveLevel = {
			level: "primitive",
			type: "boolean",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			userMetadata: {},
			validation: {
				rules: {
					default: ctx.default,
					presence: calcPresence(ctx),
					coerce: schema.def.coerce,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
			},
		};
		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	/** End primitives **/

	/** Handle complex types **/
	if (schema instanceof z.ZodArray) {
		let minLength: number | undefined;
		let maxLength: number | undefined;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckMinLength) {
					minLength = check._zod.def.minimum as number;
				} else if (check instanceof z.core.$ZodCheckMaxLength) {
					maxLength = check._zod.def.maximum as number;
				}
			}
		}

		const tokenNextParent = currentParentPathString
			? `${currentParentPathString}.${ARRAY_ITEM_TOKEN}`
			: ARRAY_ITEM_TOKEN;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			ARRAY_ITEM_TOKEN,
		];
		const node: TrieNode = {
			[FIELD_CONFIG]: {
				level: "array",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				userMetadata: {},
				validation: {
					rules: { presence: calcPresence(ctx), minLength, maxLength },
					validate: (value, options) =>
						customValidate(
							{
								value,
								currentParentPathString: currentParentPathString,
								currentParentSegments: currentParentPathSegments,
								schema: ctx.currentSchema,
							},
							options,
						),
				},
			} as FormFieldOptionArrayLevel,
		};
		// // To make sure we also cover the array item token path
		// node.items =
		zodResolverImpl(schema.element, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { "array-token-item": true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: schema.element,
			get currentParentNode() {
				return node;
			},
			childKey: ARRAY_ITEM_TOKEN,
		}).node;

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node,
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodObject) {
		const node = {
			[FIELD_CONFIG]: {
				level: "object",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				userMetadata: {},
				validation: {
					rules: {
						presence: calcPresence(ctx),
					},
					validate: (value, options) =>
						customValidate(
							{
								value,
								currentParentPathString: currentParentPathString,
								currentParentSegments: currentParentPathSegments,
								schema: ctx.currentSchema,
							},
							options,
						),
				},
				shape: {}, // To be filled below
			} as FormFieldOptionObjectLevel,
		};

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParentPathString
				? `${currentParentPathString}.${key}`
				: key;
			const nextParentSegments = [...currentParentPathSegments, key];
			// node[FIELD_CONFIG].shape[key] =
			zodResolverImpl(shape[key], {
				acc: ctx.acc,
				currentParentPathString: nextParent,
				currentParentPathSegments: nextParentSegments,
				currentAttributes: { "object-property": true },
				currentSchema: shape[key],
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: node,
				childKey: key,
			}).node;
		}

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node,
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodTuple) {
		let exactLength: number | undefined;
		let minLength: number | undefined;
		let maxLength: number | undefined;
		if (schema.def.rest) {
			minLength = schema.def.items.length;
		} else {
			exactLength = schema.def.items.length;
			minLength = schema.def.items.length;
			maxLength = schema.def.items.length;
		}
		const node = {
			[FIELD_CONFIG]: {
				level: "tuple",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				validation: {
					rules: {
						presence: calcPresence(ctx),
						exactLength,
						minLength,
						maxLength,
					},
					validate: (value, options) =>
						customValidate(
							{
								value,
								currentParentPathString: currentParentPathString,
								currentParentSegments: currentParentPathSegments,
								schema: ctx.currentSchema,
							},
							options,
						),
				},
				// items: new Array(schema.def.items.length).fill(null),
			} as FormFieldOptionTupleLevel,
		};

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index]!;
			const indexedNextParent = currentParentPathString
				? `${currentParentPathString}.${index}`
				: String(index);
			const indexedNextParentSegments = [...currentParentPathSegments, index];

			// node[FIELD_CONFIG].items[index] =
			zodResolverImpl(item, {
				acc: ctx.acc,
				currentParentPathString: indexedNextParent,
				currentParentPathSegments: indexedNextParentSegments,
				currentAttributes: { "tuple-direct-item": true },
				currentSchema: item,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: node,
				childKey: index,
			}).node;
		}

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node,
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}

	// Q: How should the `currentAttributes` be handled for union-item and intersection-item? and should they be passed down to their children/resulting branches?

	if (
		schema instanceof z.ZodUnion
		// || schema instanceof z.ZodDiscriminatedUnion
	) {
		const originDivergencePathToInfo = {
			...ctx.inheritedMetadata["union-item-descendant"]
				?.originDivergencePathToInfo,
		};
		// collect all branches into one UnionItemLevel
		const config = {
			level: "union-item",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			options: [],
			userMetadata: {},
			metadata: {
				"union-item-descendant": { originDivergencePathToInfo },
				...ctx.currentAttributes,
			} satisfies FormFieldOption<any, any, any, any, any>["metadata"],
			validation: {
				rules: {},
				async validate(value, options): Promise<ValidateReturnShape> {
					return customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					);
				},
			},
		} as FormFieldOptionUnionItemLevel;
		originDivergencePathToInfo[currentParentPathString] = {
			originDivergencePath: currentParentPathString,
			originDivergencePathSegments: currentParentPathSegments,
			paths: new Set([currentParentPathString]),
		};

		const node = pushToAcc({
			acc: ctx.acc,
			node: { [FIELD_CONFIG]: config },
			pathString: currentParentPathString,
			currentAttributes: ctx.currentAttributes,
			inheritedMetadata: ctx.inheritedMetadata,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		}).node;

		for (let index = 0; index < schema.options.length; index++) {
			const opt = schema.options[index];
			if (opt) {
				config.options[index] = zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParentPathString: currentParentPathString,
					currentParentPathSegments: currentParentPathSegments,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						"union-item-descendant": { originDivergencePathToInfo },
					},
					currentAttributes: { ...ctx.currentAttributes },
					currentParentNode: ctx.currentParentNode,
					currentSchema: opt,
					childKey: ctx.childKey,
				}).node;
				// Note: no need to push to options here since it's done in the `pushToAcc` function
				// Since all options are pushed to the same path, they will be merged there on the options array
				// with the correct order as well getting the config reference from the accumulator by path
			}
		}

		return {
			pathToNode: ctx.acc.pathToNode,
			node,
		};
	}

	//NOTE: work on discriminated union is in progress

	if (schema instanceof z.ZodIntersection) {
		// **Left** is processed first so its metadata has lower priority than the right one
		zodResolverImpl(schema.def.left, {
			acc: ctx.acc,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersection-item": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParentPathString]: 0, // TODO: Maybe add a function to generate the power set index if needed in the future
				},
			},
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			// Q: Should we pass the current schema?!!
			currentSchema: schema.def.left,
			childKey: ctx.childKey,
		});

		// **Right** is processed second so its metadata has higher priority than the left one
		const right = zodResolverImpl(schema.def.right, {
			acc: ctx.acc,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersection-item": "right" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParentPathString]: 1,
				},
			},
			currentParentNode: ctx.currentParentNode,
			// Q: Should we pass the current schema?!!
			currentSchema: schema.def.right,
			childKey: ctx.childKey,
		});

		// They will be merged in the `pushToAcc` function when adding to the accumulator by path
		return {
			pathToNode: ctx.acc.pathToNode,
			node: right.node,
		};
	}
	/** End complex types **/

	// TODO: The following will have need to be handled properly in the future
	// - z.ZodTransform
	// - z.ZodLazy
	// - z.ZodCatch
	// - z.ZodPromise
	// - z.ZodRecord
	// - z.ZodMap
	// - z.ZodSet
	// - z.ZodFunction
	// - z.ZodDiscriminatedUnion
	// - z.ZodBigInt
	// - z.ZodNever
	// - z.ZodVoid
	// - z.ZodSymbol

	if (schema instanceof z.ZodPipe) {
		const mainSchema = schema.in;
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(mainSchema, ctx).node,
		};
	}

	// Q: Do we still need to handle ZodTransform?
	// if ( schema instanceof z.ZodTransform) {
	// 	const mainSchema = // ???
	// 	return {
	// 		pathToNode: ctx.acc.pathToNode,
	// 		node: zodResolverImpl(mainSchema, ctx).node,
	// 	};
	// }

	if (schema instanceof z.ZodUnknown || schema instanceof z.ZodAny) {
		const config: FormFieldOptionUnknownLevel = {
			level: "unknown",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			userMetadata: {},
			validation: {
				rules: {
					presence: calcPresence(ctx),
					default: ctx.default,
				},
				validate: async (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: currentParentPathString,
							currentParentSegments: currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
			},
		};
		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}

	console.warn("Unhandled schema type:", schema);
	return {
		pathToNode: ctx.acc.pathToNode,
		node: pushToAcc({
			acc: ctx.acc,
			node: {
				[FIELD_CONFIG]: {
					level: "never",
					pathString: currentParentPathString,
					pathSegments: currentParentPathSegments,
					userMetadata: {},
					validation: {
						rules: { presence: calcPresence(ctx) },
						validate() {
							throw new Error("Not implemented");
						},
					},
				},
			},
			inheritedMetadata: ctx.inheritedMetadata,
			pathString: currentParentPathString,
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		}).node,
	};
}

const schemaPathCache = new WeakMap<
	ZodAny,
	{
		node: Record<string, TrieNode>;
	}
>();
/**
 * This resolver extracts paths and mapped paths to validation configs from a Zod schema.
 * It will
 * - Be used by the form manager to validate fields based on their paths.
 * - Be used to get the field native rules for client-side validation (e.g. min, max, pattern, etc).
 * - Maybe on the future on the `Trie` structure to optimize nested validations, conditions, etc down the path chain.
 * This is why there is a special token for array items: `@@__ARRAY_ITEM__@@`, so we can optimize dependencies and validations for all items in an array.
 */
function zodResolver<ZodSchema extends ZodAny>(
	schema: ZodSchema,
	options: { skipCache?: boolean } = {},
): {
	node: Record<string, TrieNode>;
	// This will be used
	__?: {
		// This will be used for the form fields options
		input: z.input<ZodSchema>;
		// This will be used for the validation final result
		output: z.output<ZodSchema>;
		// Q: But is there a case where we need to infer the _path_ output from a _trie node_?
	};
} {
	// Preserving top-level cache only - no deeper than this to make sure we preserve the correct paths
	if (!options.skipCache && schemaPathCache.has(schema)) {
		return schemaPathCache.get(schema)!;
	}

	const rootNode: TrieNode = {
		[FIELD_CONFIG]: {
			level: "temp-root",
			pathString: "",
			pathSegments: [],
			userMetadata: {},
			validation: {
				rules: { presence: "required" },
				validate() {
					throw new Error("Not implemented");
				},
			},
		},
	};

	const result = zodResolverImpl(schema, {
		acc: {
			pathToNode: {},
			node: rootNode,
		},
		currentParentPathString: "",
		currentParentPathSegments: [],
		inheritedMetadata: {},
		currentSchema: schema,
		currentParentNode: undefined,
		childKey: undefined,
	});
	schemaPathCache.set(schema, result);
	return result;
}

const userSchema = z.object({
	name: z.string().min(1),
	age: z.number().min(0),
	addresses: z.array(
		z.object({
			street: z.string(),
			city: z.string(),
		}),
	),
});

const paths = zodResolver(userSchema);
console.log(paths);

const test = z.object({
	name: z.string().min(0).max(10),
	userName: z.coerce.string().min(0).max(10),
	age: z.number().min(0).max(10),
	age2: z.number().lt(5).gt(1),
	age3: z.number().lte(5).gte(1),
	birthDate: z.date().min(0).max(10),
	birthDate2: z.coerce.date().min(0).max(10),
	test1: z
		.string()
		.transform((val) => val.length)
		.pipe(z.number()),
	test2: z
		.object({ a: z.string() })
		.transform((val) => ({ b: val.a.length }))
		.pipe(z.object({ b: z.number() })),
});

console.log(test);

type TestInput = z.input<typeof test>;
type TestOutput = z.input<typeof test>;

// TODO: Complex nested conditionals: The primitive type handling is repetitive
// TODO: regex for lightweight pattern usage.
// TODO: enum/literal arrays for UI-friendly strict matching.

/*
| Missing piece                      | Impact                             | Minimal patch                                          |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **Discriminated-union resolution** | runtime still tries *all* branches | add `if (ZodDiscriminatedUnion)` branch                |
| **Effects / Refine / Transform**   | rules are lost                     | wrap schema in `zodResolverImpl(schema._def.inner, …)` |
| **HTML helper**                    | consumer must build attrs manually | export `getNativeAttrs(config)`                        |
| **Bundle split**                   | one big file                       | ship `@form-manager/zod` entry                         |
*/

/*
On-demand walking: no upfront memory, but repeated traversals.
Cached schema at leaf: faster single lookups, but you store potentially thousands of redundant schema instances if your form is large.
✅ Rule of thumb: cache only if (1) you expect lots of hot field-level validations, and (2) schemas are lightweight to clone/compile. Otherwise, just walk.
*/

/*

---

### ✅ Strengths

* **Trie + symbol key design**: Smart choice. Keeps storage lightweight and flexible while still supporting structured paths and metadata.
* **Unwrapping strategy** (`ZodOptional`, `ZodNullable`, `ZodDefault`): This is exactly how you want to normalize schemas before deeper recursion.
* **Push-to-accumulator abstraction**: Good separation of concerns between collecting nodes and handling merging. You've already anticipated intersections, unions, metadata inheritance.
* **Custom validate**: Nice wrapper around Zod's internal validation. You're controlling error shaping consistently (`path`, `message`), which will make your form lib predictable.
* **PathSegments array**: You're storing both segments and the joined string—this is the right move for cheap traversal plus easy display/debug.
* **Future-facing metadata**: You've left room for `"intersection-item"`, `"union-item-descendant"`, `"marked-never"`, etc. This gives you hooks for optimizations without changing core types later.

---

### 🚀 Big Picture

What you've got already puts you ahead of most form libs:

* **Structured trie of resolver configs** (most libs stop at flat rules).
* **Intersection + union merging with metadata inheritance** (rarely supported properly).
* **Path-segmented metadata** for precise control (super powerful for form UIs).

If you add:

1. Proper **deep merging for intersections**.
2. **Branch tagging for union options**.
3. Optional **lazy union resolution**.

👉 You'll have one of the most **precise and scalable schema-to-form resolution engines** out there.

---

*/
/*
---

## 🔑 How your implementation benefits form state logic

1. **Validator-agnostic abstraction**

   * By dissolving Zod into a `ResolverConfigShape` + trie, your form manager isn't married to Zod's AST.
   * This opens the door to plugging in Yup, Valibot, JSON Schema, etc. with the same state logic. Other libraries (React Hook Form, Formik) are tied to specific mental models and have to bolt on adapters — you've designed it from the ground up.

2. **Trie-based path lookup**

   * You can do **O(depth)** lookups for any field.
   * This means efficient per-field validation, metadata retrieval, default injection, etc. without scanning the whole schema.
   * RHF and Vest rely heavily on string maps (`{ "user.address.street": ... }`). Your approach adds structure and makes path propagation (e.g., `intersection`, `union`) tractable.

3. **Rich metadata inheritance**

   * The `inheritedMetadata` propagation (intersection flags, union origins, marked-never) gives you fine-grained control over how schema semantics bubble down.
   * That's a level of fidelity missing in most form libs. They flatten things and lose these distinctions, forcing devs to patch around edge cases.

4. **Presence + coercion + defaults tracking**

   * You're not just validating; you're extracting **constraints + ergonomics** (optional/nullable/nullish, coercion flags, default values).
   * This enables better UI affordances (autofilling defaults, optional indicators, disabling fields when `never`, etc.).

---

## 📊 What you already share with other good form libs

* **Field-level validation** (`customValidate` → `safeParse`) similar to RHF's resolver API.
* **Unified error shape** (`FormManagerError`) much like Yup → RHF → `FieldError`.
* **Event-driven validation pipeline** (`input`, `blur`, `submit`) like Final Form and Vest.
* **Cached path mapping** (`pathToNode`) for fast lookups, same spirit as RHF's `fieldsRef`.

---

## 🚀 What stands out vs other libs

1. **Intersection + union fidelity**

   * Most form libs punt on these cases ("we don't support unions, please normalize your schema").
   * You're designing *actual structural handling* (union-item descendants, intersection propagation). This is rare.

2. **Never-level marking**

   * Instead of throwing or losing context, you keep nodes alive but annotated as `never`.
   * That's clever: it preserves schema shape and metadata while still signaling runtime impossibility.

3. **Path segments + symbolic tokens** (`@@__ARRAY_ITEM__@@`)

   * Allows proper differentiation of `"user.0"` vs `"user[@@ARRAY_ITEM@@]"`.
   * Makes recursive traversal deterministic.
   * Other libs mostly treat everything as flattened strings, which breaks down for tuples, arrays, and advanced composites.

---

## ⚠️ What it still lacks (core-side)

1. **Union discrimination strategy**

   * Right now, you're accumulating union options. But devs will need clear ergonomics: *when do I know which branch to take?*
   * RHF avoids this problem by forcing "single branch validation." You're closer to supporting *real discriminated unions*, but you'll need a caching or path-aware discriminator mechanism.

2. **Normalization of issues**

   * You're returning Zod's messages mostly raw. If this is meant to be validator-agnostic, you'll want a **common error language** (codes, reasons, severity levels) instead of just `message: string`.

3. **Performance strategies**

   * Your design is extensible, but union/intersection traversal can blow up in large schemas.
   * You'll want *lazy evaluation* (don't expand a union's branches until necessary) and *memoization* (cache merged intersection configs by path).
   * Right now everything is eagerly constructed.

4. **Form-state diffs**

   * You're building the resolver layer. But you'll also need to consider how it integrates with actual state updates:

     * Detect touched/dirty/changed paths
     * Map validation events back into form state
   * That glue is what makes Final Form or RHF "feel fast."

---

✅ **Summary**:
Your file is already doing more than most adapters in existing libs: instead of flattening validators into "field → resolver," you're building a structural representation (`TrieNode`) that preserves semantics (intersection, union, presence). That's a competitive differentiator.

What's missing is mostly polish for ergonomics (issue normalization, union discrimination strategy) and performance safeguards (lazy resolution + caching).

---

Would you like me to give you a **side-by-side table** comparing your current design to React Hook Form, Formik, and Final Form, so you can see exactly where you're ahead and where you're behind?
*/

//
// Notes
// Union & Intersection merging
// Right now, you have TODOs around merging union-item and intersection-item metadata/config. This is a big one:
// Union: each path should map to multiple possible schemas. You'll need either an options: ResolverConfigShape[] array or a tagged type.
// Intersection: each path should merge all constraints. But min/max collisions or type incompatibilities can't always be resolved statically. You may need a dual left/right config like you started.
// If you skip this, you'll get misleading metadata (union-item path may appear stricter/looser than reality).
// Effects / Transformations / Refinements
// You have TODOs for ZodEffects, ZodPipe, ZodBranded, etc. Right now these would get lost → but they often contain the most important runtime logic.
// E.g. z.string().refine(isEmail) → your minLength/maxLength extraction looks fine, but the real validation logic lives in .refine. If you drop it, you'll end up with false positives in your form.
// Over-aggressive Regex for Enum/Literal
// You're converting literals/enums into regex patterns:
// regex = new RegExp(`^${schema._zod.def.values.join("|")}$`)
// That works but:
// ZodEnum is already enumerable — you can just set metadata.enum = [...].
// Regex for complex literals (esp. string with special chars) could break. Better to keep both: enum: [...] and maybe regex if you want a fast HTML-native pattern.

// 🕳️ The Ugly (Hidden Traps)
//
// Zod private internals (schema._zod.def, check._zod)
// You're digging into Zod's private defs. That's not stable across versions (v4 → v5 will probably break).
// 👉 Safer: use Zod's .describe(), .isOptional(), .isNullable(), or PR a feature upstream to expose richer metadata. Otherwise, you'll constantly be chasing internal refactors.
//
// Validation result path mismatch
// You're mapping issue.path.join(".") to currentParent, but Zod sometimes returns array indices (e.g. ["addresses", 0, "street"]). Joining with "." is fine, but doesn't align with your @@__ARRAY_ITEM__@@ abstraction.
// 👉 You'll need a mapping layer: ["addresses", number, "street"] → addresses.${ARRAY_ITEM_TOKEN}.street.
//
// Schema identity cache
// Using WeakMap<ZodType, ResolverResult> means two semantically identical schemas created separately will produce two different caches. That's fine for perf but makes caching less predictable if users build schemas dynamically each render. You might need hash-based memoization for serious perf scenarios.
//
//
// 🚀 Suggestions for Next Steps
//
// Formalize UnionLevel & IntersectionLevel
// Add fields like:
//
// interface UnionLevel extends Level<"union"> {
//   options: ResolverConfigShape[];
// }
// interface IntersectionLevel extends Level<"intersection"> {
//   parts: ResolverConfigShape[];
// }
//
//
// That way you don't just flatten into metadata — you preserve the recursive structure.
//
// Preserve Coercion
// Add coerce: true to primitive configs. For .date(), maybe capture coercion type (string → Date).
//
// Expose native HTML rules cleanly
// Write a small helper extractNativeConstraints(config: ResolverConfigShape) that maps:
//
// minLength, maxLength → input.minLength / input.maxLength
//
// regex → pattern
//
// required → required attribute
//
// min, max on numbers/dates → same
// That'll let you plug into <input> without writing custom logic later.
//
// Handle Effects & Refinements
// At minimum: keep them in metadata.refinements: Array<(val) => boolean> or wrap them in the validate() function instead of discarding.
//
// Unify path tokens
// Consider always normalizing paths to:
//
// arrays of keys (like Zod does: ["addresses", 0, "street"])
//
// or dot notation + tokens (addresses.${ARRAY_ITEM_TOKEN}.street)
// But don't mix them. It'll simplify downstream consumers.

/*
- Do we really need to merge and create new objects?
- Can't we relay on if we encountered the same _path_, then check if it's an interaction item and _just mutate_!!!
- I don't need to actually hold the intersection level, but the result of it!!!
*/

/*
OK, for now, without mainly writing the code, I'm thinking of rules for the `unions`
## Idea 1:
- There won't be `UnionLevel`
```
interface UnionLevel extends Level<"union"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	options: ResolverConfigShape[];
	discriminator?: string;
}
```
But `UnionItemLevel`
```
interface UnionItemLevel extends Level<"union-item"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	options: ResolverConfigShape[];
	divergentPathsOrigins?: string[]; // The paths that have different values for different options
	divergentPathOriginToOptions?: {
		[path: string]: {
			discriminator?: string;
			discriminatorValue?: string | number | boolean | null;
			optionsIndex?: number;
		}[];
	};
}
```
- If there happen to be no `discriminator`, the extracted rules will be invalid to be used _(for a native form validation as an example)_, and will depend on the runtime validation to determine which option is valid.
- If there is a `discriminator`, it will be used to determine which option is valid based on the value of the `discriminator` field and the option rules will be valid to be used _(for a native form validation as an example)_.
- If it happen that this level is an `intersection-item` process is happening to it too, it will process the intersection with the options of the union.
- `UnionItemLevel` will be inherited down to the paths of the options and all the configs from this endpoint will be a `UnionItemLevel`, so we can know which option it belongs to and what are the divergent paths points.
- I think the design of the schema should be the responsibility of the user/dev, and I have to just do some fallback and special handling for edge cases for a better DX, while maybe `warn` the user/dev in dev mode
So it will be his responsibility to decide where to use unions vs discriminated union, what keys and where they're placed, etc.
- `clientSafe` will be true if there in case of a union, there is a `discriminator` defined, otherwise it will be false.

## Idea 2 _(incomplete needs revision and improvement)_
- There won't be `UnionLevel`
```
interface UnionLevel extends Level<"union"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	options: ResolverConfigShape[];
	discriminator?: string;
}
```
But once hitting a **discriminated union**, it will be lazy and won't process the options until it's needed
- And will hold the options as is, and will process them when needed., and there will be a tagged union meta registry used internally to hold the union options and their divergent paths origins and their mapping to the options. which will be chached and reused if the same union is encountered again.

```ts
interface TaggedUnionMetaRegistry {
	[unionPath: string]: {
		recomputeCb: () => void; // To recompute the union options and their divergent paths origins and their mapping to the options
		tagKeys: (string | number | boolean)[];
		cachecdDivergentPathsOrigins: Map<
			string, // This will be the value of the `tagKeys` in order joined by `|`
			{
				pathToResolverConfig: Record<string, ResolverConfigShape>;
				paths: string[];
				finalResolverConfig: ResolverConfigShape;
			}
		>; // The cached divergent paths origins and their mapping to the options
	}
```
- The tag keys will be watched for changes, and once they change, the recomputeCb will be called to recompute the union options and their divergent paths origins and their mapping to the options.
- The recomputeCb will be called
	- On the first time the discriminated union is encountered, using the initial values of the form _(will be passed by the user/dev)_, if not passed, it will use the default values of the schema if any, otherwise it will use the first option of the union.
	- Once the discriminated union keys are changed and needs to compute or get from the cache.
- The recomputeCb will recompute the union options and their divergent paths origins and their mapping to the options, and will update the cachecdDivergentPathsOrigins with the new values.

- If it happen that it's not a discriminated union, it will process it as a normal union and will have:
```
interface UnionItemLevel extends Level<"union-item"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	options: ResolverConfigShape[];
}
```
- If there happen to be no `tag`, the extracted rules will be invalid to be used _(for a native form validation as an example)_, and will depend on the runtime validation to determine which option is valid.
- If there is a `tag`, it will be used to determine which option is valid based on the value of the `discriminator` field and the option rules will be valid to be used _(for a native form validation as an example)_.
- If it happen that this level is an `intersection-item` process is happening to it too, it will process the intersection with the options of the union.
- `UnionItemLevel` will be inherited down to the paths of the options and all the configs from this endpoint will be a `UnionItemLevel`, so we can know which option it belongs to and what are the divergent paths points.

NOTE: I think the design of the schema should be the responsibility of the user/dev, and I have to just do some fallback and special handling for edge cases for a better DX, while maybe `warn` the user/dev in dev mode
So it will be his responsibility to decide where to use unions vs discriminated union, what keys and where they're placed, etc.

*/

/*
type TagValue = string | number | boolean | null;
type TagKey = string; // stable encoded vector key // encoded as `${tag}:${value}` joined by `|`

interface ResolvedOptionSnapshot {
	// lazily-built, heavy object representing the option
	pathToResolverConfig: Record<string, ResolverConfigShape>; // full map for this option
	paths: string[]; // list of paths extracted (maybe shallow)
	finalResolverConfig: ResolverConfigShape; // root resolver config for the option
	createdAt: number; // for debugging / TTL
}

interface TaggedUnionMetaRegistry {
	paths: {
		[unionPath: string]: {
			// map of encoded key -> ResolvedOptionSnapshot
			cachedDivergentPathsOrigins: Map<TagKey, ResolvedOptionSnapshot>;
			// optional: fallback option if router misses (index or null)
			fallbackOptionIndex?: number | null;
			// recompute function to build the snapshot for a tagKey or to rebuild router
			recomputeCb: (
				tagValues: TagValue[] | undefined, // undefined for router rebuild
				ctx: { getFormValue: (path: string) => any },
			) => Promise<{  snapshot?: ResolvedOptionSnapshot }>;
			lastComputedAt?: number;
		};
	};
	isComputing: boolean;
	lastComputedAt?: number;
	computingPaths: Set<string>;
	totalComputations: number;
}

interface InternalCtx {
	formId: string;
	initialValues?: Record<string, any>; // for first-time compute
	getCurrentFormValues?: () => Record<string, any>; // for recompute on change
	taggedUnionMetaRegistry: TaggedUnionMetaRegistry;
}
*/
