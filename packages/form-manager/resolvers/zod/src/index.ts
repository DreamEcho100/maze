// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import z from "zod/v4";

export const name = "form-manager-resolver-zod";

import {
	fieldNodeTokenEnum,
	fnConfigKeyCONFIG,
} from "@de100/form-manager-core/constants";
import type {
	FieldNodeConfigPresence,
	FieldNodeConfigValidateOptions,
	Literal,
	PathSegmentItem,
} from "@de100/form-manager-core/shared";
import type {
	FieldNode,
	FieldNodeConfig,
	FieldNodeConfigArrayLevel,
	FieldNodeConfigBigIntPrimitiveLevel,
	FieldNodeConfigBooleanPrimitiveLevel,
	FieldNodeConfigDatePrimitiveLevel,
	FieldNodeConfigFilePrimitiveLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigObjectLevel,
	FieldNodeConfigPrimitiveLevel,
	FieldNodeConfigRecordLevel,
	FieldNodeConfigStringPrimitiveLevel,
	FieldNodeConfigTupleLevel,
	FieldNodeConfigUnionDescendantLevel,
	FieldNodeConfigUnionRootLevel,
	FieldNodeConfigUnknownLevel,
	ValidateReturnShape,
} from "@de100/form-manager-core/types/form-manger/fields/shape";
import type {
	CurrentAttributes,
	InheritedMetadata,
	ZodResolverAcc,
	ZodResolverFieldNodeResult,
} from "./types/index.ts";
import type { ZodAny } from "./types/internal.ts";

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
	options: FieldNodeConfigValidateOptions,
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
						// TODO: a `normalizedPathStr(pathStr, formApi)` that will convert/figure the path segments to the correct tokens if needed by walking through `formApi.fields.shape` or having a map of path to tokenized path
						// Q: is the `pathString` needed if we have the `pathSegments`?
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

/**
 * Update it on the `pathToResolverConfig` by using the `path`
 * @warning it's not accounting for "union-root" yet or recursive compatible intersections
 */
function resolveIntersectionItemConfig(props: {
	acc: ZodResolverAcc;
	existingNode: FieldNode | undefined;
	newNode: FieldNode;
}): FieldNode {
	const existingNode = props.existingNode;
	if (existingNode) {
		if (
			existingNode[fnConfigKeyCONFIG].level ===
				props.newNode[fnConfigKeyCONFIG].level &&
			(existingNode[fnConfigKeyCONFIG].level !== "primitive" ||
				(existingNode[fnConfigKeyCONFIG].level === "primitive" &&
					existingNode[fnConfigKeyCONFIG].type ===
						(
							props.newNode[fnConfigKeyCONFIG] as FieldNodeConfig &
								FieldNodeConfigPrimitiveLevel
						).type))
		) {
			const newConfig = props.newNode[fnConfigKeyCONFIG];
			const existingConfig = existingNode[fnConfigKeyCONFIG];

			const newMetadata = props.newNode[fnConfigKeyCONFIG].metadata;
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
				// Since if we do `"isMarkedNever": true` it won't be logical
				// `"isMarkedNever": true` will be used outside for the descendent if there is though
				// To avoid losing the other paths, metadata, and information
				// biome-ignore lint/suspicious/noTsIgnore: <explanation>
				// @ts-ignore
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				return (props.acc.pathToNode[
					props.newNode[fnConfigKeyCONFIG].pathString
				][fnConfigKeyCONFIG] = {
					level: "never",
					pathString: existingNode[fnConfigKeyCONFIG].pathString,
					pathSegments: existingNode[fnConfigKeyCONFIG].pathSegments,
					constraints: {},
					validation: {
						validate: async (value, options) =>
							customValidate(
								{
									value,
									currentParentPathString:
										existingNode[fnConfigKeyCONFIG].pathString,
									currentParentSegments:
										existingNode[fnConfigKeyCONFIG].pathSegments,
									schema: z.never(),
								},
								options,
							),
					},
					metadata: { ...existingNode.metadata, isMarkedNever: true },
					userMetadata: {},
				} satisfies FieldNodeConfig);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	props.acc.pathToNode[props.newNode[fnConfigKeyCONFIG].pathString] =
		props.newNode;
	return props.newNode;
}

/**
 * Attach the child node to the current parent node based on the parent node level
 * It's handled on the `pushToAcc` function
 * @returns the current parent node after attaching the child node, or the child node itself if no parent node is provided
 */
function attachChildToParentNode(props: {
	currentParentNode: FieldNode | undefined;
	childKey: string | number | undefined;
	childNode: FieldNode;
}): FieldNode {
	if (!props.currentParentNode || !props.childKey) {
		return props.childNode;
	}

	const parentConfig = props.currentParentNode[fnConfigKeyCONFIG];
	switch (parentConfig.level) {
		case "object": {
			props.currentParentNode[props.childKey] ??= props.childNode;
			break;
		}
		case "array": {
			if (props.childKey !== fieldNodeTokenEnum.arrayItem) {
				throw new Error(
					`Array parent can only have "${fieldNodeTokenEnum.arrayItem}" as child key, got "${props.childKey}"`,
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
	node: FieldNode;
	currentAttributes: CurrentAttributes | undefined;
	inheritedMetadata: InheritedMetadata;
	currentParentNode: FieldNode | undefined;
	childKey: string | number | undefined;
}): ZodResolverAcc & { isNew: boolean } {
	let existingNode: FieldNode | undefined =
		props.acc.pathToNode[props.pathString];
	let isNew = true;

	if (existingNode && existingNode[fnConfigKeyCONFIG].level !== "temp-root") {
		isNew = false;

		if (existingNode.metadata?.["intersectionItem"]) {
			//
			existingNode = resolveIntersectionItemConfig({
				acc: props.acc,
				existingNode: existingNode,
				newNode: props.node,
			});

			if (existingNode[fnConfigKeyCONFIG].level === "never") {
				// If it was marked as never, we need to update the inheritedMetadata to have isMarkedNever true
				props.inheritedMetadata["isMarkedNever"] = true;
			}
		}

		if (
			existingNode[fnConfigKeyCONFIG].level &&
			existingNode[fnConfigKeyCONFIG].level === "union-descendant"
		) {
			// TODO: needs to check the `isMarkedNever`
			// Merge union-descendant options
			const itemsToPush =
				props.node[fnConfigKeyCONFIG].level === "union-descendant"
					? props.node[fnConfigKeyCONFIG].options
					: [props.node];
			existingNode[fnConfigKeyCONFIG].options.push(...itemsToPush);
		}

		return { node: existingNode, isNew, pathToNode: props.acc.pathToNode };
	}

	let newNode = props.node;
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const metadata = (newNode[fnConfigKeyCONFIG].metadata ??= {});
	if (props.currentAttributes) {
		for (const key in props.currentAttributes) {
			// @ts-expect-error
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			metadata[key] = props.currentAttributes[key];
		}
	}

	if (props.inheritedMetadata) {
		if (props.inheritedMetadata["intersectionItem"]) {
			metadata["intersectionItem"] =
				props.inheritedMetadata["intersectionItem"];
		}

		const unionRootDescendant = props.inheritedMetadata["unionRootDescendant"];
		if (unionRootDescendant) {
			// // Will this be used?
			// const originPath = unionRootDescendant.rootPathToInfo[props.path]!;
			const oldNode = newNode;
			newNode = {
				[fnConfigKeyCONFIG]: {
					level: "union-descendant",
					options: [oldNode],
					pathString: oldNode[fnConfigKeyCONFIG].pathString,
					pathSegments: oldNode[fnConfigKeyCONFIG].pathSegments,
					// Q: default: ctx.default, // Can we pass it from the root somehow? maybe also make it lazy calculated/computed and cached? or just ignore it for union-descendant? is there a use case that needs it and can't be handled easily otherwise?
					constraints: {},
					validation: {
						async validate(value, options): Promise<ValidateReturnShape> {
							const config = newNode[
								fnConfigKeyCONFIG
							] as FieldNodeConfigUnionDescendantLevel;
							for (let i = 0; i < config.options.length; i++) {
								const opt = config.options[i];
								if (!opt) {
									console.warn(
										`\`${config.pathString}.options[${i}]\` is undefined`,
									);
									continue;
								}
								const { result } = await opt[
									fnConfigKeyCONFIG
								].validation.validate(value, options);
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
						unionRootDescendant: unionRootDescendant,
					},
					userMetadata: {},
				} satisfies FieldNodeConfigUnionDescendantLevel,
			};
		}

		// Instead of overriding the config level to be of never type
		// we will just mark it as never and handle it in the validation phase
		// to avoid losing the other paths, metadata, and information
		if (props.inheritedMetadata["isMarkedNever"]) {
			metadata["isMarkedNever"] = true;
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

const calcPresence = (
	props:
		| {
				optional?: boolean;
				nullable?: boolean;
		  }
		| undefined,
): FieldNodeConfigPresence =>
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
`inheritedMetadata` is needed for properly handling and passing `intersectionItem` and `union-root` metadata to the needed path because they can be defined at a higher level and need to be passed down to apply them properly

The system looks as it is because I'm trying different ways before changing the data structure/shape to a Trie like one, to support many advanced functionalities and to make propagation cheap, and yes the tokenization will play a huge role on it
*/
function zodResolverImpl(
	schema: ZodAny,
	ctx: {
		//
		currentParentPathString: string;
		currentParentPathSegments: PathSegmentItem[];
		currentParentNode: FieldNode | undefined;
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
	pathToNode: Record<string, FieldNode>;
	node: FieldNode;
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
		}

		if ("coerce" in schema.def && typeof schema.def.coerce === "boolean")
			coerce = schema.def.coerce;
		if ("minLength" in schema && typeof schema.minLength === "number")
			minLength = schema.minLength;
		if ("maxLength" in schema && typeof schema.maxLength === "number")
			maxLength = schema.maxLength;
		if ("pattern" in schema.def && schema.def.pattern instanceof RegExp)
			regex = schema.def.pattern;

		// def.checks[0]._zod.def.check === "overwrite"

		const config: FieldNodeConfigStringPrimitiveLevel = {
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
				regex: regex,
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
				node: { [fnConfigKeyCONFIG]: config },
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

		multipleOf ??=
			schema.format && ["int32", "safeint"].includes(schema.format)
				? 1
				: undefined;

		const config: FieldNodeConfigNumberPrimitiveLevel = {
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
				node: { [fnConfigKeyCONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodBigInt || schema instanceof z.ZodBigIntFormat) {
		let min: number | bigint | undefined;
		let max: number | bigint | undefined;
		let inclusiveMin: boolean | undefined;
		let inclusiveMax: boolean | undefined;
		let multipleOf: number | bigint = 1;
		if (schema.def.checks) {
			for (const check of schema.def.checks) {
				if (check instanceof z.core.$ZodCheckLessThan) {
					max = check._zod.def.value as number | bigint;
					inclusiveMax = check._zod.def.inclusive;
					// inclusiveMax = check._zod.def.when
				} else if (check instanceof z.core.$ZodCheckGreaterThan) {
					min = check._zod.def.value as number | bigint;
					inclusiveMin = check._zod.def.inclusive;
				} else if (check instanceof z.core.$ZodCheckMultipleOf) {
					multipleOf = check._zod.def.value as number | bigint;
				}
			}
		}

		const config: FieldNodeConfigBigIntPrimitiveLevel = {
			level: "primitive",
			type: "bigint",
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
				node: { [fnConfigKeyCONFIG]: config },
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
		const config: FieldNodeConfigDatePrimitiveLevel = {
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
				node: { [fnConfigKeyCONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodBoolean) {
		const config: FieldNodeConfigBooleanPrimitiveLevel = {
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
				node: { [fnConfigKeyCONFIG]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
			}).node,
		};
	}
	if (schema instanceof z.ZodFile) {
		const config: FieldNodeConfigFilePrimitiveLevel = {
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
				node: { [fnConfigKeyCONFIG]: config },
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
			? `${currentParentPathString}.${fieldNodeTokenEnum.arrayItem}`
			: fieldNodeTokenEnum.arrayItem;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			fieldNodeTokenEnum.arrayItem,
		];
		const node: FieldNode = {
			[fnConfigKeyCONFIG]: {
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
			} as FieldNodeConfigArrayLevel,
		};
		// // To make sure we also cover the array item token path
		// node.items =
		zodResolverImpl(schema.element, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { isArrayTokenItem: true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: schema.element,
			get currentParentNode() {
				return node;
			},
			childKey: fieldNodeTokenEnum.arrayItem,
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
			[fnConfigKeyCONFIG]: {
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
			} as FieldNodeConfigTupleLevel,
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
			// 	currentAttributes: { "isTupleItem": true },
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
						currentAttributes: { isTupleItem: true },
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
		const node: FieldNode = {
			[fnConfigKeyCONFIG]: {
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
			} as FieldNodeConfigRecordLevel,
		};

		// Create token path for the property template
		const tokenNextParent = currentParentPathString
			? `${currentParentPathString}.${fieldNodeTokenEnum.recordProperty}`
			: fieldNodeTokenEnum.recordProperty;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			fieldNodeTokenEnum.recordProperty,
		];

		// Process value type schema for the token path
		zodResolverImpl(valueSchema, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { isRecordProperty: true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: valueSchema,
			get currentParentNode() {
				return node;
			},
			childKey: fieldNodeTokenEnum.recordProperty,
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
			[fnConfigKeyCONFIG]: {
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
			} as FieldNodeConfigObjectLevel,
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
			// 	currentAttributes: { "isObjectProperty": true },
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
						currentAttributes: { isObjectProperty: true },
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

	// Q: How should the `currentAttributes` be handled for union-root and intersectionItem? and should they be passed down to their children/resulting branches?

	if (
		schema instanceof z.ZodUnion ||
		schema instanceof z.ZodDiscriminatedUnion
	) {
		const rootPathToInfo = {
			...ctx.inheritedMetadata["unionRootDescendant"]?.rootPathToInfo,
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
				unionRootDescendant: { rootPathToInfo },
				...ctx.currentAttributes,
			},
		} as FieldNodeConfigUnionRootLevel;
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
			node: { [fnConfigKeyCONFIG]: config },
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
						unionRootDescendant: { rootPathToInfo },
					},
					currentAttributes: { ...ctx.currentAttributes },
					currentParentNode: ctx.currentParentNode,
					currentSchema: opt,
					childKey: ctx.childKey,
				}).node;
				const currentParentIndexedTokenPath = currentParentPathString
					? `${currentParentPathString}.${fieldNodeTokenEnum.unionOptionOn}.${index}`
					: `${fieldNodeTokenEnum.unionOptionOn}.${index}`;
				const currentParentIndexedTokenPathSegments = [
					...currentParentPathSegments,
					fieldNodeTokenEnum.unionOptionOn,
					index,
				];
				zodResolverImpl(opt, {
					acc: ctx.acc,
					currentParentPathString: currentParentIndexedTokenPath,
					currentParentPathSegments: currentParentIndexedTokenPathSegments,
					inheritedMetadata: {
						...ctx.inheritedMetadata,
						unionRootDescendant: { rootPathToInfo },
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
			// currentAttributes: { "intersectionItem": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				intersectionItem: {
					...(ctx.inheritedMetadata?.["intersectionItem"] || {}),
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
			// currentAttributes: { "intersectionItem": "right" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				intersectionItem: {
					...(ctx.inheritedMetadata?.["intersectionItem"] || {}),
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
	// - z.ZodTransform
	// - z.ZodBigInt
	// - z.ZodBigIntFormat
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
		const config: FieldNodeConfigUnknownLevel = {
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
				node: { [fnConfigKeyCONFIG]: config },
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
				[fnConfigKeyCONFIG]: {
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
		node: Record<string, FieldNode>;
	}
>();
/**
 * This resolver extracts paths and mapped paths to validation configs from a Zod schema.
 * It will
 * - Be used by the form manager to validate fields based on their paths.
 * - Be used to get the field native rules for client-side validation (e.g. min, max, pattern, etc).
 * - Maybe on the future on the `FieldNode` structure/shape to optimize nested validations, conditions, etc down the path chain.
 * This is why there is a special token for array items: `@@__FIELD_TOKEN_ARRAY_ITEM__@@`, so we can optimize dependencies and validations for all items in an array.
 */
export function zodResolver<ZodSchema extends ZodAny>(
	schema: ZodSchema,
	options: { skipCache?: boolean } = {},
): {
	node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
	// Record<string, FieldNode>;
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
		return schemaPathCache.get(schema) as {
			node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
			// Record<string, FieldNode>;
			// This will be used
			__?: {
				// This will be used for the form fields options
				input: z.input<ZodSchema>;
				// This will be used for the validation final result
				output: z.output<ZodSchema>;
				// Q: But is there a case where we need to infer the _path_ output from a _trie node_?
			};
		};
	}

	const rootNode: FieldNode = {
		[fnConfigKeyCONFIG]: {
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
	return result as unknown as {
		node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
		// Record<string, FieldNode>;
		// This will be used
		__?: {
			// This will be used for the form fields options
			input: z.input<ZodSchema>;
			// This will be used for the validation final result
			output: z.output<ZodSchema>;
			// Q: But is there a case where we need to infer the _path_ output from a _trie node_?
		};
	};
}

/**
 * Extracts HTML form attributes from a field configuration
 * Useful for direct integration with HTML form elements or UI libraries
 *
 * @param config The field configuration object
 * @returns Record of HTML attributes ready to spread onto form elements
 */
export function getFieldAttributes(
	config: FieldNodeConfig,
): Record<string, any> {
	// Common attributes for all field types
	const attributes: Record<string, any> = {
		name: config.pathString,
		required: config.constraints?.presence === "required",
		readonly: config.constraints?.readonly,
	};

	if (config.constraints?.presence === "required") attributes.required = true;
	if (config.constraints?.readonly) attributes.readonly = true;

	// Handle specific field types
	if (config.level === "primitive") {
		// Set HTML input type based on field type
		switch (config.type) {
			case "string": {
				attributes.type = "text";

				// String-specific validations
				if (config.constraints?.minLength !== undefined)
					attributes.minLength = config.constraints.minLength;

				if (config.constraints?.maxLength !== undefined)
					attributes.maxLength = config.constraints.maxLength;

				// Convert Regex pattern to HTML pattern
				// Note: HTML pattern doesn't use flags and needs string format
				if (config.constraints?.regex)
					attributes.pattern = config.constraints.regex.source;

				break;
			}

			case "number": {
				attributes.type = "number";

				// Number-specific validations
				if (config.constraints?.min !== undefined)
					attributes.min = config.constraints.min;

				if (config.constraints?.max !== undefined)
					attributes.max = config.constraints.max;

				if (config.constraints?.multipleOf !== undefined)
					attributes.step = config.constraints.multipleOf;

				break;
			}

			case "bigint": {
				attributes.type = "number";

				// Number-specific validations
				if (config.constraints?.min !== undefined)
					attributes.min = Math.max(
						Number.MIN_SAFE_INTEGER,
						Number(config.constraints.min),
					);

				if (config.constraints?.max !== undefined)
					attributes.max = Math.min(
						Number.MAX_SAFE_INTEGER,
						Number(config.constraints.max),
					);

				if (config.constraints?.multipleOf !== undefined)
					attributes.step = Number(config.constraints.multipleOf);

				break;
			}

			case "boolean":
				attributes.type = "checkbox";
				break;

			case "date": {
				attributes.type = "date";

				// Date-specific validations
				if (config.constraints?.min instanceof Date)
					attributes.min = config.constraints.min.toISOString().split("T")[0];
				if (config.constraints?.max instanceof Date)
					attributes.max = config.constraints.max.toISOString().split("T")[0];
				break;
			}

			case "file": {
				attributes.type = "file";

				// File-specific attributes
				if (config.constraints?.mimeTypes)
					attributes.accept = Array.isArray(config.constraints.mimeTypes)
						? config.constraints.mimeTypes.join(",")
						: config.constraints.mimeTypes;

				break;
			}

			default: {
				// For other primitives, use text input as fallback
				attributes.type = "text";
			}
		}

		// Default value
		if (config.default !== undefined) {
			attributes.defaultValue = config.default;
		}
	} else {
		switch (config.level) {
			case "array":
			case "tuple":
				// attributes['data-field-type'] = 'array';
				// attributes['data-item-path'] = `${config.pathString}.${FieldTokenMap.arrayItem}`;
				if (config.constraints.minLength)
					attributes.min = config.constraints.minLength;
				if (config.constraints.maxLength)
					attributes.max = config.constraints.maxLength;
				attributes.multiple = true;
				break;
		}
	}

	return attributes;
}

// const userSchema = z.object({
// 	name: z.string().min(1),
// 	age: z.number().min(0),
// 	addresses: z.array(
// 		z.object({
// 			street: z.string(),
// 			city: z.string(),
// 		}),
// 	),
// });

// const paths = zodResolver(userSchema);
// console.log(paths);

// const test = z.object({
// 	name: z.string().min(0).max(10),
// 	userName: z.coerce.string().min(0).max(10),
// 	age: z.number().min(0).max(10),
// 	age2: z.number().lt(5).gt(1),
// 	age3: z.number().lte(5).gte(1),
// 	birthDate: z.date().min(0).max(10),
// 	birthDate2: z.coerce.date().min(0).max(10),
// 	test1: z
// 		.string()
// 		.transform((val) => val.length)
// 		.pipe(z.number()),
// 	test2: z
// 		.object({ a: z.string() })
// 		.transform((val) => ({ b: val.a.length }))
// 		.pipe(z.object({ b: z.number() })),
// 	record: z.record(z.string().min(1), z.number().min(0)),
// });

// console.log(test);

// type TestInput = z.input<typeof test>;
// type TestOutput = z.input<typeof test>;
