// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import z, { literal, record } from "zod/v4";

export const name = "form-manager-resolver-zod";

interface PathSegment {
	/** The key representing a path segment. */
	readonly key: PropertyKey;
}
type PathSegmentItem = PropertyKey; //| PathSegment;

const FieldTokenMap = {
	/**
	 * This is used to represent the array item in the path.
	 *
	 * For example:
	 *
	 * ```ts
	 * z.array(z.string())
	 * ```
	 *
	 * Will have the following paths:
	 * - `"@@__FIELD_TOKEN_ARRAY_ITEM__@@"` (root) -> level: "primitive" -> type: "string"
	 */
	arrayItem: "@@__FIELD_TOKEN_ARRAY_ITEM__@@",
	/**
	 * This is used to represent the direct property of an object in the path.
	 * For example:
	 * ```ts
	 * z.record(z.string(), z.number())
	 * ```
	 * Will have the following
	 * paths:
	 * - `""` (root) -> level: "record" -> type: "Record<string, number>"
	 * - `"@@__FIELD_TOKEN_RECORD_PROPERTY__@@` -> level: "primitive" -> type: "number"
	 * The root path represents the record itself, while the token path represents any property in the record.
	 * The actual property key will be dynamic and can be q valid property key _(e.g._ string, number or symbol).
	 * The token is used to indicate that it's a direct property of the record.
	 * This is useful for scenarios where you want to apply specific rules or validations to the properties of the record.
	 * For example, you might want to enforce that all properties of the record are numbers greater than zero.
	 * In such cases, you can use this token to identify and apply the necessary validations or rules.
	 * Note that this token is not used for nested objects within the record. For nested objects, the actual property keys will be used in the path to accurately represent the structure of the data.
	 * For example, if you have a record of objects like `z.record(z.string(), z.object({ age: z.number() }))`, the path for the `age` property would be something like `"someKey.age"`, where `someKey` is a dynamic key in the record.
	 * This distinction helps in accurately representing the structure of the data and applying the appropriate validations or rules at different levels of the hierarchy.
	 * This token is primarily for direct properties of the record itself.
	 * It helps in scenarios where you want to apply rules or validations to the properties of the record as a whole, rather than to nested objects within the record.
	 */
	recordProperty: "@@__FIELD_TOKEN_RECORD_PROPERTY__@@",
	/**
	 * This is used to represent the index of the union option that was valid during validation.
	 *
	 * For example:
	 *
	 * ```ts
	 * z.union([
	 *  z.object({ type: z.literal("A"), value: z.string() }),
	 * 	z.object({ type: z.literal("B"), value: z.number() }),
	 * 	z.object({ type: z.literal("C"), value: z.boolean() }),
	 * 	z.string(),
	 * ])
	 * ```
	 *
	 * Will have the following paths:
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@"`  (root) -> level: "union-root" -> type: "{ type: "A", value: string }" | "{ type: "B", value: number }" | "{ type: "C", value: boolean }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0"` -> level: "object" -> type: "{ type: "A", value: string }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0.type"` -> level: "primitive" -> type: "string" (literal "A")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0.value"` -> level: "primitive" -> type: "string"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1"` -> level: "object" -> type: "{ type: "B", value: number }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1.type"` -> level: "primitive" -> type: "string" (literal "B")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1.value"` -> level: "primitive" -> type: "number"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2"` -> level: "object" -> type: "{ type: "C", value: boolean }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2.type"` -> level: "primitive" -> type: "string" (literal "C")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2.value"` -> level: "primitive" -> type: "boolean"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.3"` -> level: "primitive" -> type: "string"
	 *
	 * The root path represents the union item itself, while the numeric paths represent each option in the union.
	 * The index of the valid option during validation can be stored in the metadata for reference.
	 */
	unionOptionOn: "@@__FIELD_TOKEN_UNION_OPTION_ON__@@",
} as const;

// const ARRAY_ITEM_TOKEN = "@@__FIELD_TOKEN_ARRAY_ITEM__@@";
// const UNION_OPTION_ON_TOKEN = "@@__FIELD_TOKEN_UNION_OPTION_ON__@@";
type FormValidationEvent = "change" | "blur" | "touch" | "submit";
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
	issues: undefined;
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
type Literal = string | number | bigint | boolean | null | undefined;

interface FormFieldOption<
	LevelName extends string,
	InputValue,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = [],
	Rules extends AnyRecord = AnyRecord,
> {
	//
	level: LevelName;
	pathString: string;
	pathSegments: PathSegmentItem[];

	// default value if applicable
	default?: InputValue;
	// The field constraints/rules derived from the schema
	constraints: Rules;
	// The main validation function for the field
	validation: {
		allowedOn?: {
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

	// State flags - these can be managed internally by the form manager or externally by the user/dev
	// Is dirty means the value has been changed from its initial value
	// Q: Should it be called `hasChanged`, `isModified`, or something else?
	isDirty?: boolean;
	// Is touched means the field has been focused and then blurred
	isTouched?: boolean;
	// Is valid means the field has been validated and is valid
	isValid?: boolean;

	// The metadata can be used to store additional information about the field that might be useful for rendering or other purposes
	metadata?: {
		[key in
			| "object-property"
			| "tuple-direct-item"
			| "record-direct-property"
			| "array-token-item"
			| "marked-never"]?: boolean;
	} & {
		"intersection-item"?: {
			[pathString: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
		};
		"union-root-descendant"?: {
			rootPathToInfo: Record<
				string,
				{
					rootPath: string;
					rootPathSegments: PathSegmentItem[];
					paths: Set<string>;
				}[]
			>;
		};
	};
	// User-defined metadata for further extension and functionalities
	// For example, you can store UI-related metadata here like label, placeholder, description, etc.
	userMetadata: FormFieldOptionUserMetadata;

	// Q: Any of the following needed? Or can they be either derived from somewhere else or managed externally by the user/dev?
	// tabIndex?: number;
	// isFocused?: boolean;
	// isDisabled?: boolean;
	// isValidating?: boolean;
	// displayName?: string;
	// description?: string;
	// placeholder?: string;
	// isDynamic: boolean; // For array items, record properties
	// isConditional: boolean;
	// shouldDebounce: boolean;
	// debounceMs?: number;
}
interface FormFieldOptionTempRootLevel
	extends FormFieldOption<"temp-root", string[], never, never, AnyRecord> {}
interface FormFieldOptionNeverLevel<
	InputValue = never,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = AnyRecord,
> extends FormFieldOption<"never", InputValue, OutputValue, PathAcc, Rules> {}
interface FormFieldOptionUnknownLevel<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	InputValue = unknown,
	OutputValue = InputValue,
	Rules extends Record<string, any> = {
		presence: Presence;
		readonly: boolean | undefined;
	},
> extends FormFieldOption<"unknown", InputValue, OutputValue, PathAcc, Rules> {}
interface FormFieldOptionPrimitiveLevelBase<
	InputValue = any,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = AnyRecord,
> extends FormFieldOption<
		"primitive",
		InputValue,
		OutputValue,
		PathAcc,
		Rules & {
			coerce: boolean | undefined;
			presence: Presence;
			readonly: boolean | undefined;
		}
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
			minLength: number | undefined;
			maxLength: number | undefined;
			regex: RegExp | undefined;
		}
	> {
	type: "string";
	metadata:
		| (FormFieldOptionPrimitiveLevelBase<any>["metadata"] & {
				enum?: string[];
				"native-enum"?: Record<string, string | number>;
				literal?: string | number | boolean | null;
		  })
		| undefined;
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
			min: number | undefined;
			inclusiveMin: boolean | undefined;
			max: number | undefined;
			inclusiveMax: boolean | undefined;
			int: boolean | undefined;
			multipleOf: number | bigint | undefined;
		}
	> {
	type: "number";
	metadata:
		| (FormFieldOptionPrimitiveLevelBase<any>["metadata"] & {
				enum?: number[];
				"native-enum"?: Record<string, string | number>;
				literal?: string | number | boolean | null;
		  })
		| undefined;
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
			min: Date | undefined;
			inclusiveMin: boolean | undefined;
			max: Date | undefined;
			inclusiveMax: boolean | undefined;
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
		AnyRecord
	> {
	type: "boolean";
}
interface FormFieldOptionFilePrimitiveLevel<
	InputValue = File,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOptionPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			min: number | undefined;
			max: number | undefined;
			mimeTypes: string[] | undefined;
			// extensions: string[] | undefined;
			// accept: string | undefined;
			// multiple: boolean | undefined;
			// directory: boolean | undefined;
			// maxTotalFileSize: number | undefined;
			// minTotalFileSize: number | undefined;
			// application: boolean | undefined;
		}
	> {
	type: "file";
	// metadata:
	// 	| (FormFieldOptionPrimitiveLevelBase<any>["metadata"] & {
	// 			multiple?: boolean;
	// 			directory?: boolean;
	// 			literal?: string | number | boolean | null;
	// 		// multiple: boolean | undefined;
	// 		// directory: boolean | undefined;
	// 		// maxTotalFileSize: number | undefined;
	// 		// minTotalFileSize: number | undefined;
	// 		// application: boolean | undefined;
	// 						  })
	// 	| undefined;
}

type FormFieldOptionPrimitiveLevel =
	| FormFieldOptionStringPrimitiveLevel
	| FormFieldOptionNumberPrimitiveLevel
	| FormFieldOptionDatePrimitiveLevel
	| FormFieldOptionBooleanPrimitiveLevel
	| FormFieldOptionFilePrimitiveLevel;

interface FormFieldOptionObjectLevel<
	InputValue = AnyRecord,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"object",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: Presence; readonly: boolean | undefined }
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
			presence: Presence;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
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
			presence: Presence;
			exactLength: number | undefined;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode[];
}

interface FormFieldOptionRecordLevel<
	InputValue = Record<PropertyKey, any>,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"record",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: Presence; readonly: boolean | undefined }
	> {}
// z.record(z.string(), z.number()).def.keyType;
// z.record(z.string(), z.number()).def.valueType;
interface FormFieldOptionUnionRootLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends
		| {
				tag: {
					key: string;
					values: Set<Literal>;
					/** @description This map is used to quickly find the index of the option based on the tag value */
					valueToOptionIndex: Map<Literal, number>;
				};
		  }
		| AnyRecord = AnyRecord,
> extends FormFieldOption<
		"union-root",
		InputValue,
		OutputValue,
		PathAcc,
		Rules & { presence: Presence; readonly: boolean | undefined }
	> {
	options: TrieNode[];
	// tag: {
	// 	key: string;
	// 	valueToOptionIndex: Map<Literal, number>;
	// };
}
interface FormFieldOptionUnionDescendantLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldOption<
		"union-descendant",
		InputValue,
		OutputValue,
		PathAcc,
		NeverRecord
	> {
	options: TrieNode[];
}

interface ValidateReturnShape<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> {
	result: ValidationResult<PathAcc, ValidValue>;
	metadata:
		| {
				// /** The validation event that triggered the validation, if any. */
				validationEvent: FormValidationEvent;
				"union-descendant"?: { firstValidOptionIndex: number };
		  }
		| undefined;
}

type FormFieldOptionShape =
	| FormFieldOptionTempRootLevel
	| FormFieldOptionUnknownLevel
	| FormFieldOptionNeverLevel
	| FormFieldOptionPrimitiveLevel
	| FormFieldOptionRecordLevel
	| FormFieldOptionObjectLevel
	| FormFieldOptionArrayLevel
	| FormFieldOptionTupleLevel
	| FormFieldOptionUnionRootLevel
	| FormFieldOptionUnionDescendantLevel;

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
type ZodTupleItemResolverMap<
	T extends readonly ZodAny[],
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = {
	[K in keyof T as K extends `${number}` ? K : never]: ZodResolverTrieResult<
		T[K] extends ZodAny ? T[K] : never,
		T[K] extends ZodAny ? T[K] : never,
		[...PathAcc, K extends `${infer TNum extends number}` ? TNum : never],
		Options
	>;
};

type FormFieldOptionGenericParams<TFormFieldOption> =
	TFormFieldOption extends FormFieldOption<
		infer LevelName,
		infer InputValue,
		infer OutputValue,
		infer PathAcc,
		infer Rules
	>
		? {
				level: LevelName;
				input: InputValue;
				output: OutputValue;
				pathAcc: PathAcc;
				nativeRules: Rules;
			}
		: never;

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type AttachCollectableTypeTrieNodesToUnionRootResolverMap<
	Options extends readonly any[],
	PathAcc extends PathSegmentItem[] = [],
> = (Options extends readonly (infer UnionItem)[]
	? UnionItem extends z.ZodRecord
		? {
				[FieldTokenMap.recordProperty]: ZodResolverTrieResult<
					UnionItem["valueType"],
					UnionItem["valueType"],
					[...PathAcc, typeof FieldTokenMap.recordProperty],
					{ isUnionRootDescendant: true }
				>;
			}
		: UnionItem extends z.ZodObject
			? {
					[key in keyof UnionItem["shape"]]: ZodResolverTrieResult<
						UnionItem["shape"][key],
						UnionItem["shape"][key],
						[...PathAcc, Extract<key, string>],
						{ isUnionRootDescendant: true }
					>;
				}
			: UnionItem extends z.ZodArray
				? {
						[FieldTokenMap.arrayItem]: ZodResolverTrieResult<
							UnionItem["element"],
							UnionItem["element"],
							[...PathAcc, typeof FieldTokenMap.arrayItem],
							{ isUnionRootDescendant: true }
						>;
					}
				: UnionItem extends z.ZodTuple
					? ZodTupleItemResolverMap<
							UnionItem["def"]["items"],
							PathAcc,
							{ isUnionRootDescendant: true }
						>
					: AnyRecord
	: AnyRecord) & {
	[FieldTokenMap.unionOptionOn]: {
		[K in keyof Options as K extends `${number}`
			? K
			: never]: ZodResolverTrieResult<
			Options[K] extends z.ZodTypeAny | z.core.$ZodType<any, any, any>
				? Options[K]
				: never,
			Options[K] extends z.ZodTypeAny | z.core.$ZodType<any, any, any>
				? Options[K]
				: never,
			[...PathAcc, K extends `${infer TNum extends number}` ? TNum : never]
		>;
	};
};

type FindIndexOfZodType<
	T extends readonly any[],
	TU,
	SizeAcc extends any[] = [],
> = T extends [infer Head, ...infer Tail]
	? z.infer<Head> extends TU
		? SizeAcc["length"]
		: FindIndexOfZodType<Tail, TU, [...SizeAcc, any]>
	: never;

type ZodTagValueMap<
	Options extends readonly AnyRecord[],
	TagKey extends string,
> = Omit<Map<z.infer<Options[number]>[TagKey], number>, "get"> & {
	get<TagValue extends z.infer<Options[number]>[TagKey]>(
		key: TagValue,
	): FindIndexOfZodType<Options, { [P in TagKey]: TagValue }>;
	get(key: unknown): never;
};

type ZodResolverTrieResult<
	ZodSchemaToUnwrap extends ZodAny,
	ZodSchemaToInfer extends ZodAny = ZodSchemaToUnwrap,
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = ZodSchemaToUnwrap extends
	| z.ZodPrefault
	| z.ZodDefault
	| z.ZodNonOptional
	| z.ZodReadonly
	| z.ZodOptional
	| z.ZodNullable
	? ZodResolverTrieResult<
			ZodSchemaToUnwrap["def"]["innerType"],
			ZodSchemaToInfer,
			PathAcc
		>
	: ZodSchemaToUnwrap extends
				| z.ZodString
				| z.ZodLiteral
				| z.ZodEnum
				| z.ZodStringFormat
		? TrieNode<
				Options extends { isUnionRootDescendant: true }
					? FormFieldOptionUnionDescendantLevel<
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
		: ZodSchemaToUnwrap extends z.ZodNumber | z.ZodNumberFormat
			? TrieNode<
					Options extends { isUnionRootDescendant: true }
						? FormFieldOptionUnionDescendantLevel<
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
						Options extends { isUnionRootDescendant: true }
							? FormFieldOptionUnionDescendantLevel<
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
				: ZodSchemaToUnwrap extends z.ZodFile
					? TrieNode<
							Options extends { isUnionRootDescendant: true }
								? FormFieldOptionUnionDescendantLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
								: FormFieldOptionFilePrimitiveLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
						>
					: ZodSchemaToUnwrap extends z.ZodDate
						? TrieNode<
								Options extends { isUnionRootDescendant: true }
									? FormFieldOptionUnionDescendantLevel<
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
						: // ------------------------------------------------
							//  RECORD  (z.record(...))
							// ------------------------------------------------
							ZodSchemaToUnwrap extends z.ZodRecord
							? TrieNode<
									Options extends { isUnionRootDescendant: true }
										? FormFieldOptionUnionDescendantLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
										: FormFieldOptionRecordLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
								> & {
									[FieldTokenMap.recordProperty]: ZodResolverTrieResult<
										ZodSchemaToUnwrap["valueType"],
										ZodSchemaToUnwrap["valueType"],
										[...PathAcc, typeof FieldTokenMap.recordProperty],
										Options extends { isUnionRootDescendant: true }
											? { isUnionRootDescendant: true }
											: AnyRecord
									>;
								}
							: // ------------------------------------------------
								//  OBJECT  (z.object({...}))
								// ------------------------------------------------
								ZodSchemaToUnwrap extends z.ZodObject
								? TrieNode<
										Options extends { isUnionRootDescendant: true }
											? FormFieldOptionUnionDescendantLevel<
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
								: // ------------------------------------------------
									//  ARRAY  (z.array(...))
									// ------------------------------------------------
									ZodSchemaToUnwrap extends z.ZodArray
									? TrieNode<
											Options extends { isUnionRootDescendant: true }
												? FormFieldOptionUnionDescendantLevel<
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
											[FieldTokenMap.arrayItem]: ZodResolverTrieResult<
												ZodSchemaToUnwrap["element"],
												ZodSchemaToUnwrap["element"],
												[...PathAcc, typeof FieldTokenMap.arrayItem],
												Options
											>;
										}
									: // ------------------------------------------------
										//  TUPLE  (z.tuple([...]))
										// ------------------------------------------------
										ZodSchemaToUnwrap extends z.ZodTuple
										? TrieNode<
												Options extends { isUnionRootDescendant: true }
													? FormFieldOptionUnionDescendantLevel<
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
											ZodSchemaToUnwrap extends
													| z.ZodUnion
													| z.ZodDiscriminatedUnion
											? TrieNode<
													FormFieldOptionUnionRootLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc,
														ZodSchemaToUnwrap extends z.ZodDiscriminatedUnion<
															infer Options
														>
															? {
																	tag: {
																		key: ZodSchemaToUnwrap["def"]["discriminator"];
																		values: ZodSchemaToUnwrap["def"]["discriminator"] extends keyof z.infer<
																			Options[number]
																		>
																			? Set<
																					z.infer<
																						Options[number]
																					>[ZodSchemaToUnwrap["def"]["discriminator"]]
																				>
																			: Set<Literal>;
																		valueToOptionIndex: ZodTagValueMap<
																			Options,
																			ZodSchemaToUnwrap["def"]["discriminator"]
																		>;
																	};
																}
															: NeverRecord
													>
												> &
													AttachCollectableTypeTrieNodesToUnionRootResolverMap<
														ZodSchemaToUnwrap["def"]["options"],
														PathAcc
													>
											: //
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
												: ZodSchemaToUnwrap extends z.ZodPipe
													? ZodResolverTrieResult<
															ZodSchemaToUnwrap["def"]["out"],
															ZodSchemaToInfer, // Q: is this correct
															PathAcc,
															Options
														>
													: ZodSchemaToUnwrap extends z.ZodAny | z.ZodUnknown
														? TrieNode<
																FormFieldOptionUnknownLevel<
																	PathAcc,
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>
																>
															>
														: ZodSchemaToUnwrap extends z.ZodNever
															? TrieNode<
																	FormFieldOptionNeverLevel<
																		never,
																		never,
																		PathAcc
																	>
																>
															: TrieNode<
																	FormFieldOptionUnknownLevel<
																		PathAcc,
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>
																	>
																>;

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
		recordField: z.record(z.string(), z.number().min(0)),
		recordOfObjects: z.record(
			z.string().min(1),
			z.object({
				id: z.uuid({ version: "v7" }),
				value: z.string().min(1),
			}),
		),
		arrayField: z.array(z.string().min(1)).min(1).max(3),
		arrayOfObjects: z.array(
			z.object({
				id: z.uuid({ version: "v7" }),
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
		discriminatedUnion: z.discriminatedUnion("type", [
			z.object({ type: z.literal("A"), value: z.string() }),
			z.object({ type: z.literal("B"), value: z.number() }),
			z.object({ type: z.literal("C"), value: z.boolean() }),
			z.object({ type: z.undefined(), value: z.null() }),
		]),
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
zodSchemaTestTrieResult.recordField[FIELD_CONFIG].level; // "record"
zodSchemaTestTrieResult.recordField[FieldTokenMap.recordProperty][FIELD_CONFIG]
	.level; // "primitive"
zodSchemaTestTrieResult.recordField[FieldTokenMap.recordProperty][FIELD_CONFIG]
	.type; // "number"
zodSchemaTestTrieResult.recordOfObjects[FIELD_CONFIG].level; // "record"
zodSchemaTestTrieResult.recordOfObjects[FieldTokenMap.recordProperty][
	FIELD_CONFIG
].level; // "object"
zodSchemaTestTrieResult.recordOfObjects[FieldTokenMap.recordProperty].id[
	FIELD_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.recordOfObjects[FieldTokenMap.recordProperty].id[
	FIELD_CONFIG
].type; // "string"
zodSchemaTestTrieResult.arrayField[FIELD_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayField[FieldTokenMap.arrayItem][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.arrayField[FieldTokenMap.arrayItem][FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.arrayOfObjects[FIELD_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayOfObjects[FieldTokenMap.arrayItem][FIELD_CONFIG]
	.level; // "object"
zodSchemaTestTrieResult.arrayOfObjects[FieldTokenMap.arrayItem].value[
	FIELD_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.arrayOfObjects[FieldTokenMap.arrayItem].value[
	FIELD_CONFIG
].type; // "number"
zodSchemaTestTrieResult.tupleField[FIELD_CONFIG].level; // "tuple"
zodSchemaTestTrieResult.tupleField[0][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[0][FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.tupleField[1][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[1][FIELD_CONFIG].type; // "number"
zodSchemaTestTrieResult.unionField[FIELD_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[0].level;
zodSchemaTestTrieResult.unionOfArrays[FieldTokenMap.unionOptionOn][0][
	FieldTokenMap.arrayItem
][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfArrays[FieldTokenMap.unionOptionOn][0][
	FieldTokenMap.arrayItem
][FIELD_CONFIG].type; // "string"
zodSchemaTestTrieResult.unionOfArrays[FieldTokenMap.unionOptionOn][1][
	FieldTokenMap.arrayItem
][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfArrays[FieldTokenMap.unionOptionOn][1][
	FieldTokenMap.arrayItem
][FIELD_CONFIG].type; // "number"
zodSchemaTestTrieResult.unionOfArrays[FIELD_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[FieldTokenMap.arrayItem][0][
	FieldTokenMap.arrayItem
][FIELD_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfObjects.type[FIELD_CONFIG].level;
zodSchemaTestTrieResult.unionOfObjects[FIELD_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfObjects[FIELD_CONFIG].level; // "object"
// NOTE: discriminated Union is still in progress
const discriminatedUnionValueToOptionIndexTest =
	zodSchemaTestTrieResult.discriminatedUnion[
		FIELD_CONFIG
	].constraints.tag.valueToOptionIndex.get("C"); // { type: "A", value: string }
const discriminatedUnionValuesTest = [
	...zodSchemaTestTrieResult.discriminatedUnion[FIELD_CONFIG].constraints.tag
		.values,
]; // ( "A" | "B" | "C" | undefined )[]

type T = Prettify<{ a: { b: { c: "d" } } } & { a: { b: { e: "f" } } }>;
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
				metadata: { validationEvent: options.validationEvent },
			};
		}

		if ("value" in result) {
			return {
				result: { value: result.value as unknown as T, issues: undefined },
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
	"union-root-descendant"?: {
		rootPathToInfo: Record<
			string,
			{
				rootPath: string;
				rootPathSegments: PathSegmentItem[];
				paths: Set<string>;
			}[]
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
 * @warning it's not accounting for "union-root" yet or recursive compatible intersections
 */
function resolveIntersectionItemConfig(props: {
	acc: ZodResolverAcc;
	existingNode: TrieNode | undefined;
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
			for (const ruleKey in newConfig.constraints) {
				const element = (newConfig.constraints as Record<string, any>)[ruleKey];
				if (typeof element === "undefined") continue;
				(existingConfig.constraints as Record<string, any>)[ruleKey] = element;
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
					constraints: {},
					validation: {
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
					metadata: { ...existingNode.metadata, "marked-never": true },
					userMetadata: {},
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
	currentParentNode: TrieNode | undefined;
	childKey: string | number | undefined;
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
			if (props.childKey !== FieldTokenMap.arrayItem) {
				throw new Error(
					`Array parent can only have "${FieldTokenMap.arrayItem}" as child key, got "${props.childKey}"`,
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
	currentAttributes: CurrentAttributes | undefined;
	inheritedMetadata: InheritedMetadata;
	currentParentNode: TrieNode | undefined;
	childKey: string | number | undefined;
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
			existingNode[FIELD_CONFIG].level === "union-descendant"
		) {
			// TODO: needs to check the `marked-never`
			// Merge union-descendant options
			const itemsToPush =
				props.node[FIELD_CONFIG].level === "union-descendant"
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

		const unionRootDescendant =
			props.inheritedMetadata["union-root-descendant"];
		if (unionRootDescendant) {
			// // Will this be used?
			// const originPath = unionRootDescendant.rootPathToInfo[props.path]!;
			const oldNode = newNode;
			newNode = {
				[FIELD_CONFIG]: {
					level: "union-descendant",
					options: [oldNode],
					pathString: oldNode[FIELD_CONFIG].pathString,
					pathSegments: oldNode[FIELD_CONFIG].pathSegments,
					// Q: default: ctx.default, // Can we pass it from the root somehow? maybe also make it lazy calculated/computed and cached? or just ignore it for union-descendant? is there a use case that needs it and can't be handled easily otherwise?
					constraints: {},
					validation: {
						async validate(value, options): Promise<ValidateReturnShape> {
							const config = newNode[
								FIELD_CONFIG
							] as FormFieldOptionUnionDescendantLevel;
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
											"union-descendant": { firstValidOptionIndex: i },
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
					metadata: {
						"union-root-descendant": unionRootDescendant,
					},
					userMetadata: {},
				} satisfies FormFieldOptionUnionDescendantLevel,
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
	"record-direct-property"?: boolean;
	isLazyChildren?: boolean;
}

const calcPresence = (
	props:
		| {
				optional?: boolean;
				nullable?: boolean;
		  }
		| undefined,
): Presence =>
	(props &&
		(props.optional
			? props.nullable
				? "nullish"
				: "optional"
			: props.nullable
				? "nullable"
				: undefined)) ??
	"required";
function tagToOptionIndexSetGuard(
	map: Map<Literal, any>,
	literal: Literal,
	optionIndex: number,
) {
	if (map.has(literal)) {
		throw new Error(
			`Duplicate literal in discriminated union tag: ${literal}, option indexes: ${map.get(literal)} and ${optionIndex}`,
		);
	}
}

/*
NOTE: `schema._zod.def.*` **is needed** since it interacts will with TS
The following are not enough:
From Zod docs:
	- `schema.describe()` - human label `Returns a new instance that has been registered in z.globalRegistry with the specified description` 
	- `schema.isNullable()`: @deprecated Try safe-parsing null (this is what isNullable does internally)
	- ``schema.isOptional()``: @deprecated Try safe-parsing undefined (this is what isOptional does internally)
`schema.unwrap()` - will work only for for some types so the recursive functionality is needed anyway
`pushToAcc` is needed to easily access the accumulator by path and use it when needed instead of always recursing or looping through the whole thing again and again
`inheritedMetadata` is needed for properly handling and passing `intersection-item` and `union-root` metadata to the needed path because they can be defined at a higher level and need to be passed down to apply them properly

The system looks as it is because I'm trying different ways before changing the data structure to a Trie like one, to support many advanced functionalities and to make propagation cheap, and yes the tokenization will play a huge role on it
*/
function zodResolverImpl(
	schema: ZodAny,
	ctx: {
		//
		currentParentPathString: string;
		currentParentPathSegments: PathSegmentItem[];
		currentParentNode: TrieNode | undefined;
		currentSchema: ZodAny;
		childKey: string | number | undefined;
		//
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		//
		acc: ZodResolverAcc;
		//
		default?: any;
		optional?: boolean;
		nullable?: boolean;
		readonly?: boolean;
	},
): {
	pathToNode: Record<string, TrieNode>;
	node: TrieNode;
} {
	const currentParentPathString = ctx.currentParentPathString;
	const currentParentPathSegments = ctx.currentParentPathSegments;

	// NOTE:
	// - ZodDefault:
	//   - Makes the final inferred type **non-optional**.
	//   - If the key is missing or explicitly set to `undefined`, it fills in the default value.
	//   - When used with `.nullable()`, it still allows `null` values.
	//   - So, missing key or `undefined` input results in the default value being used.
	//
	// - ZodPrefault:
	//   - Keeps the final inferred type **optional**.
	//   - If the key is missing, it fills in the default value.
	//   - If the key is present but explicitly set to `undefined`, it is treated as `undefined` (not replaced by the default).
	//   - Works with `.nullable()` to allow `null` as a value as well.
	//
	// In other words, the key difference is how `undefined` input is treated when the key is present:
	// - `.default()` transforms `undefined` input into the default.
	// - `.prefault()` does not transform `undefined` if explicitly passed, only if the key is missing.
	//
	// Summary:
	// - ZodDefault: missing key → default; key present with undefined → default
	// - ZodPrefault: missing key → default; key present with undefined → undefined
	// - Both allow `null` if marked as nullable.
	//
	// This difference impacts TypeScript inferred types too: `.default()` results in a non-optional property type, while `.prefault()` results in an optional property type.

	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (schema instanceof z.ZodPrefault) {
		const defaultValue = schema.def.defaultValue;
		schema = schema.def.innerType;
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema, {
				...ctx,
				acc: ctx.acc,
				default: defaultValue,
				// NOTE: No need to change optional here, it already keeps it optional
			}).node,
		};
	}
	if (schema instanceof z.ZodDefault) {
		const defaultValue = schema.def.defaultValue;
		schema = schema.def.innerType;
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema, {
				...ctx,
				acc: ctx.acc,
				default: defaultValue,
				optional: false,
			}).node,
		};
	}
	if (schema instanceof z.ZodReadonly) {
		return zodResolverImpl(schema.unwrap(), {
			...ctx,
			readonly: true,
		});
	}
	if (schema instanceof z.ZodNonOptional) {
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema.unwrap(), {
				...ctx,
				optional: false,
				nullable: false,
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
		schema instanceof z.ZodEnum ||
		schema instanceof z.ZodStringFormat
		// ZodCustomStringFormat
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
		} else if (schema instanceof z.ZodStringFormat) {
			regex = schema.def.pattern;
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
			default: ctx.default,
			constraints: {
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
				coerce,
				minLength,
				maxLength,
				regex,
			},
			validation: {
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
			userMetadata: {},
			metadata: { ...ctx.currentAttributes },
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
	if (schema instanceof z.ZodNumber || schema instanceof z.ZodNumberFormat) {
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
					// inclusiveMax = check._zod.def.when
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
			default: ctx.default,
			constraints: {
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
				coerce: schema.def.coerce,
				min,
				max,
				inclusiveMin,
				inclusiveMax,
				int,
				multipleOf,
			},
			validation: {
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
			userMetadata: {},
			metadata: { ...ctx.currentAttributes },
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
			default: ctx.default,
			constraints: {
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
				coerce: schema.def.coerce,
				min,
				max,
				inclusiveMin,
				inclusiveMax,
			},
			validation: {
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
			userMetadata: {},
			metadata: { ...ctx.currentAttributes },
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
			default: ctx.default,
			constraints: {
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
				coerce: schema.def.coerce,
			},
			validation: {
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
			userMetadata: {},
			metadata: { ...ctx.currentAttributes },
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
	if (schema instanceof z.ZodFile) {
		const config: FormFieldOptionFilePrimitiveLevel = {
			level: "primitive",
			type: "file",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: {
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
				// multiple: schema.def.multiple,
				// accept: schema.def.accept,
				max: undefined,
				min: undefined,
				mimeTypes: undefined,
				coerce: undefined,
			},
			validation: {
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
			userMetadata: {},
			metadata: { ...ctx.currentAttributes },
		};
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckMaxSize) {
					config.constraints.max = check._zod.def.maximum;
				} else if (check instanceof z.core.$ZodCheckMinSize) {
					config.constraints.min = check._zod.def.minimum;
				} else if (check instanceof z.core.$ZodCheckMimeType) {
					config.constraints.mimeTypes = check._zod.def.mime;
				}
			}
		}
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
			? `${currentParentPathString}.${FieldTokenMap.arrayItem}`
			: FieldTokenMap.arrayItem;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			FieldTokenMap.arrayItem,
		];
		const node: TrieNode = {
			[FIELD_CONFIG]: {
				level: "array",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					minLength,
					maxLength,
				},
				validation: {
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
				userMetadata: {},
				metadata: { ...ctx.currentAttributes },
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
			childKey: FieldTokenMap.arrayItem,
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
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					exactLength,
					minLength,
					maxLength,
				},
				validation: {
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
				userMetadata: {},
				metadata: {
					isLazyChildren: true,
					...ctx.currentAttributes,
				},
			} as FormFieldOptionTupleLevel,
		};

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index]!;
			const indexedNextParent = currentParentPathString
				? `${currentParentPathString}.${index}`
				: String(index);
			const indexedNextParentSegments = [...currentParentPathSegments, index];

			// This is eagerly evaluating all tuple items
			// zodResolverImpl(item, {
			// 	acc: ctx.acc,
			// 	currentParentPathString: indexedNextParent,
			// 	currentParentPathSegments: indexedNextParentSegments,
			// 	currentAttributes: { "tuple-direct-item": true },
			// 	currentSchema: item,
			// 	inheritedMetadata: ctx.inheritedMetadata,
			// 	currentParentNode: node,
			// 	childKey: index,
			// }).node;
			// If we want to make it lazy, we can just assign and use `Object.defineProperty` with getter
			Object.defineProperty(node, index, {
				enumerable: true,
				configurable: true,
				get: () => {
					const value = zodResolverImpl(item, {
						acc: ctx.acc,
						currentParentPathString: indexedNextParent,
						currentParentPathSegments: indexedNextParentSegments,
						currentAttributes: { "tuple-direct-item": true },
						currentSchema: item,
						inheritedMetadata: ctx.inheritedMetadata,
						currentParentNode: node,
						childKey: index,
					}).node;

					Object.defineProperty(node, index, {
						value,
						writable: true,
						configurable: true,
						enumerable: true,
					});

					return value;
				},
			});
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
	if (schema instanceof z.ZodRecord) {
		// Extract key and value types
		const keySchema = schema.def.keyType;
		const valueSchema = schema.def.valueType;

		// Create record node configuration
		const node: TrieNode = {
			[FIELD_CONFIG]: {
				level: "record",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					// Store schema references for runtime operations
					keySchema,
					valueSchema,
				},
				validation: {
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
				userMetadata: {},
				metadata: { ...ctx.currentAttributes },
			} as FormFieldOptionRecordLevel,
		};

		// Create token path for the property template
		const tokenNextParent = currentParentPathString
			? `${currentParentPathString}.${FieldTokenMap.recordProperty}`
			: FieldTokenMap.recordProperty;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			FieldTokenMap.recordProperty,
		];

		// Process value type schema for the token path
		zodResolverImpl(valueSchema, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { "record-direct-property": true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: valueSchema,
			get currentParentNode() {
				return node;
			},
			childKey: FieldTokenMap.recordProperty,
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
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validation: {
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
				userMetadata: {},
				metadata: {
					isLazyChildren: true,
					...ctx.currentAttributes,
				},
			} as FormFieldOptionObjectLevel,
		};

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParentPathString
				? `${currentParentPathString}.${key}`
				: key;
			const nextParentSegments = [...currentParentPathSegments, key];
			// This is eagerly evaluating all properties
			// zodResolverImpl(shape[key], {
			// 	acc: ctx.acc,
			// 	currentParentPathString: nextParent,
			// 	currentParentPathSegments: nextParentSegments,
			// 	currentAttributes: { "object-property": true },
			// 	currentSchema: shape[key],
			// 	inheritedMetadata: ctx.inheritedMetadata,
			// 	currentParentNode: node,
			// 	childKey: key,
			// }).node;
			// If we want to make it lazy, we can just assign and use `Object.defineProperty` with getter
			Object.defineProperty(node, key, {
				enumerable: true,
				configurable: true,
				get: () => {
					const value = zodResolverImpl(shape[key], {
						acc: ctx.acc,
						currentParentPathString: nextParent,
						currentParentPathSegments: nextParentSegments,
						currentAttributes: { "object-property": true },
						currentSchema: shape[key],
						inheritedMetadata: ctx.inheritedMetadata,
						currentParentNode: node,
						childKey: key,
					}).node;

					Object.defineProperty(node, key, {
						value,
						writable: true,
						configurable: true,
						enumerable: true,
					});

					return value;
				},
			});
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
	// if (schema instanceof z.ZodRecord) {
	// }

	// Q: How should the `currentAttributes` be handled for union-root and intersection-item? and should they be passed down to their children/resulting branches?

	if (
		schema instanceof z.ZodUnion ||
		schema instanceof z.ZodDiscriminatedUnion
	) {
		const rootPathToInfo = {
			...ctx.inheritedMetadata["union-root-descendant"]?.rootPathToInfo,
		};
		// collect all branches into one UnionRootLevel
		const config = {
			level: "union-root",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			options: [],
			default: ctx.default,
			constraints: {
				tag: undefined,
				presence: calcPresence(ctx),
				readonly: ctx.readonly,
			},
			validation: {
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
			userMetadata: {},
			metadata: {
				"union-root-descendant": { rootPathToInfo },
				...ctx.currentAttributes,
			},
		} as FormFieldOptionUnionRootLevel;
		rootPathToInfo[currentParentPathString] ??= [];

		if (schema instanceof z.ZodDiscriminatedUnion) {
			config.constraints.tag = {
				key: schema.def.discriminator,
				values: new Set(),
				valueToOptionIndex: new Map(),
			};

			for (let i = 0; i < schema.def.options.length; i++) {
				const opt = schema.def.options[i];
				if (!opt || !(opt instanceof z.ZodObject)) {
					throw new Error("Discriminated union options must be ZodObject");
				}

				const tagSchema = opt.def.shape[config.constraints.tag.key];

				if (tagSchema instanceof z.ZodLiteral) {
					for (const literal of tagSchema.def.values) {
						tagToOptionIndexSetGuard(
							config.constraints.tag.valueToOptionIndex,
							literal,
							i,
						);
						config.constraints.tag.valueToOptionIndex.set(literal, i);
						config.constraints.tag.values.add(literal);
					}
					continue;
				}

				if (tagSchema instanceof z.ZodEnum) {
					for (const enumValue of Object.values(tagSchema.def.entries)) {
						tagToOptionIndexSetGuard(
							config.constraints.tag.valueToOptionIndex,
							enumValue,
							i,
						);
						config.constraints.tag.valueToOptionIndex.set(enumValue, i);
						config.constraints.tag.values.add(enumValue);
					}
					continue;
				}

				if (tagSchema instanceof z.ZodUnion) {
					for (const tagOpt of tagSchema.def.options) {
						if (tagOpt instanceof z.ZodLiteral) {
							for (const literal of tagOpt.def.values) {
								tagToOptionIndexSetGuard(
									config.constraints.tag.valueToOptionIndex,
									literal,
									i,
								);
								config.constraints.tag.valueToOptionIndex.set(literal, i);
								config.constraints.tag.values.add(literal);
							}
							continue;
						}

						if (tagOpt instanceof z.ZodEnum) {
							for (const enumValue of Object.values(tagOpt.def.entries)) {
								tagToOptionIndexSetGuard(
									config.constraints.tag.valueToOptionIndex,
									enumValue,
									i,
								);
								config.constraints.tag.valueToOptionIndex.set(enumValue, i);
								config.constraints.tag.values.add(enumValue);
							}
							continue;
						}

						throw new Error(
							// biome-ignore lint/suspicious/noTsIgnore: <explanation>
							// @ts-ignore
							`Discriminated union discriminator/tag must if it happen to be a union too, it's members must be either ZodLiteral or ZodEnum, got ${tagOpt.def.typeName}`,
						);
					}
					continue;
				}

				throw new Error(
					`Discriminated union discriminator/tag must be either ZodLiteral or ZodEnum, got ${tagSchema.def.typeName}`,
				);
			}
		}

		rootPathToInfo[currentParentPathString].push({
			rootPath: currentParentPathString,
			rootPathSegments: currentParentPathSegments,
			paths: new Set([currentParentPathString]),
		});

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
						"union-root-descendant": { rootPathToInfo },
					},
					currentAttributes: { ...ctx.currentAttributes },
					currentParentNode: ctx.currentParentNode,
					currentSchema: opt,
					childKey: ctx.childKey,
				}).node;
				const currentParentIndexedTokenPath = currentParentPathString
					? `${currentParentPathString}.${FieldTokenMap.unionOptionOn}.${index}`
					: `${FieldTokenMap.unionOptionOn}.${index}`;
				const currentParentIndexedTokenPathSegments = [
					...currentParentPathSegments,
					FieldTokenMap.unionOptionOn,
					index,
				];
				zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParentPathString: currentParentIndexedTokenPath,
					currentParentPathSegments: currentParentIndexedTokenPathSegments,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						"union-root-descendant": { rootPathToInfo },
					},
					currentAttributes: { ...ctx.currentAttributes },
					currentParentNode: ctx.currentParentNode,
					currentSchema: opt,
					childKey: ctx.childKey,
				});

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

	// TODO: `.or`, `.and` - which are just aliases to union and intersection respectively needs more tests
	// TODO: The following will have need to be handled properly in the future
	//
	// - z.ZodNever
	// = z.ZodUndefined;
	// = z.ZodNull;
	//
	// - z.ZodCodec - which will support `z.stringbool` too.
	// - z.ZodCustom
	// - z.ZodCustomStringFormat
	// - z.ZodBigInt
	// - z.ZodBigIntFormat
	// - z.ZodTransform
	// - z.ZodMap
	// - z.ZodSet
	//
	// - z.ZodLiteral
	//
	// - z.ZodCatch
	// - z.ZodPromise
	// - z.ZodFunction
	// - z.ZodVoid
	// - z.ZodSymbol
	// - z.ZodNaN
	// - z.ZodTemplateLiteral
	// - z.ZodPromise

	if (schema instanceof z.ZodPipe) {
		const mainSchema = schema.in;
		return {
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(mainSchema, ctx).node,
		};
	}

	if (schema instanceof z.ZodLazy) {
		// We need to call the getter to get the actual schema
		const mainSchema = schema.def.getter();
		// It's OK, since there are lazy computations already here, we won't get into infinite loop
		// Q: Do we need to handle circular references somehow?
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
			default: ctx.default,
			constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
			validation: {
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
			userMetadata: {},
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
					level: "unknown",
					pathString: currentParentPathString,
					pathSegments: currentParentPathSegments,
					userMetadata: {},
					default: ctx.default,
					constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
					validation: {
						validate(value, options) {
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
 * This is why there is a special token for array items: `@@__FIELD_TOKEN_ARRAY_ITEM__@@`, so we can optimize dependencies and validations for all items in an array.
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
		return schemaPathCache.get(schema) as any;
	}

	const rootNode: TrieNode = {
		[FIELD_CONFIG]: {
			level: "temp-root",
			pathString: "",
			pathSegments: [],
			constraints: { presence: "required", readonly: false },
			validation: {
				validate() {
					throw new Error("Not implemented");
				},
			},
			userMetadata: {},
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
	record: z.record(z.string().min(1), z.number().min(0)),
});

console.log(test);

type TestInput = z.input<typeof test>;
type TestOutput = z.input<typeof test>;

/*
TODO: Field Arrays Utils
- `append`
- `prepend`
- `insert`
- `remove`
- `move`
- `swap`
- `update`
- `replace`
*/
/*
TODO: Field Records Utils
addProperty
removeProperty
renameProperty
updateProperty
*/
/*
  / ** Fields that should trigger validation of this field * /
  deps?: NestedPath<Values>[];
  
  / ** When to validate this field * /
  mode?: ValidationEvents | "onChange";
  
  / ** Debounce time for async validation (ms) * /
  asyncDebounceMs?: number;
  
  / ** Custom function to determine if validation should run * /
  shouldValidate?: (values: Values) => boolean;
*/

// TODO: enum/literal arrays for UI-friendly strict matching.

/*
| Missing piece                      | Impact                             | Minimal patch                                          |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **Effects / Refine / Transform**   | rules are lost                     | wrap schema in `zodResolverImpl(schema.def.inner, …)` |
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
* **Future-facing metadata**: You've left room for `"intersection-item"`, `"union-root-descendant"`, `"marked-never"`, etc. This gives you hooks for optimizations without changing core types later.

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
   * You're designing *actual structural handling* (union-root descendants, intersection propagation). This is rare.

2. **Never-level marking**

   * Instead of throwing or losing context, you keep nodes alive but annotated as `never`.
   * That's clever: it preserves schema shape and metadata while still signaling runtime impossibility.

3. **Path segments + symbolic tokens** (`@@__FIELD_TOKEN_ARRAY_ITEM__@@`)

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
// Right now, you have TODOs around merging union-root and intersection-item metadata/config. This is a big one:
// Union: each path should map to multiple possible schemas. You'll need either an options: ResolverConfigShape[] array or a tagged type.
// Intersection: each path should merge all constraints. But min/max collisions or type incompatibilities can't always be resolved statically. You may need a dual left/right config like you started.
// If you skip this, you'll get misleading metadata (union-root path may appear stricter/looser than reality).
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
// You're mapping issue.path.join(".") to currentParent, but Zod sometimes returns array indices (e.g. ["addresses", 0, "street"]). Joining with "." is fine, but doesn't align with your @@__FIELD_TOKEN_ARRAY_ITEM__@@ abstraction.
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
