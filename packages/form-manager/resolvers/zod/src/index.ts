// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import z from "zod/v4";

export const name = "form-manager-resolver-zod";

interface PathSegment {
	/** The key representing a path segment. */
	readonly key: PropertyKey;
}
type PathSegmentItem = PropertyKey | PathSegment;

const ARRAY_ITEM_TOKEN = "@@__ARRAY_ITEM__@@";
type FormValidationEvent = "input" | "blur" | "touch" | "submit";
interface FormManagerError<Path extends string> {
	/** The error message of the issue. */
	/* readonly */ message: string | null;
	/** The path of the issue, if any. */
	/* readonly */ path: Path; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	readonly pathSegments: readonly PathSegmentItem[];
}

interface SuccessResult<Output> {
	/** The typed output value. */
	/* readonly */ value: Output;
	/** The non-existent issues. */
	/* readonly */ issues?: undefined;
}
/** The result interface if validation fails. */
interface FailureResult<Path extends string> {
	/** The issues of failed validation. */
	/* readonly */ issues: ReadonlyArray<FormManagerError<Path>>;
}
type ValidationResult<Path extends string, ValidValue> =
	| SuccessResult<ValidValue>
	| FailureResult<Path>;
interface ValidateOptions {
	/** The validation event that triggered the validation. */
	validationEvent: FormValidationEvent;
}

type Presence = "required" | "optional" | "nullable" | "nullish";

interface Level<LevelName extends string, Value = any> {
	level: LevelName;
	path: string;
	pathSegments: PathSegmentItem[];
	// required?: boolean;
	presence?: Presence;
	default?: Value;
	metadata?: {
		[key in
			| "object-property"
			| "tuple-direct-item"
			| "array-token-item"
			| "marked-never"]?: boolean;
	} & {
		"intersection-item"?: {
			[path: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
		};
		"union-item-descendant"?: {
			// paths: Set<string>;
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
interface TempRootLevel extends Level<"temp-root"> {}
interface NeverLevel extends Level<"never"> {}
interface UnknownLevel extends Level<"unknown"> {}
interface PrimitiveLevelBase<Value> extends Level<"primitive", Value> {
	coerce?: boolean;
}
interface StringPrimitiveLevel extends PrimitiveLevelBase<string> {
	type: "string";
	minLength?: number;
	maxLength?: number;
	regex?: RegExp;
	metadata?: PrimitiveLevelBase<string>["metadata"] & {
		enum?: string[];
		"native-enum"?: Record<string, string | number>;
		literal?: string | number | boolean | null;
	};
}
interface NumberPrimitiveLevel extends PrimitiveLevelBase<number> {
	type: "number";
	min?: number;
	inclusiveMin?: boolean;
	max?: number;
	inclusiveMax?: boolean;
	int?: boolean;
	metadata?: PrimitiveLevelBase<string>["metadata"] & {
		enum?: number[];
		"native-enum"?: Record<string, string | number>;
		literal?: string | number | boolean | null;
	};
}
interface DatePrimitiveLevel extends PrimitiveLevelBase<Date> {
	type: "date";
	min?: Date;
	inclusiveMin?: boolean;
	max?: Date;
	inclusiveMax?: boolean;
}
interface BooleanPrimitiveLevel extends PrimitiveLevelBase<boolean> {
	type: "boolean";
}
type PrimitiveLevel =
	| StringPrimitiveLevel
	| NumberPrimitiveLevel
	| DatePrimitiveLevel
	| BooleanPrimitiveLevel;

interface ObjectLevel extends Level<"object", Record<string, any>> {
	required?: boolean;
	shape: Record<string, TrieNode>;
}
interface ArrayLevel extends Level<"array", any[]> {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	items: TrieNode; // Need to find a way to reference the main type here
}
interface TupleLevel extends Level<"tuple", any[]> {
	required?: boolean;
	exactLength?: number;
	minLength?: number;
	maxLength?: number;
	items: TrieNode[];
}
interface UnionItemLevel extends Level<"union-item"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	// validateToOption: (value: any) => Promise<{
	// 	| null;
	// 	result: ValidationResult<string, any>;
	// }>;
	options: TrieNode[];
	// discriminator?: string;
}
// interface IntersectionLevel extends Level<"intersection"> {
// 	// left: ResolverConfigShape; // Need to find a way to reference the main type here
// 	// right: ResolverConfigShape; // Need to find a way to reference the main type here
// 	// left: (value: any) => Promise<ValidationResult<string, any>>;
// 	// right: (value: any) => Promise<ValidationResult<string, any>>;
// 	parts: ResolverConfigShape[];
// }

interface ValidateReturnShape {
	result: ValidationResult<any, any>;
	metadata?: {
		// /** The validation event that triggered the validation, if any. */
		/* readonly */ validationEvent: FormValidationEvent;
		"union-item"?: { firstValidOptionIndex: number };
	};
}

interface ResolverConfigBase {
	validate: (
		value: any,
		options: ValidateOptions,
	) => Promise<ValidateReturnShape>;
}

type ResolverConfigShape = ResolverConfigBase &
	(
		| TempRootLevel
		| UnknownLevel
		| NeverLevel
		| PrimitiveLevel
		| ObjectLevel
		| ArrayLevel
		| TupleLevel
		| UnionItemLevel
	);

/* Trie structure for path-based storage and retrieval */
const FIELD_CONFIG = Symbol("FIELD_CONFIG");
interface TrieNode {
	// TrieNodeWithFields
	[key: string]: TrieNode;
}
interface TrieNode {
	// TrieNodeResolverConfig
	[FIELD_CONFIG]: ResolverConfigShape;
}
function directInsert(node: TrieNode, rc: ResolverConfigShape) {
	node[FIELD_CONFIG] = rc;
}
// function insertByPath(node: TrieNode, path: string, rc: ResolverConfigShape) {
// 	const parts = path.split(".");
// 	let current = node;

// 	for (const part of parts) {
// 		current = current[part] ??= {
// 			[FIELD_CONFIG]: {
// 				level: "temp-root",
// 				path: "",
// 				validate: async (value) => {
// 					throw new Error("Not implemented");
// 				}
// 			},
// 		};
// 	}
// 	current[FIELD_CONFIG] = rc;
// }
function directGet(node: TrieNode): ResolverConfigShape | undefined {
	return node[FIELD_CONFIG];
}
function getByPath(
	node: TrieNode,
	path: string,
): ResolverConfigShape | undefined {
	const parts = path.split(".");
	let current: TrieNode | undefined = node;

	for (const part of parts) {
		current = current?.[part];
		if (!current) return;
	}
	return current[FIELD_CONFIG];
}
/* End Trie structure */

async function customValidate(
	props: {
		value: any;
		currentParent: string;
		currentParentSegments: PathSegmentItem[];
		schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	},
	options: ValidateOptions,
): Promise<ValidateReturnShape> {
	try {
		const result = await props.schema["~standard"].validate(props.value);

		if ("issues" in result && result.issues) {
			return {
				result: {
					issues: result.issues.map((issue) => ({
						message: issue.message,
						path: issue.path?.join(".") || props.currentParent,
						pathSegments: issue.path || props.currentParentSegments,
					})),
				},
			};
		}

		if ("value" in result) {
			return {
				result: { value: result.value },
				metadata: { validationEvent: options.validationEvent },
			};
		}

		// This case should never happen with proper Zod usage
		return {
			result: {
				issues: [
					{
						message: "Unknown validation error",
						path: props.currentParent,
						pathSegments: props.currentParentSegments,
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
						path: props.currentParent,
						pathSegments: props.currentParentSegments,
					},
				],
			},
			metadata: { validationEvent: options.validationEvent },
		};
	}
}

// const z = await import('https://unpkg.com/zod@latest?module')

interface InheritedMetadata {
	"intersection-item"?: {
		[path: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
	};
	"union-item-descendant"?: {
		// originDivergencePath: string;
		// originDivergencePathSegments: PathSegmentItem[];
		// paths: Set<string>;
		// paths: Set<string>;
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
	// paths: string[];
	// pathToResolverConfig: Record<string, ResolverConfigShape>;
	// resolverConfig: ResolverConfigShape;
	pathToNode: Record<string, TrieNode>;
	node: TrieNode;
}

/**
 * Update it on the `pathToResolverConfig` by using the `path`
 * @warning it's not accounting for "union-item" yet or recursive compatible intersections
 */
function resolveIntersectionItemConfig(props: {
	acc: ZodResolverAcc;
	existingConfig?: TrieNode;
	newConfig: TrieNode;
}): TrieNode {
	const existingConfig = props.existingConfig;
	if (existingConfig) {
		if (
			existingConfig[FIELD_CONFIG].level ===
				props.newConfig[FIELD_CONFIG].level &&
			(existingConfig[FIELD_CONFIG].level !== "primitive" ||
				(existingConfig[FIELD_CONFIG].level === "primitive" &&
					existingConfig[FIELD_CONFIG].type ===
						(
							props.newConfig[FIELD_CONFIG] as ResolverConfigShape &
								PrimitiveLevel
						).type))
		) {
			for (const key in props.newConfig) {
				if (key === "metadata") {
					// Merge metadata
					existingConfig[FIELD_CONFIG].metadata = {
						...(existingConfig[FIELD_CONFIG].metadata || {}),
						...(props.newConfig.metadata || {}),
					};
				}

				existingConfig[FIELD_CONFIG][key as keyof ResolverConfigShape] =
					props.newConfig[FIELD_CONFIG][key as keyof ResolverConfigShape];
			}

			return existingConfig;
		} else {
			try {
				// We will override the existing config to be of never type
				// Since if we do `"marked-never": true` it won't be logical
				// `"marked-never": true` will be used outside for the descendent if there is though
				// To avoid losing the other paths, metadata, and information
				// biome-ignore lint/suspicious/noTsIgnore: <explanation>
				// @ts-ignore
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				return (props.acc.pathToNode[props.newConfig[FIELD_CONFIG].path][
					FIELD_CONFIG
				] = {
					level: "never",
					path: existingConfig[FIELD_CONFIG].path,
					pathSegments: existingConfig[FIELD_CONFIG].pathSegments,
					metadata: { ...existingConfig.metadata, "marked-never": true },
					validate: async (value, options) =>
						customValidate(
							{
								value,
								currentParent: existingConfig[FIELD_CONFIG].path,
								currentParentSegments:
									existingConfig[FIELD_CONFIG].pathSegments,
								schema: z.never(),
							},
							options,
						),
				} satisfies ResolverConfigShape);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	// props.acc.paths.push(props.newConfig.path);
	props.acc.pathToNode[props.newConfig[FIELD_CONFIG].path] = props.newConfig;
	return props.newConfig;
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
	if (parentConfig.level === "object") {
		props.currentParentNode[props.childKey!] ??= props.childNode;
	} else if (parentConfig.level === "array") {
		if (props.childKey !== ARRAY_ITEM_TOKEN) {
			throw new Error(
				`Array parent can only have "${ARRAY_ITEM_TOKEN}" as child key, got "${props.childKey}"`,
			);
		}
		props.currentParentNode[props.childKey] ??= props.childNode;
	} else if (parentConfig.level === "tuple") {
		if (typeof props.childKey !== "number") {
			throw new Error(
				`Tuple parent can only have numeric keys as child key, got "${props.childKey}"`,
			);
		}
		props.currentParentNode[props.childKey] ??= props.childNode;
	} else {
		throw new Error(
			`Parent node must be of level "object", "array", or "tuple" to attach child nodes, got "${parentConfig.level}"`,
		);
	}
	return props.currentParentNode;
}

function pushToAcc(props: {
	path: string;
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	acc: ZodResolverAcc;
	node: TrieNode;
	currentAttributes?: CurrentAttributes;
	inheritedMetadata: InheritedMetadata;
	currentParentNode?: TrieNode;
	childKey?: string | number;
}): ZodResolverAcc & { isNew: boolean } {
	let existingNode: TrieNode | undefined = props.acc.pathToNode[props.path];
	let isNew = true;

	if (existingNode && existingNode[FIELD_CONFIG].level !== "temp-root") {
		isNew = false;

		if (existingNode.metadata?.["intersection-item"]) {
			//
			existingNode = resolveIntersectionItemConfig({
				acc: props.acc,
				existingConfig: existingNode,
				newConfig: props.node,
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
					path: oldNode[FIELD_CONFIG].path,
					pathSegments: oldNode[FIELD_CONFIG].pathSegments,
					metadata: {
						"union-item-descendant": unionItemDescendant,
					},
					async validate(value, options): Promise<ValidateReturnShape> {
						for (let i = 0; i < this.options.length; i++) {
							const opt = this.options[i];
							if (!opt) {
								console.warn(`\`${this.path}.options[${i}]\` is undefined`);
								continue;
							}
							const { result } = await opt[FIELD_CONFIG].validate(
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
								}; // success
							}
						}
						return {
							result: {
								issues: [
									{
										message: "No union option matched",
										path: this.path,
										pathSegments: this.pathSegments,
									},
								],
							},
							metadata: { validationEvent: options.validationEvent },
						};
					},
				} satisfies ResolverConfigBase & UnionItemLevel,
			};
		}

		// Instead of overriding the config level to be of never type
		// we will just mark it as never and handle it in the validation phase
		// to avoid losing the other paths, metadata, and information
		if (props.inheritedMetadata["marked-never"]) {
			metadata["marked-never"] = true;
		}
	}

	// props.acc.paths.push(props.path);
	props.acc.pathToNode[props.path] = newNode;
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
	//
	// "intersection-item": "left";
	// "intersection-item": "right";
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
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	ctx: {
		//
		currentParentPth: string;
		currentParentPathSegments: (string | number)[];
		currentParentNode?: TrieNode;
		childKey?: string | number;
		//
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		//
		acc: ZodResolverAcc;

		default?: any;
		optional?: boolean;
		nullable?: boolean;
		// isOptional?: boolean;
		// isNullable?: boolean;
	},
): ZodResolverAcc {
	const currentParentPath = ctx.currentParentPth;
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
		// const coerce = schema instanceof z.ZodString && schema._zod.def.coerce;
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
					if (check._zod.def.check === "") {
					}
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

		const config: ResolverConfigBase & StringPrimitiveLevel = {
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			validate: (value, options) =>
				customValidate(
					{
						value,
						currentParent: currentParentPath,
						currentParentSegments: currentParentPathSegments,
						schema,
					},
					options,
				),
			level: "primitive",
			type: "string",
			presence: calcPresence(ctx),
			default: ctx.default,
			minLength,
			maxLength,
			regex,
			coerce,
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				path: currentParentPath,
				schema,
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
		// TODO: scan schema.def.checks and set int, multipleOf, finite when present.
		const int: boolean | undefined = false;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckLessThan) {
					max = check._zod.def.value as number;
					inclusiveMax = check._zod.def.inclusive;
				} else if (check instanceof z.core.$ZodCheckGreaterThan) {
					min = check._zod.def.value as number;
					inclusiveMin = check._zod.def.inclusive;
				}
			}
		}

		const config: ResolverConfigBase & NumberPrimitiveLevel = {
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			validate: (value, options) =>
				customValidate(
					{
						value,
						currentParent: currentParentPath,
						currentParentSegments: currentParentPathSegments,
						schema,
					},
					options,
				),
			level: "primitive",
			type: "number",
			presence: calcPresence(ctx),
			default: ctx.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			int,
			coerce: schema.def.coerce,
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParentPath,
				schema,
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
		const config: ResolverConfigBase & DatePrimitiveLevel = {
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			validate: (value, options) =>
				customValidate(
					{
						value,
						currentParent: currentParentPath,
						currentParentSegments: currentParentPathSegments,
						schema,
					},
					options,
				),
			level: "primitive",
			type: "date",
			presence: calcPresence(ctx),
			default: ctx.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			coerce: schema.def.coerce,
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParentPath,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodBoolean) {
		const config: ResolverConfigBase & BooleanPrimitiveLevel = {
			level: "primitive",
			type: "boolean",
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			presence: calcPresence(ctx),
			default: ctx.default,
			validate: (value, options) =>
				customValidate(
					{
						value,
						currentParent: currentParentPath,
						currentParentSegments: currentParentPathSegments,
						schema,
					},
					options,
				),
			coerce: schema.def.coerce,
		};
		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParentPath,
				schema,
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

		const tokenNextParent = currentParentPath
			? `${currentParentPath}.${ARRAY_ITEM_TOKEN}`
			: ARRAY_ITEM_TOKEN;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			ARRAY_ITEM_TOKEN,
		];
		const node: TrieNode = {
			[FIELD_CONFIG]: {
				level: "array",
				path: currentParentPath,
				pathSegments: currentParentPathSegments,
				presence: calcPresence(ctx),
				default: ctx.default,
				minLength,
				maxLength,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParent: currentParentPath,
							currentParentSegments: currentParentPathSegments,
							schema,
						},
						options,
					),
				// To make sure we also cover the array item token path
				items: zodResolverImpl(schema.element, {
					acc: ctx.acc,
					currentParentPth: tokenNextParent,
					currentParentPathSegments: tokenNextParentSegments,
					currentAttributes: { "array-token-item": true },
					inheritedMetadata: ctx.inheritedMetadata,
					get currentParentNode() {
						return node;
					},
					childKey: ARRAY_ITEM_TOKEN,
				}).node,
			} as ResolverConfigBase & ArrayLevel,
		};

		return {
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node,
				path: currentParentPath,
				schema,
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
				path: currentParentPath,
				pathSegments: currentParentPathSegments,
				presence: calcPresence(ctx),
				default: ctx.default,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParent: currentParentPath,
							currentParentSegments: currentParentPathSegments,
							schema,
						},
						options,
					),
				shape: {}, // To be filled below
			} as ResolverConfigBase & ObjectLevel,
		};

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParentPath
				? `${currentParentPath}.${key}`
				: key;
			const nextParentSegments = [...currentParentPathSegments, key];
			node[FIELD_CONFIG].shape[key] = zodResolverImpl(shape[key], {
				acc: ctx.acc,
				currentParentPth: nextParent,
				currentParentPathSegments: nextParentSegments,
				currentAttributes: { "object-property": true },
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
				path: currentParentPath,
				schema,
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
			// maxLength = undefined;
		} else {
			exactLength = schema.def.items.length;
			minLength = schema.def.items.length;
			maxLength = schema.def.items.length;
		}
		const node = {
			[FIELD_CONFIG]: {
				level: "tuple",
				path: currentParentPath,
				pathSegments: currentParentPathSegments,
				presence: calcPresence(ctx),
				default: ctx.default,
				exactLength,
				minLength,
				maxLength,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParent: currentParentPath,
							currentParentSegments: currentParentPathSegments,
							schema,
						},
						options,
					),
				items: new Array(schema.def.items.length).fill(null),
			} as ResolverConfigBase & TupleLevel,
		};

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index]!;
			const indexedNextParent = currentParentPath
				? `${currentParentPath}.${index}`
				: String(index);
			const indexedNextParentSegments = [...currentParentPathSegments, index];

			node[FIELD_CONFIG].items[index] = zodResolverImpl(item, {
				acc: ctx.acc,
				currentParentPth: indexedNextParent,
				currentParentPathSegments: indexedNextParentSegments,
				currentAttributes: { "tuple-direct-item": true },
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: node,
				childKey: index,
			}).node;
		}

		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node,
				path: currentParentPath,
				schema,
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
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			options: [],
			metadata: {
				"union-item-descendant": { originDivergencePathToInfo },
				...ctx.currentAttributes,
			} satisfies Level<any>["metadata"],
			async validate(value, options): Promise<ValidateReturnShape> {
				for (let i = 0; i < this.options.length; i++) {
					const opt = this.options[i];
					if (!opt) {
						console.warn(`\`${this.path}.options[${i}]\` is undefined`);
						continue;
					}
					const { result } = await opt[FIELD_CONFIG].validate(value, options);
					if (!("issues" in result)) {
						return {
							result,
							metadata: {
								validationEvent: options.validationEvent,
								"union-item": { firstValidOptionIndex: i },
							},
						}; // success
					}
				}
				return {
					result: {
						issues: [
							{
								message: "No union option matched",
								path: this.path,
								pathSegments: this.pathSegments,
							},
						],
					},
					metadata: { validationEvent: options.validationEvent },
				};
			},
		} satisfies ResolverConfigBase & UnionItemLevel;
		originDivergencePathToInfo[currentParentPath] = {
			originDivergencePath: currentParentPath,
			originDivergencePathSegments: currentParentPathSegments,
			paths: new Set([currentParentPath]),
		};

		const node = pushToAcc({
			acc: ctx.acc,
			node: { [FIELD_CONFIG]: config },
			path: currentParentPath,
			schema,
			currentAttributes: ctx.currentAttributes,
			inheritedMetadata: ctx.inheritedMetadata,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		}).node;

		for (let index = 0; index < schema.options.length; index++) {
			const opt = schema.options[index];
			if (opt) {
				zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParentPth: currentParentPath,
					currentParentPathSegments: currentParentPathSegments,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						"union-item-descendant": { originDivergencePathToInfo },
					},
					currentAttributes: { ...ctx.currentAttributes },
					currentParentNode: ctx.currentParentNode,
					childKey: ctx.childKey,
				});
				// Note: no need to push to options here since it's done in the `pushToAcc` function
				// Since all options are pushed to the same path, they will be merged there on the options array
				// with the correct order as well getting the config reference from the accumulator by path
			}
		}

		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node,
		};
	}

	//NOTE: work on discriminated union is in progress

	if (schema instanceof z.ZodIntersection) {
		// **Left** is processed first so its metadata has lower priority than the right one
		zodResolverImpl(schema.def.left, {
			acc: ctx.acc,
			currentParentPth: currentParentPath,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersection-item": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParentPath]: 0, // TODO: Maybe add a function to generate the power set index if needed in the future
				},
			},
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		});

		// **Right** is processed second so its metadata has higher priority than the left one
		const right = zodResolverImpl(schema.def.right, {
			acc: ctx.acc,
			currentParentPth: currentParentPath,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersection-item": "right" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParentPath]: 1,
				},
			},
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		});

		// They will be merged in the `pushToAcc` function when adding to the accumulator by path
		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: right.node,
		};
	}
	/** End complex types **/

	// TODO: The following will have need to be handled properly in the future
	// - ZodEffects
	// - ZodPipeline
	// - ZodBranded
	// - ZodLazy
	// - ZodCatch
	// - ZodDefault
	// - ZodPromise
	// - ZodRecord
	// - ZodMap
	// - ZodSet
	// - ZodFunction
	// - ZodDiscriminatedUnion
	// - ZodBigInt
	// - ZodNever
	// - ZodVoid
	// - ZodSymbol

	if (schema instanceof z.ZodUnknown || schema instanceof z.ZodAny) {
		const config: ResolverConfigBase & UnknownLevel = {
			level: "unknown",
			path: currentParentPath,
			pathSegments: currentParentPathSegments,
			validate: async (value) => ({ result: { value } }), // Accept anything
		};
		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParentPath,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}

	// // For ZodEffects (transformations)
	// if (schema instanceof z.ZodEffects) {
	//   return zodResolverImpl(schema._def.schema, {
	//     ...ctx,
	//     // Note: You'll need to handle the transform/refine logic separately
	//   });
	// }

	console.warn("Unhandled schema type:", schema);
	// return ctx.acc;
	return {
		// paths: ctx.acc.paths,
		pathToNode: ctx.acc.pathToNode,
		node: pushToAcc({
			acc: ctx.acc,
			node: {
				[FIELD_CONFIG]: {
					level: "never",
					path: currentParentPath,
					pathSegments: currentParentPathSegments,
					validate() {
						throw new Error("Not implemented");
					},
				},
			},
			inheritedMetadata: ctx.inheritedMetadata,
			path: currentParentPath,
			schema,
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
		}).node,
	};
}

const schemaPathCache = new WeakMap<
	z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	{
		// paths: string[];
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
function zodResolver(
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	options: { skipCache?: boolean } = {},
): {
	// paths: string[];
	node: Record<string, TrieNode>;
} {
	// Preserving top-level cache only - no deeper than this to make sure we preserve the correct paths
	if (!options.skipCache && schemaPathCache.has(schema)) {
		return schemaPathCache.get(schema)!;
	}

	const rootNode: TrieNode = {
		[FIELD_CONFIG]: {
			level: "temp-root",
			path: "",
			pathSegments: [],
			validate() {
				throw new Error("Not implemented");
			},
		},
	};

	const result = zodResolverImpl(schema, {
		acc: {
			pathToNode: {},
			node: rootNode,
		},
		currentParentPth: "",
		currentParentPathSegments: [],
		inheritedMetadata: {},
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

console.log(
	z.object({
		name: z.string().min(0).max(10),
		userName: z.coerce.string().min(0).max(10),
		age: z.number().min(0).max(10),
		age2: z.number().lt(5).gt(1),
		age3: z.number().lte(5).gte(1),
		birthDate: z.date().min(0).max(10),
		birthDate2: z.coerce.date().min(0).max(10),
	}),
);

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
// You have TODOs for ZodEffects, ZodPipeline, ZodBranded, etc. Right now these would get lost → but they often contain the most important runtime logic.
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
