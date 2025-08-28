import z from "zod/v4";

export const name = "form-manager-resolver-zod";

const ARRAY_ITEM_TOKEN = "@@__ARRAY_ITEM__@@";
type FormValidationEvent = "input" | "blur" | "touch" | "submit";
interface FormManagerError<Path extends string> {
	/** The error message of the issue. */
	readonly message: string | null;
	/** The path of the issue, if any. */
	readonly path: Path; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	// /** The validation event that triggered the issue, if any. */
	// readonly validationEvent: FormValidationEvent;
}
interface SuccessResult<Output> {
	/** The typed output value. */
	readonly value: Output;
	/** The non-existent issues. */
	readonly issues?: undefined;
}
/** The result interface if validation fails. */
interface FailureResult<Path extends string> {
	/** The issues of failed validation. */
	readonly issues: ReadonlyArray<FormManagerError<Path>>;
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
			| "union-item"
			| "object-property"
			| "tuple-item"
			| "array-token-item"]?: boolean;
	} & {
		"intersection-item"?: {
			[path: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
		};
	};
}
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
	// shape: Record<string, ResolverConfigShape>; // Need to find a way to reference the main type here
}
interface ArrayLevel extends Level<"array", any[]> {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
}
interface TupleLevel extends Level<"tuple", any[]> {
	required?: boolean;
	exactLength?: number;
	minLength?: number;
	maxLength?: number;
}
interface UnionLevel extends Level<"union"> {
	// options: ResolverConfigShape[]; // Need to find a way to reference the main type here
}
interface IntersectionLevel extends Level<"intersection"> {
	// left: ResolverConfigShape; // Need to find a way to reference the main type here
	// right: ResolverConfigShape; // Need to find a way to reference the main type here
	left: (value: any) => Promise<ValidationResult<string, any>>;
	right: (value: any) => Promise<ValidationResult<string, any>>;
}

interface ResolverConfigBase {
	path: string;
	validate: (value: any) => Promise<ValidationResult<string, any>>;
}

type ResolverConfigShape = ResolverConfigBase &
	(
		| NeverLevel
		| PrimitiveLevel
		| ObjectLevel
		| ArrayLevel
		| TupleLevel
		| UnionLevel
		| IntersectionLevel
	);

async function customValidate(
	value: any,
	currentParent: string,
	acc: {
		schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	},
) {
	try {
		const result = await acc.schema["~standard"].validate(value);

		if ("issues" in result && result.issues) {
			return {
				issues: result.issues.map((issue) => ({
					message: issue.message,
					path: issue.path?.join(".") || currentParent,
				})),
			};
		}

		if ("value" in result) {
			return { value: result.value };
		}

		// This case should never happen with proper Zod usage
		return {
			issues: [{ message: "Unknown validation error", path: currentParent }],
		};
	} catch (error) {
		// Handle sync validation errors
		return {
			issues: [
				{
					message: error instanceof Error ? error.message : "Validation failed",
					path: currentParent,
				},
			],
		};
	}
}

// const z = await import('https://unpkg.com/zod@latest?module')

interface InheritMetadata {
	"intersection-item"?: {
		[path: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
	};
	"union-item"?: {
		[path: string]: {
			discriminator?: string;
			branchValue?: string | number | boolean | null;
			branchIndex?: number;
		};
	};
}

function pushToAcc(props: {
	path: string;
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>;
	acc: {
		paths: string[];
		pathToResolverConfig: Record<string, ResolverConfigShape>;
	};
	levelConfig: ResolverConfigShape;
	metadata?: Record<string, any>;
	inheritMetadata: InheritMetadata;
}) {
	let levelConfig: ResolverConfigShape | undefined =
		props.acc.pathToResolverConfig[props.path];
	let isNew = true;

	if (levelConfig) {
		isNew = false;
		// already exists
		// This could happen here because:
		// 1. It was already processed because of recursion (e.g. optional, nullable, effects, etc.)
		// 2. It was part of a union or intersection and then we processed it again
		// 3. It was part of an array and then we processed the array item token
		// In those cases, we might want to
		// - For `1`, we want will keep the existing config as is, because it already has the correct schema and validation, but we might want to update the metadata.
		// - For `2` and `3`, we might want to merge the existing config with the new one, but how exactly? maybe some definitions and logic need to be adjusted to be able to validate properly?!!
		//	 - For unions, we might want to create a new `union-item` config that contains both the existing and the new one as options
		//	 - For intersections, we might want to create a new `intersection-item` config that contains both the existing and the new one as left and right

		if (props.metadata) {
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			const metadata = (levelConfig.metadata ??= {});
			for (const key in props.metadata) {
				metadata[key] = props.metadata[key];
			}
		}

		// if (levelConfig.metadata["union-item"]) {
		// 	// merge options
		// 	// How to merge options?
		// }

		const pathIntersectionItemConfig =
			levelConfig.metadata["intersection-item"][props.path];
		const newIntersectionItemConfig =
			props.inheritMetadata["intersection-item"]?.[props.path];
		if (pathIntersectionItemConfig) {
			// TODO:
			// Need to adjust the existing code so there be a level of intersection-item
			// And has the `branches` property that contains the different branches
			// And resolve them with zod's `intersect` method and validate them properly
		}

		return { resolverConfig: levelConfig, isNew };
	}

	if (levelConfig.metadata["union-item"]) {
		// merge options
		// How to merge options?
	} else if (props.inheritMetadata["intersection-item"]) {
		levelConfig.metadata = {
			...levelConfig.metadata,
			"intersection-item": props.inheritMetadata["intersection-item"],
		};
	}

	levelConfig = props.levelConfig satisfies ResolverConfigShape;
	if (props.metadata) {
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		const metadata = (levelConfig.metadata ??= {});
		for (const key in props.metadata) {
			metadata[key] = props.metadata[key];
		}
	}

	props.acc.pathToResolverConfig[props.path] = levelConfig;
	props.acc.paths.push(props.path);
	return { resolverConfig: levelConfig, isNew };
}

// Consider memoization
const schemaPathCache = new WeakMap<
	z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	{
		paths: string[];
		pathToResolverConfig: Record<string, ResolverConfigShape>;
	}
>();

function zodResolverImpl(
	schema: z.ZodTypeAny | z.core.$ZodType<any, any, any>,
	ctx: {
		currentParent: string;
		metadata?: Record<string, any>;
		inheritMetadata: InheritMetadata;
		acc: {
			paths: string[];
			pathToResolverConfig: Record<string, ResolverConfigShape>;
		};
		default?: any;
		isOptional?: boolean;
		isNullable?: boolean;
	},
): {
	paths: string[];
	pathToResolverConfig: Record<string, ResolverConfigShape>;
} {
	const currentParent = ctx.currentParent || "";
	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (schema instanceof z.core.$ZodDefault) {
		// unwrap default to get the actual schema
		// defaultValue = schema._zod.def.defaultValue
		schema = schema._zod.def.innerType;
		zodResolverImpl(schema, {
			acc: ctx.acc,
			currentParent,
			...ctx,
			default: schema._zod.def.defaultValue,
		});
		return ctx.acc;
	}
	if (schema instanceof z.ZodOptional) {
		zodResolverImpl(schema.unwrap(), {
			acc: ctx.acc,
			currentParent,
			...ctx,
			metadata: { ...(ctx?.metadata || {}), optional: true },
			isOptional: true,
		});
		return ctx.acc;
	}
	if (schema instanceof z.ZodNullable) {
		zodResolverImpl(schema.unwrap(), {
			acc: ctx.acc,
			currentParent,
			...ctx,
			metadata: { ...(ctx?.metadata || {}), nullable: true },
			isNullable: true,
		});
		return ctx.acc;
	}
	/* End unwrap **/

	/** Handle primitives **/
	if (
		schema instanceof z.ZodString ||
		schema instanceof z.ZodLiteral ||
		schema instanceof z.ZodEnum
	) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		let minLength: number | undefined;
		let maxLength: number | undefined;
		let regex: RegExp | undefined;
		// const coerce = schema instanceof z.ZodString && schema._zod.def.coerce;
		let coerce = false;

		if (schema instanceof z.ZodLiteral) {
			regex = new RegExp(`^${schema._zod.def.values.join("|")}$`);
		} else if (schema instanceof z.ZodEnum) {
			regex = new RegExp(
				`^${Object.values(schema._zod.def.entries).join("|")}$`,
			);
		} else {
			coerce = schema._zod.def.coerce;
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

		const levelConfig: ResolverConfigBase & StringPrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "string",
			required: isRequired,
			default: ctx?.default,
			minLength,
			maxLength,
			regex,
			coerce,
		};

		pushToAcc({
			acc: ctx.acc,
			path: currentParent,
			schema,
			levelConfig,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});
		return ctx.acc;
	}
	if (schema instanceof z.ZodNumber) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		let min: number | undefined;
		let max: number | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		const int: boolean | undefined = false;
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

		const levelConfig: ResolverConfigBase & NumberPrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "number",
			required: isRequired,
			default: ctx?.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			int,
			coerce: schema.def.coerce,
		};

		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		return ctx.acc;
	}
	if (schema instanceof z.ZodDate) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		let min: Date | undefined;
		let max: Date | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
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
		const levelConfig: ResolverConfigBase & DatePrimitiveLevel = {
			path: currentParent,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			level: "primitive",
			type: "date",
			required: isRequired,
			default: ctx?.default,
			min,
			max,
			inclusiveMin,
			inclusiveMax,
			coerce: schema.def.coerce,
		};

		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		return ctx.acc;
	}
	if (schema instanceof z.ZodBoolean) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		const levelConfig: ResolverConfigBase & BooleanPrimitiveLevel = {
			level: "primitive",
			type: "boolean",
			path: currentParent,
			required: isRequired,
			default: ctx?.default,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
			coerce: schema.def.coerce,
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});
		return ctx.acc;
	}
	/** End primitives **/

	/** Handle complex types **/
	if (schema instanceof z.ZodArray) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		let minLength: number | undefined;
		let maxLength: number | undefined;
		for (const check of schema.def.checks) {
			const _zod = check._zod;
			if (_zod instanceof z.core.$ZodCheckMinLength) {
				minLength = _zod._zod.def.minimum as number;
			} else if (_zod instanceof z.core.$ZodCheckMaxLength) {
				maxLength = _zod._zod.def.maximum as number;
			}
		}

		const levelConfig: ResolverConfigBase & ArrayLevel = {
			level: "array",
			path: currentParent,
			required: isRequired,
			default: ctx?.default,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		const tokenNextParent = currentParent
			? `${currentParent}.${ARRAY_ITEM_TOKEN}`
			: ARRAY_ITEM_TOKEN;
		// To make sure we also cover the array item token path
		zodResolverImpl(schema.element, {
			acc: ctx.acc,
			currentParent: tokenNextParent,
			metadata: { "array-item": true, "array-token-item": true },
			inheritMetadata: ctx.inheritMetadata,
		});
		return ctx.acc;
	}
	if (schema instanceof z.ZodObject) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		const levelConfig: ResolverConfigBase & ObjectLevel = {
			level: "object",
			path: currentParent,
			required: isRequired,
			default: ctx?.default,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		const shape = schema.shape;
		for (const key in shape) {
			const nextParent = currentParent ? `${currentParent}.${key}` : key;
			zodResolverImpl(shape[key], {
				acc: ctx.acc,
				currentParent: nextParent,
				metadata: { object: true, "object-property": true },
				inheritMetadata: ctx.inheritMetadata,
			});
		}
		return ctx.acc;
	}
	if (schema instanceof z.ZodTuple) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
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
			default: ctx?.default,
			exactLength,
			minLength,
			maxLength,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		const items = schema.def.items;
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const indexedNextParent = currentParent
				? `${currentParent}.${index}`
				: String(index);

			zodResolverImpl(item, {
				acc: ctx.acc,
				currentParent: indexedNextParent,
				metadata: { tuple: true, "tuple-item": true },
				inheritMetadata: ctx.inheritMetadata,
			});
		}
		return ctx.acc;
	}
	// unions, intersections, etc. - recurse into options
	if (schema instanceof z.ZodUnion) {
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		const levelConfig: ResolverConfigBase & UnionLevel = {
			level: "union",
			path: currentParent,
			required: isRequired,
			default: ctx?.default,
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		for (const opt of schema.options) {
			zodResolverImpl(opt, {
				acc: ctx.acc,
				currentParent,
				metadata: { "union-item": true },
				inheritMetadata: ctx.inheritMetadata,
			});
		}
		return ctx.acc;
	}
	if (schema instanceof z.ZodIntersection) {
		// Is this needed?!!
		// Can an intersection be optional or nullable in zod?
		const isRequired = !ctx?.isOptional && !ctx?.isNullable;
		const levelConfig: ResolverConfigBase & IntersectionLevel = {
			level: "intersection",
			path: currentParent,
			required: isRequired,
			default: ctx?.default,
			left: (value) =>
				customValidate(value, currentParent, {
					schema: schema.def.left,
				}),
			right: (value) =>
				customValidate(value, currentParent, {
					schema: schema.def.right,
				}),
			validate(value) {
				return customValidate(value, currentParent, { schema });
			},
		};
		pushToAcc({
			acc: ctx.acc,
			levelConfig,
			path: currentParent,
			schema,
			metadata: ctx?.metadata,
			inheritMetadata: ctx.inheritMetadata,
		});

		zodResolverImpl(schema.def.left, {
			acc: ctx.acc,
			currentParent,
			metadata: { "intersection-item": "left" },
			inheritMetadata: {
				...(ctx.inheritMetadata || {}),
				"intersection-item": {
					...(ctx.inheritMetadata?.["intersection-item"] || {}),
					[currentParent]: 0,
				},
			},
		});
		zodResolverImpl(schema.def.right, {
			acc: ctx.acc,
			currentParent,
			metadata: { "intersection-item": "right" },
			inheritMetadata: {
				...(ctx.inheritMetadata || {}),
				"intersection-item": {
					...(ctx.inheritMetadata?.["intersection-item"] || {}),
					[currentParent]: 1,
				},
			},
		});
		return ctx.acc;
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
	return ctx.acc;
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
		return schemaPathCache.get(schema);
	}

	const result = zodResolverImpl(schema, {
		acc: { paths: [], pathToResolverConfig: {} },
		currentParent: "",
		inheritMetadata: {},
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
