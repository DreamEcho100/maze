/**
 * * TODO: revise the use of `z.core.$ZodCheck*`
 * It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
 * So we can have a common ground for different schema validators to work with the form manager.
 * And keep form state agnostic of the validator library.
 */

import {
	fieldNodeTokenEnum,
	fnConfigKeyCONFIG,
} from "@de100/form-manager-core/constants";

// ZodCheckOverwriteDef
// ZodCheckPropertyDef

import type {
	AnyRecord,
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
	FieldNodeConfigNeverLevel,
	FieldNodeConfigNullLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigObjectLevel,
	FieldNodeConfigPrimitiveLevel,
	FieldNodeConfigRecordLevel,
	FieldNodeConfigStringPrimitiveLevel,
	FieldNodeConfigTempParentLevel,
	FieldNodeConfigTupleLevel,
	FieldNodeConfigUndefinedLevel,
	FieldNodeConfigUnionDescendantLevel,
	FieldNodeConfigUnionRootLevel,
	FieldNodeConfigUnknownLevel,
	FieldNodeConfigVoidLevel,
	InternalFieldNode,
	InternalFieldNodeConfig,
	ValidateReturnShape,
} from "@de100/form-manager-core/types/form-manger/fields/shape";
import z, { unknown, ZodLiteral } from "zod";

import type {
	CurrentAttributes,
	InheritedMetadata,
	InternalZodResolverAcc,
	ZodLiteralBigInt,
	ZodLiteralBoolean,
	ZodLiteralNumber,
	ZodLiteralString,
	ZodResolverFieldNodeResult,
} from "./types/index.ts";

import type { ZodAny } from "./types/internal.ts";

export const name = "form-manager-resolver-zod";

async function customValidate<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	T = unknown,
>(
	props: {
		value: any;
		currentParentPathString: string;
		currentParentSegments: PathSegmentItem[];
		schema: unknown;
	},
	options: FieldNodeConfigValidateOptions,
): Promise<ValidateReturnShape<PathAcc, T>> {
	try {
		/** The following is to use "standard schema" that should be provided by Zod through `~standard` */
		if (!(props.schema instanceof z.ZodAny) || !("~standard" in props.schema)) {
			throw new Error("Provided schema is not a valid Standard schema");
		}

		const result = await (props.schema as z.ZodType)["~standard"].validate(
			props.value,
		);

		if ("issues" in result && result.issues) {
			return {
				result: {
					issues: result.issues.map((issue) => ({
						message: issue.message,
						/** TODO: a `normalizedPathStr(pathStr, formApi)` that will convert/figure the path segments to the correct tokens if needed by walking through `formApi.fields.shape` or having a map of path to tokenized path */
						/** Q: is the `pathString` needed if we have the `pathSegments`? */
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

		/** This case should never happen with proper Zod usage */
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
		/** Handle sync validation errors */
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
	acc: InternalZodResolverAcc;
	existingNode: InternalFieldNode | undefined;
	newNode: InternalFieldNode;
}): InternalFieldNode {
	const existingNode = props.existingNode;
	if (existingNode) {
		if (
			existingNode[fnConfigKeyCONFIG].level ===
			props.newNode[fnConfigKeyCONFIG].level
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
				/**
				 * We will override the existing config to be of never type
				 * Since if we do `"isMarkedNever": true` it won't be logical
				 * `"isMarkedNever": true` will be used outside for the descendent if there is though
				 * To avoid losing the other paths, metadata, and information
				 */
				// biome-ignore lint/suspicious/noTsIgnore: <explanation>
				// @ts-ignore
				// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
				return (props.acc.resolvedPathToNode[
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
				} satisfies InternalFieldNodeConfig);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	props.acc.resolvedPathToNode[props.newNode[fnConfigKeyCONFIG].pathString] =
		props.newNode;
	return props.newNode;
}

/**
 * Update the accumulator with the new node at the given path, merging if necessary
 * handles intersection/union merging conflicts and metadata propagation
 */
function pushToAcc(props: {
	pathString: string;
	acc: InternalZodResolverAcc;
	node: InternalFieldNode;
	currentAttributes: CurrentAttributes | undefined;
	inheritedMetadata: InheritedMetadata;
	currentParentNode: InternalFieldNode;
	childKey: string | number;
}): InternalZodResolverAcc & { isNew: boolean } {
	let isNew = true;
	let existingNode: InternalFieldNode | undefined =
		props.acc.resolvedPathToNode[props.pathString];

	if (existingNode && existingNode[fnConfigKeyCONFIG].level !== "temp-root") {
		isNew = false;

		/** Should do something here to handle if it's `isLazilyEvaluated` as `true` */
		if (existingNode.metadata?.intersectionItem) {
			existingNode = resolveIntersectionItemConfig({
				acc: props.acc,
				existingNode: existingNode,
				newNode: props.node,
			});

			if (existingNode[fnConfigKeyCONFIG].level === "never") {
				/** If it was marked as never, we need to update the inheritedMetadata to have isMarkedNever true */
				props.inheritedMetadata.isMarkedNever = true;
			}
		}

		/** Should do something here to handle if it's `isLazilyEvaluated` as `true` */
		if (
			existingNode[fnConfigKeyCONFIG].level &&
			existingNode[fnConfigKeyCONFIG].level === "union-descendant"
		) {
			/** TODO: needs to check the `isMarkedNever` */
			/** Merge union-descendant options */
			const itemsToPush =
				props.node[fnConfigKeyCONFIG].level === "union-descendant"
					? props.node[fnConfigKeyCONFIG].options
					: [props.node];
			existingNode[fnConfigKeyCONFIG].options.push(
				...(itemsToPush as FieldNode[]),
			);
		}

		return {
			node: existingNode,
			isNew,
			resolvedPathToNode: props.acc.resolvedPathToNode,
			lazyPathToLazyNodesAccMap: props.acc.lazyPathToLazyNodesAccMap,
		};
	}

	let newNode = props.node;
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const metadata = (newNode[fnConfigKeyCONFIG].metadata ??= {});
	if (props.currentAttributes) {
		for (const key in props.currentAttributes) {
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			// @ts-ignore
			metadata[key] = props.currentAttributes[key];
		}
	}

	if (props.inheritedMetadata) {
		if (props.inheritedMetadata.intersectionItem) {
			metadata.intersectionItem = props.inheritedMetadata.intersectionItem;
		}

		const unionRootDescendant = props.inheritedMetadata.unionRootDescendant;
		if (unionRootDescendant) {
			/**
			 * Q: Will this be used?
			 *
			 * `const originPath = unionRootDescendant.rootPathToInfo[props.path]!;`
			 */
			const oldNode = newNode;
			newNode = {
				[fnConfigKeyCONFIG]: {
					level: "union-descendant",
					options: [oldNode as FieldNode],
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

		/**
		 * Instead of overriding the config level to be of never type
		 * we will just mark it as never and handle it in the validation phase
		 * to avoid losing the other paths, metadata, and information
		 */
		if (props.inheritedMetadata.isMarkedNever) {
			metadata.isMarkedNever = true;
		}
	}

	props.acc.resolvedPathToNode[props.pathString] = newNode;
	props.currentParentNode[props.childKey] = newNode;
	return {
		node: newNode,
		isNew,
		resolvedPathToNode: props.acc.resolvedPathToNode,
		lazyPathToLazyNodesAccMap: props.acc.lazyPathToLazyNodesAccMap,
	};
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

/**
 * handles lazy evaluation
 */
function createDeferredProperty(props: {
	container: AnyRecord;
	key: string | number;
	schema: unknown;
	resolverNode: () => InternalFieldNode;
	shouldEvaluateImmediately?: boolean;
}) {
	if (props.shouldEvaluateImmediately) {
		props.container[props.key] = props.resolverNode();
		return;
	}

	Object.defineProperty(props.container, props.key, {
		enumerable: true,
		configurable: true,
		get: () => {
			const value = props.resolverNode();

			Object.defineProperty(props.container, props.key, {
				value,
				writable: true,
				configurable: true,
				enumerable: true,
			});

			return value;
		},
	});
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

interface BaseCtx {
	optional?: boolean;
	nullable?: boolean;
	readonly?: boolean;
	currentParentPathString: string;
	currentParentPathSegments: PathSegmentItem[];
	currentSchema: unknown;
	currentAttributes?: CurrentAttributes;
}
interface ResolverUtils<
	Base extends {
		/* complex types */
		union: unknown;
		intersection: unknown;
		pipe: unknown;
		lazy: unknown;
		/* collections */
		array: unknown;
		tuple: unknown;
		record: unknown;
		object: unknown;
		/* attributes */
		prefault: unknown;
		default: unknown;
		readonly: unknown;
		nonOptional: unknown;
		optional: unknown;
		nullable: unknown;
		/* primitives */
		string: unknown;
		number: unknown;
		bigInt: unknown;
		date: unknown;
		boolean: unknown;
		file: unknown;
		unknown: unknown;
		undefined: unknown;
		null: unknown;
		void: unknown;
		never: unknown;
	},
> {
	/* complex types */
	union: {
		is: (schema: any) => schema is Base["union"];
		build: <T extends Base["union"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUnionRootLevel["constraints"];
			validate: FieldNodeConfigUnionRootLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUnionRootLevel["metadata"]>;
			userMetadata: FieldNodeConfigUnionRootLevel["userMetadata"];
			optionsSchema: readonly unknown[] | unknown[];
		};
	};
	intersection: {
		is: (schema: any) => schema is Base["intersection"];
		build: <T extends Base["intersection"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			// constraints: FieldNodeConfigTempParentLevel["constraints"];
			// validate: FieldNodeConfigTempParentLevel["validation"]["validate"];
			// metadata: Partial<FieldNodeConfigTempParentLevel["metadata"]>;
			// userMetadata: FieldNodeConfigTempParentLevel["userMetadata"];
			leftSchema: unknown;
			rightSchema: unknown;
		};
	};
	pipe: {
		is: (schema: any) => schema is Base["pipe"];
		build: <T extends Base["pipe"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			inSchema: unknown;
			outSchema: unknown;
		};
	};
	lazy: {
		is: (schema: any) => schema is Base["lazy"];
		build: <T extends Base["lazy"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			innerSchema: unknown;
		};
	};
	/* collections */
	array: {
		is: (schema: any) => schema is Base["array"];
		build: <T extends Base["array"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigArrayLevel["constraints"];
			validate: FieldNodeConfigArrayLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigArrayLevel["metadata"]>;
			userMetadata: FieldNodeConfigArrayLevel["userMetadata"];
			elementSchema: unknown;
		};
	};
	tuple: {
		is: (schema: any) => schema is Base["tuple"];
		build: <T extends Base["tuple"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigTupleLevel["constraints"];
			validate: FieldNodeConfigTupleLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigTupleLevel["metadata"]>;
			userMetadata: FieldNodeConfigTupleLevel["userMetadata"];
			itemsSchema: readonly unknown[] | unknown[];
		};
	};
	record: {
		is: (schema: any) => schema is Base["record"];
		build: <T extends Base["record"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigRecordLevel["constraints"];
			validate: FieldNodeConfigRecordLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigRecordLevel["metadata"]>;
			userMetadata: FieldNodeConfigRecordLevel["userMetadata"];
			valueSchema: unknown;
		};
	};
	object: {
		is: (schema: any) => schema is Base["object"];
		build: <T extends Base["object"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigObjectLevel["constraints"];
			validate: FieldNodeConfigObjectLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigObjectLevel["metadata"]>;
			userMetadata: FieldNodeConfigObjectLevel["userMetadata"];
			shapeSchema: Record<string, unknown>;
		};
	};
	/* attributes */
	prefault: Base["prefault"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["prefault"];
				build: <T extends Base["prefault"]>(
					schema: T,
				) => {
					defaultValue: unknown;
					innerSchema: unknown;
				};
			};
	default: Base["default"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["default"];
				build: <T extends Base["default"]>(
					schema: T,
				) => {
					defaultValue: unknown;
					innerSchema: unknown;
				};
			};
	readonly: Base["readonly"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["readonly"];
				build: <T extends Base["readonly"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	nonOptional: Base["nonOptional"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["nonOptional"];
				build: <T extends Base["nonOptional"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	optional: Base["optional"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["optional"];
				build: <T extends Base["optional"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	nullable: Base["nullable"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["nullable"];
				build: <T extends Base["nullable"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	/* primitives */
	string: {
		is: (schema: any) => schema is Base["string"];
		build: <T extends Base["string"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigStringPrimitiveLevel["constraints"];
			validate: FieldNodeConfigStringPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigStringPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigStringPrimitiveLevel["userMetadata"];
		};
	};
	number: {
		is: (schema: any) => schema is Base["number"];
		build: <T extends Base["number"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNumberPrimitiveLevel["constraints"];
			validate: FieldNodeConfigNumberPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNumberPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigNumberPrimitiveLevel["userMetadata"];
		};
	};
	bigInt: {
		is: (schema: any) => schema is Base["bigInt"];
		build: <T extends Base["bigInt"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigBigIntPrimitiveLevel["constraints"];
			validate: FieldNodeConfigBigIntPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigBigIntPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigBigIntPrimitiveLevel["userMetadata"];
		};
	};
	date: {
		is: (schema: any) => schema is Base["date"];
		build: <T extends Base["date"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigDatePrimitiveLevel["constraints"];
			validate: FieldNodeConfigDatePrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigDatePrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigDatePrimitiveLevel["userMetadata"];
		};
	};
	boolean: {
		is: (schema: any) => schema is Base["boolean"];
		build: <T extends Base["boolean"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigBooleanPrimitiveLevel["constraints"];
			validate: FieldNodeConfigBooleanPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigBooleanPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigBooleanPrimitiveLevel["userMetadata"];
		};
	};
	file: {
		is: (schema: any) => schema is Base["file"];
		build: <T extends Base["file"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigFilePrimitiveLevel["constraints"];
			validate: FieldNodeConfigFilePrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigFilePrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigFilePrimitiveLevel["userMetadata"];
		};
	};
	unknown: {
		is: (schema: any) => schema is Base["unknown"];
		build: <T extends Base["unknown"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUnknownLevel["constraints"];
			validate: FieldNodeConfigUnknownLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUnknownLevel["metadata"]>;
			userMetadata: FieldNodeConfigUnknownLevel["userMetadata"];
		};
	};
	undefined: {
		is: (schema: any) => schema is Base["undefined"];
		build: <T extends Base["undefined"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUndefinedLevel["constraints"];
			validate: FieldNodeConfigUndefinedLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUndefinedLevel["metadata"]>;
			userMetadata: FieldNodeConfigUndefinedLevel["userMetadata"];
		};
	};
	null: {
		is: (schema: any) => schema is Base["null"];
		build: <T extends Base["null"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNullLevel["constraints"];
			validate: FieldNodeConfigNullLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNullLevel["metadata"]>;
			userMetadata: FieldNodeConfigNullLevel["userMetadata"];
		};
	};
	void: {
		is: (schema: any) => schema is Base["void"];
		build: <T extends Base["void"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigVoidLevel["constraints"];
			validate: FieldNodeConfigVoidLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigVoidLevel["metadata"]>;
			userMetadata: FieldNodeConfigVoidLevel["userMetadata"];
		};
	};
	never: {
		is: (schema: any) => schema is Base["never"];
		build: <T extends Base["never"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNeverLevel["constraints"];
			validate: FieldNodeConfigNeverLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNeverLevel["metadata"]>;
			userMetadata: FieldNodeConfigNeverLevel["userMetadata"];
		};
	};
}

type ZodResolverUtils = ResolverUtils<{
	/* complex types */
	union: z.ZodUnion | z.ZodDiscriminatedUnion;
	intersection: z.ZodIntersection;
	pipe: z.ZodPipe;
	lazy: z.ZodLazy;
	/* collections */
	array: z.ZodArray;
	tuple: z.ZodTuple;
	record: z.ZodRecord;
	object: z.ZodObject;
	/* attributes */
	prefault: z.ZodPrefault;
	default: z.ZodDefault;
	readonly: z.ZodReadonly;
	nonOptional: z.ZodNonOptional;
	optional: z.ZodOptional;
	nullable: z.ZodNullable;
	/* perimitives */
	string: z.ZodString | z.ZodEnum | z.ZodStringFormat | ZodLiteralString;
	number: z.ZodNumber | z.ZodNumberFormat | ZodLiteralNumber;
	bigInt: z.ZodBigInt | z.ZodBigIntFormat | ZodLiteralBigInt;
	boolean: z.ZodBoolean | ZodLiteralBoolean;
	date: z.ZodDate;
	file: z.ZodType<File>;
	unknown: z.ZodUnknown | z.ZodAny;
	undefined: z.ZodUndefined;
	null: z.ZodNull;
	void: z.ZodVoid;
	never: z.ZodNever;
}>;

const zodLibUtil = {
	union: {
		is: (schema) =>
			schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion,
		build: (schema, ctx) => {
			let tag: FieldNodeConfigUnionRootLevel["constraints"]["tag"];

			if (schema instanceof z.ZodDiscriminatedUnion) {
				const valueToOptionIndex = new Map<Literal, number>();
				tag = {
					key: schema.def.discriminator,
					values: new Set(),
					valueToOptionIndex,
				};

				for (let i = 0; i < schema.def.options.length; i++) {
					const opt = schema.def.options[i];
					if (!opt || !(opt instanceof z.ZodObject)) {
						throw new Error("Discriminated union options must be ZodObject");
					}

					const tagSchema = opt.def.shape[tag.key];

					if (tagSchema instanceof z.ZodLiteral) {
						for (const literal of tagSchema.def.values) {
							tagToOptionIndexSetGuard(valueToOptionIndex, literal, i);
							valueToOptionIndex.set(literal, i);
							tag.values.add(literal);
						}
						continue;
					}

					if (tagSchema instanceof z.ZodEnum) {
						for (const enumValue of Object.values(tagSchema.def.entries)) {
							tagToOptionIndexSetGuard(valueToOptionIndex, enumValue, i);
							valueToOptionIndex.set(enumValue, i);
							tag.values.add(enumValue);
						}
						continue;
					}

					if (tagSchema instanceof z.ZodUnion) {
						for (const tagOpt of tagSchema.def.options) {
							if (tagOpt instanceof z.ZodLiteral) {
								for (const literal of tagOpt.def.values) {
									tagToOptionIndexSetGuard(valueToOptionIndex, literal, i);
									valueToOptionIndex.set(literal, i);
									tag.values.add(literal);
								}
								continue;
							}

							if (tagOpt instanceof z.ZodEnum) {
								for (const enumValue of Object.values(tagOpt.def.entries)) {
									tagToOptionIndexSetGuard(valueToOptionIndex, enumValue, i);
									valueToOptionIndex.set(enumValue, i);
									tag.values.add(enumValue);
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

			return {
				constraints: {
					tag: undefined,
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
				optionsSchema: schema.options,
			};
		},
	},
	intersection: {
		is: (schema) => schema instanceof z.ZodIntersection,
		build: (schema, ctx) => {
			return {
				// constraints: {
				// 	presence: calcPresence(ctx),
				// 	readonly: ctx.readonly,
				// },
				// validate: (value, options) =>
				// 	customValidate(
				// 		{
				// 			value,
				// 			currentParentPathString: ctx.currentParentPathString,
				// 			currentParentSegments: ctx.currentParentPathSegments,
				// 			schema: ctx.currentSchema,
				// 		},
				// 		options,
				// 	),
				// metadata: { ...ctx.currentAttributes },
				// userMetadata: {},
				leftSchema: schema.def.left,
				rightSchema: schema.def.right,
			};
		},
	},
	pipe: {
		is: (schema) => schema instanceof z.ZodPipe,
		build: (schema, ctx) => {
			return {
				inSchema: schema.def.in,
				outSchema: schema.def.out,
			};
		},
	},
	lazy: {
		is: (schema) => schema instanceof z.ZodLazy,
		build: (schema, ctx) => {
			return {
				/** We need to call the getter to get the actual schema */
				innerSchema: schema.def.getter(),
			};
		},
	},
	/* collections */
	array: {
		is: (schema) => schema instanceof z.ZodArray,
		build: (schema, ctx) => {
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

			return {
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					minLength,
					maxLength,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
				elementSchema: schema.def.element,
			};
		},
	},
	tuple: {
		is: (schema) => schema instanceof z.ZodTuple,
		build: (schema, ctx) => {
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

			return {
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					exactLength,
					minLength,
					maxLength,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
				itemsSchema: schema.def.items,
			};
		},
	},
	record: {
		is: (schema) => schema instanceof z.ZodRecord,
		build: (schema, ctx) => {
			/** Extract key and value types */
			const keySchema = schema.def.keyType;
			const valueSchema = schema.def.valueType;

			return {
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					/** Store schema references for runtime operations */
					keySchema,
					valueSchema,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
				valueSchema,
			};
		},
	},
	object: {
		is: (schema) => schema instanceof z.ZodObject,
		build: (schema, ctx) => {
			return {
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
				shapeSchema: schema.shape,
			};
		},
	},
	/* attributes */
	prefault: {
		is: (schema) => schema instanceof z.ZodPrefault,
		build: (schema) => ({
			defaultValue: schema.def.defaultValue,
			innerSchema: unknown,
		}),
	},
	default: {
		is: (schema) => schema instanceof z.ZodDefault,
		build: (schema) => ({
			defaultValue: schema.def.defaultValue,
			innerSchema: unknown,
		}),
	},
	readonly: {
		is: (schema) => schema instanceof z.ZodReadonly,
		build: (schema) => ({
			innerSchema: schema.unwrap(),
		}),
	},
	nonOptional: {
		is: (schema) => schema instanceof z.ZodNonOptional,
		build: (schema) => ({
			innerSchema: schema.unwrap(),
		}),
	},
	optional: {
		is: (schema) => schema instanceof z.ZodOptional,
		build: (schema) => ({
			innerSchema: schema.unwrap(),
		}),
	},
	nullable: {
		is: (schema) => schema instanceof z.ZodNullable,
		build: (schema) => ({
			innerSchema: schema.unwrap(),
		}),
	},
	/* primitives */
	string: {
		is: ((schema) =>
			schema instanceof z.ZodString ||
			schema instanceof z.ZodStringFormat ||
			schema instanceof z.ZodEnum ||
			(schema instanceof z.ZodLiteral &&
				typeof schema.def.values[0] ===
					"string")) as ZodResolverUtils["string"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigStringPrimitiveLevel["constraints"] = {
				presence: calcPresence(ctx),
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof z.ZodLiteral) {
				constraints.regex = new RegExp(
					`^${schema.def.values
						.map((v) =>
							/** Need to escape special regex characters if the literal is a string */
							typeof v === "string"
								? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
								: String(v),
						)
						.join("|")}$`,
				);
				constraints.presence = "required";
			} else if (schema instanceof z.ZodEnum) {
				constraints.regex = new RegExp(
					`^${Object.values(schema.def.entries)
						.map((v) =>
							/** Need to escape special regex characters if the enum value is a string */
							typeof v === "string"
								? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
								: String(v),
						)
						.join("|")}$`,
				);
				constraints.presence = "required";
			} else {
				if (typeof schema.def.coerce === "boolean")
					constraints.coerce = schema.def.coerce;
				if (typeof schema.minLength === "number")
					constraints.minLength = schema.minLength;
				if (typeof schema.maxLength === "number")
					constraints.maxLength = schema.maxLength;
				if ("pattern" in schema.def && schema.def.pattern instanceof RegExp)
					constraints.regex = schema.def.pattern;

				if (schema.def.coerce) constraints.coerce = true;
			}

			// def.checks[0]._zod.def.check === "overwrite"

			return {
				constraints,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	number: {
		is: ((schema) =>
			schema instanceof z.ZodNumber ||
			schema instanceof z.ZodNumberFormat ||
			(schema instanceof z.ZodLiteral &&
				typeof schema.def.values[0] ===
					"number")) as ZodResolverUtils["number"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigNumberPrimitiveLevel["constraints"] = {
				presence: calcPresence(ctx),
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof ZodLiteral) {
				constraints.regex = new RegExp(
					`^${schema.def.values
						.map((v) =>
							/** Need to escape special regex characters if the literal is a string */
							typeof v === "string"
								? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
								: String(v),
						)
						.join("|")}$`,
				);
				constraints.presence = "required";
			} else {
				if (schema.def.checks) {
					for (const check of schema.def.checks) {
						if (check instanceof z.core.$ZodCheckLessThan) {
							constraints.max = check._zod.def.value as number;
							constraints.inclusiveMax = check._zod.def.inclusive;
							// inclusiveMax = check._zod.def.when
						} else if (check instanceof z.core.$ZodCheckGreaterThan) {
							constraints.min = check._zod.def.value as number;
							constraints.inclusiveMin = check._zod.def.inclusive;
						} else if (check instanceof z.core.$ZodCheckMultipleOf) {
							constraints.multipleOf = check._zod.def.value as number;
						}
					}
				}

				constraints.multipleOf ??=
					schema.format && ["int"].includes(schema.format) ? 1 : undefined;

				if (schema.def.coerce) constraints.coerce = true;
			}

			return {
				constraints,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	bigInt: {
		is: ((schema) =>
			schema instanceof z.ZodBigInt ||
			schema instanceof z.ZodBigIntFormat ||
			(schema instanceof z.ZodLiteral &&
				typeof schema.def.values[0] ===
					"bigint")) as ZodResolverUtils["bigInt"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigBigIntPrimitiveLevel["constraints"] = {
				presence: calcPresence(ctx),
				multipleOf: 1,
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof ZodLiteral) {
				constraints.regex = new RegExp(
					`^${schema.def.values
						.map((v) =>
							/** Need to escape special regex characters if the literal is a string */
							typeof v === "string"
								? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
								: String(v),
						)
						.join("|")}$`,
				);
				constraints.presence = "required";
			} else {
				if (schema.def.checks) {
					for (const check of schema.def.checks) {
						if (check instanceof z.core.$ZodCheckLessThan) {
							constraints.max = check._zod.def.value as number | bigint;
							constraints.inclusiveMax = check._zod.def.inclusive;
						} else if (check instanceof z.core.$ZodCheckGreaterThan) {
							constraints.min = check._zod.def.value as number | bigint;
							constraints.inclusiveMin = check._zod.def.inclusive;
						} else if (check instanceof z.core.$ZodCheckMultipleOf) {
							constraints.multipleOf = check._zod.def.value as number | bigint;
						}
					}
				}

				if (schema.def.coerce) constraints.coerce = true;
			}

			return {
				constraints,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	date: {
		is: (schema) => schema instanceof z.ZodDate,
		build: (schema, ctx) => {
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

			return {
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					coerce: schema.def.coerce,
					min,
					max,
					inclusiveMin,
					inclusiveMax,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	boolean: {
		is: ((schema) =>
			schema instanceof z.ZodBoolean ||
			(schema instanceof z.ZodLiteral &&
				typeof schema.def.values[0] ===
					"boolean")) as ZodResolverUtils["boolean"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigBooleanPrimitiveLevel["constraints"] = {
				presence: calcPresence(ctx),
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof ZodLiteral) {
				constraints.regex = new RegExp(
					`^${schema.def.values
						.map((v) =>
							/** Need to escape special regex characters if the literal is a string */
							typeof v === "string"
								? v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
								: String(v),
						)
						.join("|")}$`,
				);
				constraints.presence = "required";
			} else {
				if (schema.def.coerce) constraints.coerce = true;
			}

			return {
				constraints,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	file: {
		is: (schema) => schema instanceof z.ZodFile,
		build: (schema, ctx) => {
			let max: number | undefined;
			let min: number | undefined;
			const mimeTypes: string[] = [];

			if (schema.def.checks) {
				for (const check of schema.def.checks) {
					if (check instanceof z.core.$ZodCheckMaxSize) {
						max = check._zod.def.maximum;
					} else if (check instanceof z.core.$ZodCheckMinSize) {
						min = check._zod.def.minimum;
					} else if (check instanceof z.core.$ZodCheckMimeType) {
						mimeTypes.push(...check._zod.def.mime);
					} else if (check instanceof z.core.$ZodCheckSizeEquals) {
						max = check._zod.def.size;
						min = check._zod.def.size;
					}
				}
			}

			return {
				constraints: {
					presence: calcPresence(ctx),
					readonly: ctx.readonly,
					min,
					max,
					mimeTypes,
				},
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	unknown: {
		is: (schema) =>
			schema instanceof z.ZodUnknown || schema instanceof z.ZodAny,
		build: (schema, ctx) => {
			return {
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	undefined: {
		is: ((schema) =>
			schema instanceof z.ZodUndefined ||
			(schema instanceof z.ZodLiteral &&
				schema.def.values[0] ===
					undefined)) as ZodResolverUtils["undefined"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigUndefinedLevel["constraints"] = {
				presence: calcPresence(ctx),
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof ZodLiteral) {
				constraints.presence = "required";
			}

			return {
				constraints,
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	null: {
		is: ((schema) =>
			schema instanceof z.ZodNull ||
			(schema instanceof z.ZodLiteral &&
				schema.def.values[0] === null)) as ZodResolverUtils["null"]["is"],
		build: (schema, ctx) => {
			const constraints: FieldNodeConfigNullLevel["constraints"] = {
				presence: calcPresence(ctx),
			};

			if (ctx.readonly) constraints.readonly = true;

			if (schema instanceof ZodLiteral) {
				constraints.presence = "required";
			}

			return {
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	void: {
		is: (schema) => schema instanceof z.ZodVoid,
		build: (schema, ctx) => {
			return {
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
	never: {
		is: (schema) => schema instanceof z.ZodNever,
		build: (schema, ctx) => {
			return {
				constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
				validate: (value, options) =>
					customValidate(
						{
							value,
							currentParentPathString: ctx.currentParentPathString,
							currentParentSegments: ctx.currentParentPathSegments,
							schema: ctx.currentSchema,
						},
						options,
					),
				metadata: { ...ctx.currentAttributes },
				userMetadata: {},
			};
		},
	},
} satisfies ZodResolverUtils;

/**
 * handles schema → node transformation
 */
function resolverBuilder<
	TResolverUtilsShape extends {
		/* complex types */
		union: any;
		intersection: any;
		pipe: any;
		lazy: any;
		/* collections */
		array: any;
		tuple: any;
		record: any;
		object: any;
		/* attributes */
		prefault: any;
		default: any;
		readonly: any;
		nonOptional: any;
		optional: any;
		nullable: any;
		/* primitives */
		string: any;
		number: any;
		bigInt: any;
		date: any;
		boolean: any;
		file: any;
		unknown: any;
		undefined: any;
		null: any;
		void: any;
		never: any;
	},
>(
	schema: unknown,
	ctx: {
		/** */
		currentParentPathString: string;
		currentParentPathSegments: PathSegmentItem[];
		currentParentNode: InternalFieldNode;
		currentSchema: unknown;
		childKey: string | number;
		/** */
		currentAttributes?: CurrentAttributes;
		inheritedMetadata: InheritedMetadata;
		/** */
		acc: InternalZodResolverAcc;
		/** */
		default?: any;
		optional?: boolean;
		nullable?: boolean;
		readonly?: boolean;
		resolverUtils: ResolverUtils<TResolverUtilsShape>;
	},
): {
	resolvedPathToNode: Record<string, InternalFieldNode>;
	node: InternalFieldNode;
} {
	const currentParentPathString = ctx.currentParentPathString;
	const currentParentPathSegments = ctx.currentParentPathSegments;

	/** Handle complex types **/
	if (ctx.resolverUtils.array.is(schema)) {
		const result = ctx.resolverUtils.array.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

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
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.userMetadata,
			} as FieldNodeConfigArrayLevel,
		};

		resolverBuilder(result.elementSchema, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { isArrayTokenItem: true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: result.elementSchema,
			currentParentNode: node,
			childKey: fieldNodeTokenEnum.arrayItem,
			resolverUtils: ctx.resolverUtils,
		}).node;

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	if (ctx.resolverUtils.tuple.is(schema)) {
		const result = ctx.resolverUtils.tuple.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const node = {
			[fnConfigKeyCONFIG]: {
				level: "tuple",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.metadata,
			} as FieldNodeConfigTupleLevel,
		};

		const items = result.itemsSchema;
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const indexedNextParent = currentParentPathString
				? `${currentParentPathString}.${index}`
				: String(index);
			const indexedNextParentSegments = [...currentParentPathSegments, index];

			resolverBuilder(item, {
				acc: ctx.acc,
				currentParentPathString: indexedNextParent,
				currentParentPathSegments: indexedNextParentSegments,
				currentAttributes: { isTupleItem: true },
				currentSchema: item,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: node,
				childKey: index,
				resolverUtils: ctx.resolverUtils,
			}).node;
		}

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.record.is(schema)) {
		const result = ctx.resolverUtils.record.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		/** Create record node configuration */
		const node: FieldNode = {
			[fnConfigKeyCONFIG]: {
				level: "record",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.userMetadata,
			} as FieldNodeConfigRecordLevel,
		};

		/** Create token path for the property template */
		const tokenNextParent = currentParentPathString
			? `${currentParentPathString}.${fieldNodeTokenEnum.recordProperty}`
			: fieldNodeTokenEnum.recordProperty;
		const tokenNextParentSegments = [
			...currentParentPathSegments,
			fieldNodeTokenEnum.recordProperty,
		];

		resolverBuilder(result.valueSchema, {
			acc: ctx.acc,
			currentParentPathString: tokenNextParent,
			currentParentPathSegments: tokenNextParentSegments,
			currentAttributes: { isRecordProperty: true },
			inheritedMetadata: ctx.inheritedMetadata,
			currentSchema: result.valueSchema,
			currentParentNode: node,
			childKey: fieldNodeTokenEnum.recordProperty,
			resolverUtils: ctx.resolverUtils,
		}).node;

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.object.is(schema)) {
		const result = ctx.resolverUtils.object.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const node = {
			[fnConfigKeyCONFIG]: {
				level: "object",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.userMetadata,
				shape: {} /** To be filled below */,
			} as FieldNodeConfigObjectLevel,
		};

		const shape = result.shapeSchema;
		for (const key in shape) {
			const nextParent = currentParentPathString
				? `${currentParentPathString}.${key}`
				: key;
			const nextParentSegments = [...currentParentPathSegments, key];

			resolverBuilder(shape[key], {
				acc: ctx.acc,
				currentParentPathString: nextParent,
				currentParentPathSegments: nextParentSegments,
				currentAttributes: { isObjectProperty: true },
				currentSchema: shape[key],
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: node,
				childKey: key,
				resolverUtils: ctx.resolverUtils,
			}).node;
		}

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	/** Q: How should the `currentAttributes` be handled for union-root and intersectionItem? and should they be passed down to their children/resulting branches? */

	if (ctx.resolverUtils.union.is(schema)) {
		const result = ctx.resolverUtils.union.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const rootPathToInfo = {
			...ctx.inheritedMetadata.unionRootDescendant?.rootPathToInfo,
		};
		/** collect all branches into one UnionRootLevel */
		const config = {
			level: "union-root",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
			options: [],
		} as FieldNodeConfigUnionRootLevel;
		rootPathToInfo[currentParentPathString] ??= [];

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

		for (let index = 0; index < result.optionsSchema.length; index++) {
			const opt = result.optionsSchema[index];
			if (opt) {
				createDeferredProperty({
					container: config.options,
					key: index,
					schema: opt,
					resolverNode() {
						return resolverBuilder(opt, {
							acc: ctx.acc,
							currentParentPathString: currentParentPathString,
							currentParentPathSegments: currentParentPathSegments,
							inheritedMetadata: {
								...ctx.inheritedMetadata,
								unionRootDescendant: { rootPathToInfo },
							},
							currentAttributes: { ...ctx.currentAttributes },
							currentSchema: opt,
							currentParentNode: node,
							childKey: index,
							resolverUtils: ctx.resolverUtils,
						}).node;
					},
					shouldEvaluateImmediately: !ctx.inheritedMetadata.isLazyEvaluated,
				});

				const currentParentIndexedTokenPath = currentParentPathString
					? `${currentParentPathString}.${fieldNodeTokenEnum.unionOptionOn}.${index}`
					: `${fieldNodeTokenEnum.unionOptionOn}.${index}`;
				const currentParentIndexedTokenPathSegments = [
					...currentParentPathSegments,
					fieldNodeTokenEnum.unionOptionOn,
					index,
				];
				resolverBuilder(opt, {
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
					resolverUtils: ctx.resolverUtils,
				});

				/**
				 * Note: no need to push to options here since it's done in the `pushToAcc` function
				 * Since all options are pushed to the same path, they will be merged there on the options array
				 * with the correct order as well getting the config reference from the accumulator by path
				 */
			}
		}

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node,
		};
	}

	if (ctx.resolverUtils.intersection.is(schema)) {
		const result = ctx.resolverUtils.intersection.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		/**
		 * TODO: the intersection needs more revision and tests
		 * - how the metadata merging should be handled
		 * - how the validation should be handled
		 * - how the constraints should be handled
		 * - how the default should be handled
		 * - how the optional/nullable/readonly should be handled
		 * - etc.
		 *
		 * Q: Should we create a special level for intersection like union-root?
		 * Q: How to handle intersection of different levels? like object & object, object & primitive, primitive & primitive, array & array, array & object, array & primitive, etc.
		 * Q: How to handle intersection of conflicting constraints? like string with minLength 5 & string with maxLength 3, number with min 10 & number with max 5, etc.
		 * Q: How to handle intersection of different default values? like string with default "foo" & string with default "bar", number with default 10 & number with default 20, etc.
		 */

		/** **Left** is processed first so its metadata has lower priority than the right one */
		resolverBuilder(result.leftSchema, {
			acc: ctx.acc,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersectionItem": "left" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				intersectionItem: {
					...(ctx.inheritedMetadata?.intersectionItem || {}),
					[currentParentPathString]: 0, // TODO: Maybe add a function to generate the power set index if needed in the future
				},
			},
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			/** Q: Should we pass the current schema?!! */
			currentSchema: result.leftSchema,
			childKey: ctx.childKey,
			resolverUtils: ctx.resolverUtils,
		});

		/** **Right** is processed second so its metadata has higher priority than the left one */
		const right = resolverBuilder(result.rightSchema, {
			acc: ctx.acc,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			// currentAttributes: { "intersectionItem": "right" },
			inheritedMetadata: {
				...(ctx.inheritedMetadata || {}),
				intersectionItem: {
					...(ctx.inheritedMetadata?.intersectionItem || {}),
					[currentParentPathString]: 1,
				},
			},
			currentParentNode: ctx.currentParentNode,
			/** Q: Should we pass the current schema?!! */
			currentSchema: result.rightSchema,
			childKey: ctx.childKey,
			resolverUtils: ctx.resolverUtils,
		});

		/** They will be merged in the `pushToAcc` function when adding to the accumulator by path */
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: right.node,
		};
	}
	/** End complex types **/

	/**
	 * TODO: `.or`, `.and` - which are just aliases to union and intersection respectively needs more tests
	 * TODO: The following will have need to be handled properly in the future
	 *
	 * - z.ZodNever
	 * = z.ZodUndefined;
	 * = z.ZodNull;
	 *
	 * - z.ZodCodec - which will support `z.stringbool` too.
	 * - z.ZodCustom
	 * - z.ZodCustomStringFormat
	 * - z.ZodTransform
	 * - z.ZodMap
	 * - z.ZodSet
	 *
	 *
	 *
	 * - z.ZodCatch
	 * - z.ZodPromise
	 * - z.ZodFunction
	 * - z.ZodVoid
	 * - z.ZodSymbol
	 * - z.ZodNaN
	 * - z.ZodTemplateLiteral
	 * - z.ZodPromise
	 */

	({}) as NonNullable<z.ZodNaN["def"]["checks"]>[0]["_zod"]["check"];
	// 							^?

	if (ctx.resolverUtils.pipe.is(schema)) {
		const result = ctx.resolverUtils.pipe.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		/** Pipe is just a transformation, we just need to resolve the input schema */
		// const inputSchema = schema._def.in;
		const inputSchema = result.inSchema;
		// const outputSchema = schema._def.out;
		//
		/** We ignore the output schema since it's just a transformation */
		//	We just need to resolve the input schema=
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(inputSchema, ctx).node,
		};
	}

	if (ctx.resolverUtils.lazy.is(schema)) {
		const result = ctx.resolverUtils.lazy.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		/** It's OK, since there are lazy computations already here, we won't get into infinite loop */
		/** Q: Do we need to handle circular references somehow? */
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				inheritedMetadata: { ...ctx.inheritedMetadata, isLazyEvaluated: true },
			}).node,
		};
	}

	/** Q: Do we still need to handle ZodTransform? */

	/**
	 * NOTE:
	 * - ZodDefault:
	 *   - Makes the final inferred type **non-optional**.
	 *   - If the key is missing or explicitly set to `undefined`, it fills in the default value.
	 *   - When used with `.nullable()`, it still allows `null` values.
	 *   - So, missing key or `undefined` input results in the default value being used.
	 *
	 * - ZodPrefault:
	 *   - Keeps the final inferred type **optional**.
	 *   - If the key is missing, it fills in the default value.
	 *   - If the key is present but explicitly set to `undefined`, it is treated as `undefined` (not replaced by the default).
	 *   - Works with `.nullable()` to allow `null` as a value as well.
	 *
	 * In other words, the key difference is how `undefined` input is treated when the key is present:
	 * - `.default()` transforms `undefined` input into the default.
	 * - `.prefault()` does not transform `undefined` if explicitly passed, only if the key is missing.
	 *
	 * Summary:
	 * - ZodDefault: missing key → default; key present with undefined → default
	 * - ZodPrefault: missing key → default; key present with undefined → undefined
	 * - Both allow `null` if marked as nullable.
	 *
	 * This difference impacts TypeScript inferred types too: `.default()` results in a non-optional property type, while `.prefault()` results in an optional property type.
	 */
	/** Unwrap ZodDefault, ZodOptional, and ZodNullable to get to the core schema **/
	if (ctx.resolverUtils.prefault?.is(schema)) {
		const result = ctx.resolverUtils.prefault.build(schema);
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				acc: ctx.acc,
				default: result.defaultValue,
				/** NOTE: No need to change optional here, it already keeps it optional */
			}).node,
		};
	}
	if (ctx.resolverUtils.default?.is(schema)) {
		const result = ctx.resolverUtils.default.build(schema);
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				acc: ctx.acc,
				default: result.defaultValue,
				optional: false,
			}).node,
		};
	}
	if (ctx.resolverUtils.readonly?.is(schema)) {
		const result = ctx.resolverUtils.readonly.build(schema);
		return resolverBuilder(result.innerSchema, {
			...ctx,
			readonly: true,
		});
	}
	if (ctx.resolverUtils.nonOptional?.is(schema)) {
		const result = ctx.resolverUtils.nonOptional.build(schema);
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				optional: false,
				nullable: false,
			}).node,
		};
	}
	if (ctx.resolverUtils.optional?.is(schema)) {
		const result = ctx.resolverUtils.optional.build(schema);
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				optional: true,
			}).node,
		};
	}
	if (ctx.resolverUtils.nullable?.is(schema)) {
		const result = ctx.resolverUtils.nullable.build(schema);
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: resolverBuilder(result.innerSchema, {
				...ctx,
				nullable: true,
			}).node,
		};
	}
	/* End unwrap **/

	if (ctx.currentParentNode[fnConfigKeyCONFIG].level !== "temp-root") {
		throw new Error(""); // primitives aren't not allowed to be the root
	}

	/** Handle lazy evaluation */
	/**
	 *  If it's lazy evaluated, and it's here at this point, then it's likely a descendant/child of a collectable type _(object, array, tuple, record)_
	 * so we first the current child key
	 * if it's on the node parent and it's descriptor has a `get` _(it should be else either that or undefined if not we should throw an error)_ then we will only add a resolve function that hold the data needed at this point and _no lazy evaluation_ on  `ctx.lazyPathToLazyNodesAccMap: Map<PathSegmentItem, (() => FieldNode)[]>;`
	 * else we attach the lazy-level to the parent node byy it's key and when accessed we resolve it's node from `ctx.lazyPathToLazyNodesAccMap: Map<PathSegmentItem, (() => FieldNode)[]>;`
	 */
	if (ctx.inheritedMetadata?.isLazyEvaluated) {
		const pathString = ctx.currentParentPathString;
		const childKey = ctx.childKey;
		/**
		 * To avoid race conditions and make sure all resolvers complete before any merging happens --- isolates resolution
		 * this is needed to make sure it's isolated from the main node tree during resolution
		 * Final result is atomic - either fully resolved or not resolved
		 */
		const tempCurrentParentNode = {
			[fnConfigKeyCONFIG]: {
				level: "temp-parent",
				pathString: ctx.currentParentNode[fnConfigKeyCONFIG].pathString,
				pathSegments: ctx.currentParentNode[fnConfigKeyCONFIG].pathSegments,
				constraints: {},
				validation: {
					validate: () => {
						throw new Error("");
					},
				},
				userMetadata: {},
			} as FieldNodeConfigTempParentLevel,
		};

		/** Create resolver function that captures current context */
		const resolverFn = () =>
			resolverBuilder(schema, {
				...ctx,
				currentParentNode: tempCurrentParentNode,
				inheritedMetadata: { ...ctx.inheritedMetadata, isLazyEvaluated: false },
			}).node as FieldNode;

		/** Check if parent already has lazy getter for this child */
		const parentDescriptor = Object.getOwnPropertyDescriptor(
			ctx.currentParentNode,
			childKey,
		);

		if (parentDescriptor?.get) {
			/** Case A: Collision - add to existing collection */
			const existing = ctx.acc.lazyPathToLazyNodesAccMap.get(pathString) ?? [];
			existing.push(resolverFn);
			ctx.acc.lazyPathToLazyNodesAccMap.set(pathString, existing);

			/** Return reference to existing lazy node */
			return {
				resolvedPathToNode: ctx.acc.resolvedPathToNode,
				node: ctx.currentParentNode[childKey] as FieldNode,
			};
		} else {
			/** Case B: First encounter - create lazy getter and collection */
			const resolvers = [resolverFn];
			ctx.acc.lazyPathToLazyNodesAccMap.set(pathString, resolvers);

			/** Create lazy getter that resolves from collection */
			Object.defineProperty(ctx.currentParentNode, childKey, {
				enumerable: true,
				configurable: true,
				writable: true,
				get() {
					const allResolvers =
						ctx.acc.lazyPathToLazyNodesAccMap.get(pathString) || [];

					/** Now we should loop on the resolvers and everything is right, the `pushToAcc` should have resolved and handled this path */
					for (const resolver of allResolvers) resolver();

					/** Clean up collection after resolution */
					ctx.acc.lazyPathToLazyNodesAccMap.delete(pathString);
					// biome-ignore lint/suspicious/noTsIgnore: <explanation>
					// @ts-ignore
					const resolvedNode = tempCurrentParentNode[childKey];

					/* Clean up the temp reference */
					// biome-ignore lint/suspicious/noTsIgnore: <explanation>
					// @ts-ignore
					tempCurrentParentNode[childKey] = undefined;

					// So we should be access the finalized resolved node directly
					return resolvedNode;
				},
			});

			return {
				resolvedPathToNode: ctx.acc.resolvedPathToNode,
				get node() {
					// biome-ignore lint/suspicious/noTsIgnore: <explanation>
					// @ts-ignore
					return tempCurrentParentNode[childKey];
				},
			};
		}
	}
	/* End lazy evaluation */

	if (ctx.resolverUtils.string.is(schema)) {
		const result = ctx.resolverUtils.string.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const config: FieldNodeConfigStringPrimitiveLevel = {
			level: "string",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.number.is(schema)) {
		const result = ctx.resolverUtils.number.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const config: FieldNodeConfigNumberPrimitiveLevel = {
			level: "number",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.bigInt.is(schema)) {
		const result = ctx.resolverUtils.bigInt.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const config: FieldNodeConfigBigIntPrimitiveLevel = {
			level: "bigint",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.date.is(schema)) {
		const result = ctx.resolverUtils.date.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});

		const config: FieldNodeConfigDatePrimitiveLevel = {
			level: "date",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.boolean.is(schema)) {
		const result = ctx.resolverUtils.boolean.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigBooleanPrimitiveLevel = {
			level: "boolean",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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
	if (ctx.resolverUtils.file.is(schema)) {
		const result = ctx.resolverUtils.file.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigFilePrimitiveLevel = {
			level: "file",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	if (ctx.resolverUtils.unknown.is(schema)) {
		const result = ctx.resolverUtils.unknown.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigUnknownLevel = {
			level: "unknown",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	if (ctx.resolverUtils.undefined.is(schema)) {
		const result = ctx.resolverUtils.undefined.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigUndefinedLevel = {
			level: "undefined",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	if (ctx.resolverUtils.null.is(schema)) {
		const result = ctx.resolverUtils.null.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigNullLevel = {
			level: "null",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	if (ctx.resolverUtils.void.is(schema)) {
		const result = ctx.resolverUtils.void.build(schema, {
			optional: ctx.optional,
			nullable: ctx.nullable,
			readonly: ctx.readonly,
			currentParentPathString: currentParentPathString,
			currentParentPathSegments: currentParentPathSegments,
			currentSchema: ctx.currentSchema,
			currentAttributes: ctx.currentAttributes,
		});
		const config: FieldNodeConfigVoidLevel = {
			level: "void",
			pathString: currentParentPathString,
			pathSegments: currentParentPathSegments,
			default: ctx.default,
			constraints: result.constraints,
			validation: {
				validate: result.validate,
			},
			userMetadata: result.userMetadata,
			metadata: result.userMetadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	/** If we reached here, then it's an unhandled primitive type **/
	console.warn("Unhandled schema type:", schema);
	return {
		resolvedPathToNode: ctx.acc.resolvedPathToNode,
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

	/** End primitives **/
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
	options: { skipCache?: boolean; isLazyEvaluated?: boolean } = {},
): {
	node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
	__?: {
		/** This will be used for the form fields options */
		input: z.input<ZodSchema>;
		/** This will be used for the validation final result */
		output: z.output<ZodSchema>;
		/** Q: But is there a case where we need to infer the _path_ output from a _trie node_? */
	};
} {
	/** Preserving top-level cache only - no deeper than this to make sure we preserve the correct paths */
	if (!options.skipCache && schemaPathCache.has(schema)) {
		return schemaPathCache.get(schema) as {
			node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
			/** This will be used */
			__?: {
				/** This will be used for the form fields options */
				input: z.input<ZodSchema>;
				/** This will be used for the validation final result */
				output: z.output<ZodSchema>;
				/** Q: But is there a case where we need to infer the _path_ output from a _trie node_? */
			};
		};
	}

	const rootNode: InternalFieldNode = {
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

	const result = resolverBuilder(schema, {
		acc: {
			resolvedPathToNode: {},
			node: rootNode,
			lazyPathToLazyNodesAccMap: new Map(),
		},
		currentParentPathString: "",
		currentParentPathSegments: [],
		inheritedMetadata: {
			isLazyEvaluated: !!options.isLazyEvaluated,
		},
		currentSchema: schema,
		currentParentNode: {
			[fnConfigKeyCONFIG]: {
				level: "never",
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
		},
		childKey: "",
		resolverUtils: zodLibUtil,
	});
	schemaPathCache.set(schema, result);
	return result as unknown as {
		node: ZodResolverFieldNodeResult<z.input<ZodSchema>, z.output<ZodSchema>>;
		/** Record<string, FieldNode>; */
		/** This will be used */
		__?: {
			/** This will be used for the form fields options */
			input: z.input<ZodSchema>;
			/** This will be used for the validation final result */
			output: z.output<ZodSchema>;
			/** Q: But is there a case where we need to infer the _path_ output from a _trie node_? */
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
	/** Common attributes for all field types */
	const attributes: Record<string, any> = {
		name: config.pathString,
		required: config.constraints?.presence === "required",
		readonly: config.constraints?.readonly,
	};

	if (config.constraints?.presence === "required") attributes.required = true;
	if (config.constraints?.readonly) attributes.readonly = true;
	if (config.default !== undefined) attributes.defaultValue = config.default;

	/** Set HTML input type based on field type */
	switch (config.level) {
		case "string": {
			attributes.type = "text";

			/** String-specific validations */
			if (config.constraints?.minLength !== undefined)
				attributes.minLength = config.constraints.minLength;

			if (config.constraints?.maxLength !== undefined)
				attributes.maxLength = config.constraints.maxLength;

			/** Convert Regex pattern to HTML pattern */
			/** Note: HTML pattern doesn't use flags and needs string format */
			if (config.constraints?.regex)
				attributes.pattern = config.constraints.regex.source;

			break;
		}

		case "number": {
			attributes.type = "number";

			/** Number-specific validations */
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

			/** Number-specific validations */
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

			/** Date-specific validations */
			if (config.constraints?.min instanceof Date)
				attributes.min = config.constraints.min.toISOString().split("T")[0];
			if (config.constraints?.max instanceof Date)
				attributes.max = config.constraints.max.toISOString().split("T")[0];
			break;
		}

		case "file": {
			attributes.type = "file";

			/** File-specific attributes */
			if (config.constraints?.mimeTypes)
				attributes.accept = Array.isArray(config.constraints.mimeTypes)
					? config.constraints.mimeTypes.join(",")
					: config.constraints.mimeTypes;

			break;
		}

		case "array":
		case "tuple":
			/** attributes['data-field-type'] = 'array'; */
			/** attributes['data-item-path'] = `${config.pathString}.${FieldTokenMap.arrayItem}`; */
			if (config.constraints.minLength)
				attributes.min = config.constraints.minLength;
			if (config.constraints.maxLength)
				attributes.max = config.constraints.maxLength;
			attributes.multiple = true;
			break;

		default: {
			/** For other primitives, use text input as fallback */
			attributes.type = "text";
		}
	}

	return attributes;
}
