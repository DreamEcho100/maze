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

interface Level<LevelName extends string, Value = any> {
	level: LevelName;
	path: string;
	required?: boolean;
	default?: Value;
	metadata?: {
		[key in
			| "optional"
			| "nullable"
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
	shape: Record<string, ResolverConfigShape>;
}
interface ArrayLevel extends Level<"array", any[]> {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	items: ResolverConfigShape; // Need to find a way to reference the main type here
}
interface TupleLevel extends Level<"tuple", any[]> {
	required?: boolean;
	exactLength?: number;
	minLength?: number;
	maxLength?: number;
	items: ResolverConfigShape[];
}
interface UnionItemLevel extends Level<"union-item"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
	// validateToOption: (value: any) => Promise<{
	// 	optionIndex: number | null;
	// 	result: ValidationResult<string, any>;
	// }>;
	options: ResolverConfigShape[];
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
		firstValidOption?: number;
	};
}

interface ResolverConfigBase {
	validate: (value: any) => Promise<ValidateReturnShape>;
}

type ResolverConfigShape = ResolverConfigBase &
	(
		| TempRootLevel
		| NeverLevel
		| PrimitiveLevel
		| ObjectLevel
		| ArrayLevel
		| TupleLevel
		| UnionItemLevel
	);

async function customValidate(
	value: any,
	currentParent: string,
	acc: {
		schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	},
): Promise<ValidateReturnShape> {
	try {
		const result = await acc.schema["~standard"].validate(value);

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

/**
 * Update it on the `pathToResolverConfig` by using the `path`
 * @warning it's not accounting for "union-item" yet or recursive compatible intersections
 */
function updateIntersectionItemResolverConfigs(props: {
	acc: {
		paths: string[];
		pathToResolverConfig: Record<string, ResolverConfigShape>;
	};
	existingConfig?: ResolverConfigShape;
	newConfig: ResolverConfigShape;
}): ResolverConfigShape {
	const existingConfig = props.existingConfig;
	if (existingConfig) {
		if (
			existingConfig.level === props.newConfig.level &&
			(existingConfig.level !== "primitive" ||
				(existingConfig.level === "primitive" &&
					existingConfig.type ===
						(props.newConfig as ResolverConfigShape & PrimitiveLevel).type))
		) {
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			return (props.acc.pathToResolverConfig[props.newConfig.path] = {
				...existingConfig,
				...props.newConfig,
				// validate: props.newConfig.validate,
			} as ResolverConfigShape);

			// return;
		} else {
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			return (props.acc.pathToResolverConfig[props.newConfig.path] = {
				...existingConfig,
				level: "never",
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
			// return;
		}
	}

	props.acc.pathToResolverConfig[props.newConfig.path] = props.newConfig;
	props.acc.paths.push(props.newConfig.path);
	return props.newConfig;
}

function pushToAcc(props: {
	path: string;
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	acc: {
		paths: string[];
		pathToResolverConfig: Record<string, ResolverConfigShape>;
	};
	levelConfig: ResolverConfigShape;
	currentAttributes?: CurrentAttributes;
	inheritedMetadata: InheritedMetadata;
}): { resolverConfig: ResolverConfigShape; isNew: boolean } {
	let existingLevelConfig: ResolverConfigShape | undefined =
		props.acc.pathToResolverConfig[props.path];
	let isNew = true;

	if (existingLevelConfig && existingLevelConfig.level !== "temp-root") {
		isNew = false;

		if (existingLevelConfig.metadata?.["intersection-item"]) {
			//
			existingLevelConfig = updateIntersectionItemResolverConfigs({
				acc: props.acc,
				existingConfig: existingLevelConfig,
				newConfig: props.levelConfig,
			});
		}

		if (
			existingLevelConfig.level &&
			existingLevelConfig.level === "union-item"
		) {
			// Merge union-item options
			const itemsToPush =
				props.levelConfig.level === "union-item"
					? props.levelConfig.options
					: [props.levelConfig];
			existingLevelConfig.options.push(...itemsToPush);
		}

		return { resolverConfig: existingLevelConfig, isNew };
	}

	let newLevelConfig = props.levelConfig;
	if (props.currentAttributes || props.inheritedMetadata) {
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		const metadata = (newLevelConfig.metadata ??= {});
		for (const key in props.currentAttributes) {
			// @ts-expect-error
			metadata[key] = props.currentAttributes[key];
		}
		if (props.inheritedMetadata["intersection-item"]) {
			metadata["intersection-item"] =
				props.inheritedMetadata["intersection-item"];
		}

		if (props.inheritedMetadata["union-item-descendant"]) {
			const oldLevelConfig = newLevelConfig;
			newLevelConfig = {
				level: "union-item",
				options: [oldLevelConfig],
				path: props.path,
				metadata: {
					"union-item-descendant":
						props.inheritedMetadata["union-item-descendant"],
					...(oldLevelConfig.metadata || {}),
				},
				async validate(value): Promise<ValidateReturnShape> {
					for (let i = 0; i < this.options.length; i++) {
						const opt = this.options[i];
						if (!opt) {
							console.warn(`\`${this.path}.options[${i}]\` is undefined`);
							continue;
						}
						const { result } = await opt.validate(value);
						if (!("issues" in result)) {
							return {
								result,
								metadata: { type: "union-item", firstValidOption: i },
							}; // success
						}
					}
					return {
						result: {
							issues: [{ message: "No union option matched", path: this.path }],
						},
						metadata: {
							type: "union-item",
							firstValidOption: undefined,
						},
					};
				},
			} satisfies ResolverConfigBase & UnionItemLevel;
		}
	}

	props.acc.pathToResolverConfig[props.path] = newLevelConfig;
	props.acc.paths.push(props.path);
	return { resolverConfig: newLevelConfig, isNew };
}

// Consider memoization
const schemaPathCache = new WeakMap<
	z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	{
		paths: string[];
		pathToResolverConfig: Record<string, ResolverConfigShape>;
	}
>();

interface CurrentAttributes {
	optional?: boolean;
	nullable?: boolean;
	// //
	// object?: boolean;
	// array?: boolean;
	// tuple?: boolean;
	//
	"object-property"?: boolean;
	"array-item"?: boolean;
	"array-token-item"?: boolean;
	"tuple-direct-item"?: boolean;
	//
	// "intersection-item": "left";
	// "intersection-item": "right";
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
`inheritedMetadata` is needed for properly handling and passing `intersection-item` and `union-item` metadata to the needed path because they can be defined at a higher level and need to be passed down to apply them properly
*/
function zodResolverImpl(
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	ctx: {
		currentParent: string;
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		acc: {
			paths: string[];
			pathToResolverConfig: Record<string, ResolverConfigShape>;
			resolverConfig: ResolverConfigShape;
		};
		default?: any;
		// isOptional?: boolean;
		// isNullable?: boolean;
	},
): {
	paths: string[];
	pathToResolverConfig: Record<string, ResolverConfigShape>;
	finalResolverConfig: ResolverConfigShape;
} {
	const currentParent = ctx.currentParent;
	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (schema instanceof z.core.$ZodDefault) {
		schema = schema._zod.def.innerType;
		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: zodResolverImpl(schema, {
				...ctx,
				acc: ctx.acc,
				currentParent,
				default: schema._zod.def.defaultValue,
			}).finalResolverConfig,
		};
	}
	if (schema instanceof z.ZodOptional) {
		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: zodResolverImpl(schema.unwrap(), {
				...ctx,
				acc: ctx.acc,
				currentParent,
				currentAttributes: { ...ctx.currentAttributes, optional: true },
			}).finalResolverConfig,
		};
	}
	if (schema instanceof z.ZodNullable) {
		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: zodResolverImpl(schema.unwrap(), {
				...ctx,
				acc: ctx.acc,
				currentParent,
				currentAttributes: { ...ctx.currentAttributes, nullable: true },
			}).finalResolverConfig,
		};
	}
	/* End unwrap **/

	/** Handle primitives **/
	if (
		schema instanceof z.ZodString ||
		schema instanceof z.ZodLiteral ||
		schema instanceof z.ZodEnum
	) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		let minLength: number | undefined;
		let maxLength: number | undefined;
		let regex: RegExp | undefined;
		// const coerce = schema instanceof z.ZodString && schema._zod.def.coerce;
		let coerce: boolean | undefined;

		if (schema instanceof z.ZodLiteral) {
			regex = new RegExp(
				`^${schema._zod.def.values
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
				`^${Object.values(schema._zod.def.entries)
					.map((v) =>
						// Need to escape special regex characters if the enum value is a string
						typeof v === "string"
							? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
							: String(v),
					)
					.join("|")}$`,
			);
		} else {
			coerce = schema._zod.def.coerce;
			if (schema._zod.def.checks) {
				for (const check of schema._zod.def.checks) {
					const _zod = check._zod;
					if (_zod instanceof z.core.$ZodCheckMinLength) {
						minLength = _zod._zod.def.minimum as number;
					} else if (_zod instanceof z.core.$ZodCheckMaxLength) {
						maxLength = _zod._zod.def.maximum as number;
					} else if (_zod instanceof z.core.$ZodCheckRegex) {
						regex = _zod._zod.def.pattern;
					}
				}
			}
		}

		const levelConfig: ResolverConfigBase & StringPrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "string",
			required: isRequired,
			default: ctx.default,
			minLength,
			maxLength,
			regex,
			coerce,
		};

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				path: currentParent,
				schema,
				levelConfig,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	if (schema instanceof z.ZodNumber) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		let min: number | undefined;
		let max: number | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		const int: boolean | undefined = false;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				const _zod = check._zod;
				if (_zod instanceof z.core.$ZodCheckLessThan) {
					max = _zod._zod.def.value as number;
					inclusiveMax = _zod._zod.def.inclusive;
				} else if (_zod instanceof z.core.$ZodCheckGreaterThan) {
					min = _zod._zod.def.value as number;
					inclusiveMin = _zod._zod.def.inclusive;
				}
			}
		}

		const levelConfig: ResolverConfigBase & NumberPrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "number",
			required: isRequired,
			default: ctx.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			int,
			coerce: schema.def.coerce,
		};

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	if (schema instanceof z.ZodDate) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		let min: Date | undefined;
		let max: Date | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				const _zod = check._zod;
				if (_zod instanceof z.core.$ZodCheckLessThan) {
					max = _zod._zod.def.value as Date;
					inclusiveMax = _zod._zod.def.inclusive;
				} else if (_zod instanceof z.core.$ZodCheckGreaterThan) {
					min = _zod._zod.def.value as Date;
					inclusiveMin = _zod._zod.def.inclusive;
				}
			}
		}
		const levelConfig: ResolverConfigBase & DatePrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "date",
			required: isRequired,
			default: ctx.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			coerce: schema.def.coerce,
		};

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	if (schema instanceof z.ZodBoolean) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		const levelConfig: ResolverConfigBase & BooleanPrimitiveLevel = {
			level: "primitive",
			type: "boolean",
			path: currentParent,
			required: isRequired,
			default: ctx.default,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			coerce: schema.def.coerce,
		};
		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	/** End primitives **/

	/** Handle complex types **/
	if (schema instanceof z.ZodArray) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		let minLength: number | undefined;
		let maxLength: number | undefined;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				const _zod = check._zod;
				if (_zod instanceof z.core.$ZodCheckMinLength) {
					minLength = _zod._zod.def.minimum as number;
				} else if (_zod instanceof z.core.$ZodCheckMaxLength) {
					maxLength = _zod._zod.def.maximum as number;
				}
			}
		}

		const tokenNextParent = currentParent
			? `${currentParent}.${ARRAY_ITEM_TOKEN}`
			: ARRAY_ITEM_TOKEN;
		const levelConfig: ResolverConfigBase & ArrayLevel = {
			level: "array",
			path: currentParent,
			required: isRequired,
			default: ctx.default,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			// To make sure we also cover the array item token path
			items: zodResolverImpl(schema.element, {
				acc: ctx.acc,
				currentParent: tokenNextParent,
				currentAttributes: { "array-token-item": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).finalResolverConfig,
		};
		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	if (schema instanceof z.ZodObject) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
		const levelConfig: ResolverConfigBase & ObjectLevel = {
			level: "object",
			path: currentParent,
			required: isRequired,
			default: ctx.default,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			shape: {}, // To be filled below
		};

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParent ? `${currentParent}.${key}` : key;
			levelConfig.shape[key] = zodResolverImpl(shape[key], {
				acc: ctx.acc,
				currentParent: nextParent,
				currentAttributes: { "object-property": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).finalResolverConfig;
		}

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	if (schema instanceof z.ZodTuple) {
		const isRequired =
			!ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
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
		const levelConfig: ResolverConfigBase & TupleLevel = {
			level: "tuple",
			path: currentParent,
			required: isRequired,
			default: ctx.default,
			exactLength,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			items: new Array(schema.def.items.length).fill(null) as any[],
		};

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index]!;
			const indexedNextParent = currentParent
				? `${currentParent}.${index}`
				: String(index);

			levelConfig.items[index] = zodResolverImpl(item, {
				acc: ctx.acc,
				currentParent: indexedNextParent,
				currentAttributes: { "tuple-direct-item": true },
				inheritedMetadata: ctx.inheritedMetadata,
			}).finalResolverConfig;
		}

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}
	// // unions, intersections, etc. - recurse into options
	// if (schema instanceof z.ZodUnion) {
	// 	const isRequired = !ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
	// 	const levelConfig: ResolverConfigBase & UnionLevel = {
	// 		level: "union",
	// 		path: currentParent,
	// 		required: isRequired,
	// 		default: ctx.default,
	// 		validate(value) {
	// 			return customValidate(value, currentParent, { schema });
	// 		},
	// 		options: new Array(schema.options.length).fill(null) as any[],
	// 	};

	// 	// TODO: How to populate the options properly?
	// 	for (let index = 0; index < schema.options.length; index++) {
	// 		const opt = schema.options[index];
	// 		if (opt) {
	// 			zodResolverImpl(opt, {
	// 				acc: ctx.acc,
	// 				currentParent,
	// 				inheritedMetadata: ctx.inheritedMetadata,
	// 			});
	// 		}
	// 	}
	// 	return {
	// 		paths: ctx.acc.paths,
	// 		pathToResolverConfig: ctx.acc.pathToResolverConfig,
	// 		finalResolverConfig: pushToAcc({
	// 			acc: ctx.acc,
	// 			levelConfig,
	// 			path: currentParent,
	// 			schema,
	// 			metadata: ctx.metadata,
	// 			inheritedMetadata: ctx.inheritedMetadata,
	// 		}).resolverConfig,
	// 	};
	// }

	// if (schema instanceof z.ZodDiscriminatedUnion) {
	// 	const isRequired = !ctx.currentAttributes?.optional && !ctx.currentAttributes?.nullable;
	// 	// Get discriminator and its possible values
	// 	const discriminator = schema._zod.discriminator;
	// }

	if (
		schema instanceof z.ZodUnion
		// || schema instanceof z.ZodDiscriminatedUnion
	) {
		const metadata = {
			"union-item-descendant": {
				paths: ctx.inheritedMetadata["union-item-descendant"]
					? new Set(ctx.inheritedMetadata["union-item-descendant"].paths)
					: new Set(),
			},
			...ctx.currentAttributes,
		} satisfies Level<any>["metadata"];
		// collect all branches into one UnionItemLevel
		const options: ResolverConfigShape[] = [];
		metadata["union-item-descendant"].paths.add(currentParent);
		// // Each option is processed and added to the accumulator
		// const options: ResolverConfigShape[] = [];
		for (let index = 0; index < schema.options.length; index++) {
			const opt = schema.options[index];
			if (opt) {
				const result = zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParent,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						"union-item-descendant": {
							paths: ctx.inheritedMetadata["union-item-descendant"]
								? new Set(ctx.inheritedMetadata["union-item-descendant"].paths)
								: new Set(),
						},
					},
					currentAttributes: { ...ctx.currentAttributes },
				}).finalResolverConfig;
				options.push(result);
			}
		}
		const levelConfig: ResolverConfigBase & UnionItemLevel = {
			level: "union-item",
			path: currentParent,
			options: options,
			metadata,
			async validate(value) {
				for (let i = 0; i < this.options.length; i++) {
					const opt = this.options[i];
					if (!opt) {
						console.warn(`\`${this.path}.options[${i}]\` is undefined`);
						continue;
					}
					const { result } = await opt.validate(value);
					if (!("issues" in result)) {
						return { result }; // success
					}
				}
				return {
					result: {
						issues: [{ message: "No union option matched", path: this.path }],
					},
				};
			},
		};

		return {
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: pushToAcc({
				acc: ctx.acc,
				levelConfig,
				path: currentParent,
				schema,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
			}).resolverConfig,
		};
	}

	if (schema instanceof z.ZodIntersection) {
		// **Left** is processed first so its metadata has lower priority than the right one
		zodResolverImpl(schema.def.left, {
			acc: ctx.acc,
			currentParent,
			// currentAttributes: { "intersection-item": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				"intersection-item": {
					...(ctx.inheritedMetadata?.["intersection-item"] || {}),
					[currentParent]: 0, // TODO: Maybe add a function to generate the power set index if needed in the future
				},
			},
		});
		// **Right** is processed second so its metadata has higher priority than the left one
		const right = zodResolverImpl(schema.def.right, {
			acc: ctx.acc,
			currentParent,
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
			paths: ctx.acc.paths,
			pathToResolverConfig: ctx.acc.pathToResolverConfig,
			finalResolverConfig: right.finalResolverConfig,
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
	// - ZodNativeEnum
	// - ZodBigInt
	// - ZodNativeEnum
	// - ZodNever
	// - ZodUnknown
	// - ZodAny
	// - ZodVoid
	// - ZodSymbol

	console.warn("Unhandled schema type:", schema);
	// return ctx.acc;
	return {
		paths: ctx.acc.paths,
		pathToResolverConfig: ctx.acc.pathToResolverConfig,
		finalResolverConfig: pushToAcc({
			acc: ctx.acc,
			levelConfig: {
				level: "never",
				path: currentParent,
				validate() {
					throw new Error("Not implemented");
				},
			},
			inheritedMetadata: ctx.inheritedMetadata,
			path: currentParent,
			schema,
			currentAttributes: ctx.currentAttributes,
		}).resolverConfig,
	};
}

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
	paths: string[];
	pathToResolverConfig: Record<string, ResolverConfigShape>;
} {
	if (!options.skipCache && schemaPathCache.has(schema)) {
		return schemaPathCache.get(schema)!;
	}

	const result = zodResolverImpl(schema, {
		acc: {
			paths: [],
			pathToResolverConfig: {},
			resolverConfig: {
				level: "temp-root",
				path: "",
				metadata: {},
				validate() {
					throw new Error("Not implemented");
				},
			},
		},
		currentParent: "",
		inheritedMetadata: {},
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
