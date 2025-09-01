import z from "zod/v4";

export const name = "form-manager-resolver-zod";

const ARRAY_ITEM_TOKEN = "@@__ARRAY_ITEM__@@";
type FormValidationEvent = "input" | "blur" | "touch" | "submit";
interface FormManagerError<Path extends string> {
	/** The error message of the issue. */
	/* readonly */ message: string | null;
	/** The path of the issue, if any. */
	/* readonly */ path: Path; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	// /** The validation event that triggered the issue, if any. */
	// /* readonly */validationEvent: FormValidationEvent;
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

type Presence = "required" | "optional" | "nullable" | "nullish";

interface Level<LevelName extends string, Value = any> {
	level: LevelName;
	path: string;
	pathSegments: (string | number)[];
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
			paths: Set<string>;
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
	// 	optionIndex: number | null;
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
		type: "union-item";
		firstValidOptionIndex?: number;
	};
}

interface ResolverConfigBase {
	validate: (value: any) => Promise<ValidateReturnShape>;
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
	value: any,
	currentParent: string,
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>,
): Promise<ValidateReturnShape> {
	try {
		const result = await schema["~standard"].validate(value);

		if ("issues" in result && result.issues) {
			return {
				result: {
					issues: result.issues.map((issue) => ({
						message: issue.message,
						path: issue.path?.join(".") || currentParent,
					})),
				},
			};
		}

		if ("value" in result) {
			return { result: { value: result.value } };
		}

		// This case should never happen with proper Zod usage
		return {
			result: {
				issues: [{ message: "Unknown validation error", path: currentParent }],
			},
		};
	} catch (error) {
		// Handle sync validation errors
		return {
			result: {
				issues: [
					{
						message:
							error instanceof Error ? error.message : "Validation failed",
						path: currentParent,
					},
				],
			},
		};
	}
}

// const z = await import('https://unpkg.com/zod@latest?module')

interface InheritedMetadata {
	"intersection-item"?: {
		[path: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
	};
	"union-item-descendant"?: {
		paths: Set<string>;
	};
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
function updateIntersectionItemResolverConfigs(props: {
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
				// @ts-expect-error
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				// biome-ignore lint/suspicious/noTsIgnore: <explanation>
				return (props.acc.pathToNode[props.newConfig[FIELD_CONFIG].path][
					FIELD_CONFIG
				] = {
					level: "never",
					path: existingConfig[FIELD_CONFIG].path,
					pathSegments: existingConfig[FIELD_CONFIG].pathSegments,
					metadata: { ...existingConfig.metadata, "marked-never": true },
					validate: async () => ({
						result: {
							issues: [
								{
									message: "Incompatible intersection",
									path: existingConfig.path,
								},
							],
						},
						metadata: undefined,
					}),
				} satisfies ResolverConfigShape);
				// TODO:
				// Will need some special handling for incompatible intersection levels that are not primitives
				// Since they are incompatible, their children should be removed or marked as never as well
				// Maybe once we implement the `Trie` structure for the paths, it will be easier to handle this?!!
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

function pushToAcc(props: {
	path: string;
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	acc: ZodResolverAcc;
	node: TrieNode;
	currentAttributes?: CurrentAttributes;
	inheritedMetadata: InheritedMetadata;
}): ZodResolverAcc & { isNew: boolean } {
	let existingNode: TrieNode | undefined = props.acc.pathToNode[props.path];
	let isNew = true;

	if (existingNode && existingNode[FIELD_CONFIG].level !== "temp-root") {
		isNew = false;

		if (existingNode.metadata?.["intersection-item"]) {
			//
			existingNode = updateIntersectionItemResolverConfigs({
				acc: props.acc,
				existingConfig: existingNode,
				newConfig: props.node,
			});
		}

		if (
			existingNode[FIELD_CONFIG].level &&
			existingNode[FIELD_CONFIG].level === "union-item"
		) {
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
	if (props.currentAttributes || props.inheritedMetadata) {
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		const metadata = (newNode[FIELD_CONFIG].metadata ??= {});
		for (const key in props.currentAttributes) {
			// @ts-expect-error
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			metadata[key] = props.currentAttributes[key];
		}
		if (props.inheritedMetadata["intersection-item"]) {
			metadata["intersection-item"] =
				props.inheritedMetadata["intersection-item"];
		}

		if (props.inheritedMetadata["union-item-descendant"]) {
			const oldNode = newNode;
			newNode = {
				[FIELD_CONFIG]: {
					level: "union-item",
					options: [oldNode],
					path: oldNode[FIELD_CONFIG].path,
					pathSegments: oldNode[FIELD_CONFIG].pathSegments,
					metadata: {
						"union-item-descendant":
							props.inheritedMetadata["union-item-descendant"],
						...(oldNode.metadata || {}),
					},
					async validate(value): Promise<ValidateReturnShape> {
						for (let i = 0; i < this.options.length; i++) {
							const opt = this.options[i];
							if (!opt) {
								console.warn(`\`${this.path}.options[${i}]\` is undefined`);
								continue;
							}
							const { result } = await opt[FIELD_CONFIG].validate(value);
							if (!("issues" in result)) {
								return {
									result,
									metadata: { type: "union-item", firstValidOptionIndex: i },
								}; // success
							}
						}
						return {
							result: {
								issues: [
									{ message: "No union option matched", path: this.path },
								],
							},
							metadata: {
								type: "union-item",
								firstValidOptionIndex: undefined,
							},
						};
					},
				} satisfies ResolverConfigBase & UnionItemLevel,
			};
		}
	}

	// props.acc.paths.push(props.path);
	props.acc.pathToNode[props.path] = newNode;
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
		currentParent: string;
		currentParentSegments: (string | number)[];
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		acc: ZodResolverAcc;
		default?: any;
		optional?: boolean;
		nullable?: boolean;
		// isOptional?: boolean;
		// isNullable?: boolean;
	},
): ZodResolverAcc {
	const currentParent = ctx.currentParent;
	const currentParentSegments = ctx.currentParentSegments;
	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (schema instanceof z.ZodDefault) {
		const defaultValue = schema.def.defaultValue;
		schema = schema.def.innerType;
		return {
			// paths: ctx.acc.paths,
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
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: zodResolverImpl(schema.unwrap(), {
				...ctx,
				optional: true,
			}).node,
		};
	}
	if (schema instanceof z.ZodNullable) {
		return {
			// paths: ctx.acc.paths,
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
			path: currentParent,
			pathSegments: currentParentSegments,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
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
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				path: currentParent,
				schema,
				node: { [FIELD_CONFIG]: config },
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
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
			path: currentParent,
			pathSegments: currentParentSegments,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
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
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
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
			path: currentParent,
			pathSegments: currentParentSegments,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
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
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).node,
		};
	}
	if (schema instanceof z.ZodBoolean) {
		const config: ResolverConfigBase & BooleanPrimitiveLevel = {
			level: "primitive",
			type: "boolean",
			path: currentParent,
			pathSegments: currentParentSegments,
			presence: calcPresence(ctx),
			default: ctx.default,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
			coerce: schema.def.coerce,
		};
		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
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

		const tokenNextParent = currentParent
			? `${currentParent}.${ARRAY_ITEM_TOKEN}`
			: ARRAY_ITEM_TOKEN;
		const tokenNextParentSegments = [
			...currentParentSegments,
			ARRAY_ITEM_TOKEN,
		];
		const config: ResolverConfigBase & ArrayLevel = {
			level: "array",
			path: currentParent,
			pathSegments: currentParentSegments,
			presence: calcPresence(ctx),
			default: ctx.default,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
			// To make sure we also cover the array item token path
			items: zodResolverImpl(schema.element, {
				acc: ctx.acc,
				currentParent: tokenNextParent,
				currentParentSegments: tokenNextParentSegments,
				currentAttributes: { "array-token-item": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).node,
		};
		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).node,
		};
	}
	if (schema instanceof z.ZodObject) {
		const config: ResolverConfigBase & ObjectLevel = {
			level: "object",
			path: currentParent,
			pathSegments: currentParentSegments,
			presence: calcPresence(ctx),
			default: ctx.default,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
			shape: {}, // To be filled below
		};

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParent ? `${currentParent}.${key}` : key;
			const nextParentSegments = [...currentParentSegments, key];
			config.shape[key] = zodResolverImpl(shape[key], {
				acc: ctx.acc,
				currentParent: nextParent,
				currentParentSegments: nextParentSegments,
				currentAttributes: { "object-property": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).node;
		}

		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
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
		const config: ResolverConfigBase & TupleLevel = {
			level: "tuple",
			path: currentParent,
			pathSegments: currentParentSegments,
			presence: calcPresence(ctx),
			default: ctx.default,
			exactLength,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, schema);
			},
			items: new Array(schema.def.items.length).fill(null),
		};

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index]!;
			const indexedNextParent = currentParent
				? `${currentParent}.${index}`
				: String(index);
			const indexedNextParentSegments = [...currentParentSegments, index];

			config.items[index] = zodResolverImpl(item, {
				acc: ctx.acc,
				currentParent: indexedNextParent,
				currentParentSegments: indexedNextParentSegments,
				currentAttributes: { "tuple-direct-item": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).node;
		}

		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).node,
		};
	}

	// Q: How should the `currentAttributes` be handled for union-item and intersection-item? and should they be passed down to their children/resulting branches?

	if (
		schema instanceof z.ZodUnion
		// || schema instanceof z.ZodDiscriminatedUnion
	) {
		// collect all branches into one UnionItemLevel
		const config = {
			level: "union-item",
			path: currentParent,
			pathSegments: currentParentSegments,
			options: [],
			metadata: {
				"union-item-descendant": {
					paths: ctx.inheritedMetadata["union-item-descendant"]?.paths
						? new Set(ctx.inheritedMetadata["union-item-descendant"].paths)
						: new Set(),
				},
				...ctx.currentAttributes,
			} satisfies Level<any>["metadata"],
			async validate(value) {
				for (let i = 0; i < this.options.length; i++) {
					const opt = this.options[i];
					if (!opt) {
						console.warn(`\`${this.path}.options[${i}]\` is undefined`);
						continue;
					}
					const { result } = await opt[FIELD_CONFIG].validate(value);
					if (!("issues" in result)) {
						return {
							result,
							metadata: { type: "union-item", firstValidOptionIndex: i },
						}; // success
					}
				}
				return {
					result: {
						issues: [{ message: "No union option matched", path: this.path }],
					},
					metadata: { type: "union-item", firstValidOptionIndex: undefined },
				};
			},
		} satisfies ResolverConfigBase & UnionItemLevel;
		config.metadata["union-item-descendant"].paths.add(currentParent);

		const node = pushToAcc({
			acc: ctx.acc,
			node: { [FIELD_CONFIG]: config },
			path: currentParent,
			schema,
			currentAttributes: ctx.currentAttributes,
			inheritedMetadata: ctx.inheritedMetadata,
		}).node;

		for (let index = 0; index < schema.options.length; index++) {
			const opt = schema.options[index];
			if (opt) {
				zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParent,
					currentParentSegments: currentParentSegments,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						"union-item-descendant": {
							paths: ctx.inheritedMetadata["union-item-descendant"]
								? new Set(ctx.inheritedMetadata["union-item-descendant"].paths)
								: new Set(),
						},
					},
					currentAttributes: { ...ctx.currentAttributes },
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

	// TODO: Since we know that from this point on it will be an intersection, we can collect all path to the next parts in case we need to do some special handling for recursive marking as never or other stuff
	// Or just leave it as is and handle when refactoring to Trie structures
	if (schema instanceof z.ZodIntersection) {
		// **Left** is processed first so its metadata has lower priority than the right one
		zodResolverImpl(schema.def.left, {
			acc: ctx.acc,
			currentParent,
			currentParentSegments: currentParentSegments,
			// currentAttributes: { "intersection-item": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParent]: 0, // TODO: Maybe add a function to generate the power set index if needed in the future
				},
			},
			currentAttributes: ctx.currentAttributes,
		});

		// **Right** is processed second so its metadata has higher priority than the left one
		const right = zodResolverImpl(schema.def.right, {
			acc: ctx.acc,
			currentParent,
			currentParentSegments: currentParentSegments,
			// currentAttributes: { "intersection-item": "right" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParent]: 1,
				},
			},
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
			path: currentParent,
			pathSegments: currentParentSegments,
			validate: async (value) => ({ result: { value } }), // Accept anything
		};
		return {
			// paths: ctx.acc.paths,
			pathToNode: ctx.acc.pathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [FIELD_CONFIG]: config },
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
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
					path: currentParent,
					pathSegments: currentParentSegments,
					validate() {
						throw new Error("Not implemented");
					},
				},
			},
			inheritedMetadata: ctx.inheritedMetadata,
			path: currentParent,
			schema,
			currentAttributes: ctx.currentAttributes,
		}).node,
	};
}

// Consider memoization
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

	const result = zodResolverImpl(schema, {
		acc: {
			pathToNode: {},
			node: {
				[FIELD_CONFIG]: {
					level: "temp-root",
					path: "",
					pathSegments: [],
					validate() {
						throw new Error("Not implemented");
					},
				},
			},
		},
		currentParent: "",
		currentParentSegments: [],
		inheritedMetadata: {},
	});
	schemaPathCache.set(schema, result);
	return result;
}

// TODO: Inconsistent naming: Mix of levelConfig, resolverConfig, newLevelConfig
// TODO: Complex nested conditionals: The primitive type handling is repetitive

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

//
// Notes
// Union & Intersection merging
// Right now, you have TODOs around merging union-item and intersection-item metadata/config. This is a big one:
// Union: each path should map to multiple possible schemas. You’ll need either an options: ResolverConfigShape[] array or a tagged type.
// Intersection: each path should merge all constraints. But min/max collisions or type incompatibilities can’t always be resolved statically. You may need a dual left/right config like you started.
// If you skip this, you’ll get misleading metadata (union-item path may appear stricter/looser than reality).
// Effects / Transformations / Refinements
// You have TODOs for ZodEffects, ZodPipeline, ZodBranded, etc. Right now these would get lost → but they often contain the most important runtime logic.
// E.g. z.string().refine(isEmail) → your minLength/maxLength extraction looks fine, but the real validation logic lives in .refine. If you drop it, you’ll end up with false positives in your form.
// Over-aggressive Regex for Enum/Literal
// You’re converting literals/enums into regex patterns:
// regex = new RegExp(`^${schema._zod.def.values.join("|")}$`)
// That works but:
// ZodEnum is already enumerable — you can just set metadata.enum = [...].
// Regex for complex literals (esp. string with special chars) could break. Better to keep both: enum: [...] and maybe regex if you want a fast HTML-native pattern.

// 🕳️ The Ugly (Hidden Traps)
//
// Zod private internals (schema._zod.def, check._zod)
// You’re digging into Zod’s private defs. That’s not stable across versions (v4 → v5 will probably break).
// 👉 Safer: use Zod’s .describe(), .isOptional(), .isNullable(), or PR a feature upstream to expose richer metadata. Otherwise, you’ll constantly be chasing internal refactors.
//
// Validation result path mismatch
// You’re mapping issue.path.join(".") to currentParent, but Zod sometimes returns array indices (e.g. ["addresses", 0, "street"]). Joining with "." is fine, but doesn’t align with your @@__ARRAY_ITEM__@@ abstraction.
// 👉 You’ll need a mapping layer: ["addresses", number, "street"] → addresses.${ARRAY_ITEM_TOKEN}.street.
//
// Schema identity cache
// Using WeakMap<ZodType, ResolverResult> means two semantically identical schemas created separately will produce two different caches. That’s fine for perf but makes caching less predictable if users build schemas dynamically each render. You might need hash-based memoization for serious perf scenarios.
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
// That way you don’t just flatten into metadata — you preserve the recursive structure.
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
// That’ll let you plug into <input> without writing custom logic later.
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
// But don’t mix them. It’ll simplify downstream consumers.

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
			) => Promise<{ optionIndex: number; snapshot?: ResolvedOptionSnapshot }>;
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
