import { fieldNodeTokenEnum, fnConfigKey } from "../constants.js";

interface TResolverUtilsShapeBase {
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
	unsupportedField: any;
	UnreachableField: any;
}

import type {
	FieldNode,
	FieldNodeConfigArrayLevel,
	FieldNodeConfigBigIntPrimitiveLevel,
	FieldNodeConfigBooleanPrimitiveLevel,
	FieldNodeConfigDatePrimitiveLevel,
	FieldNodeConfigFilePrimitiveLevel,
	FieldNodeConfigNullLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigObjectLevel,
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
} from "../fields/shape/types.ts";
import type {
	AnyRecord,
	FieldNodeConfigPresence,
	Literal,
	PathSegmentItem,
	PathSegmentsToString,
} from "../shared/types.ts";
import type {
	CurrentAttributes,
	InheritedMetadata,
	InternalResolverAcc,
	ResolverUtils,
} from "./types.ts";

/**
 * Update the accumulator with the new node at the given path, merging if necessary
 * handles intersection/union merging conflicts and metadata propagation
 */
function pushToAcc<TResolverUtilsShape extends TResolverUtilsShapeBase>(props: {
	pathString: string;
	acc: InternalResolverAcc;
	node: InternalFieldNode;
	currentAttributes: CurrentAttributes | undefined;
	inheritedMetadata: InheritedMetadata;
	currentParentNode: InternalFieldNode;
	childKey: string | number;
	resolverUtils: ResolverUtils<TResolverUtilsShape>;
}): InternalResolverAcc & { isNew: boolean } {
	let isNew = true;
	let existingNode: InternalFieldNode | undefined =
		props.acc.resolvedPathToNode[props.pathString];

	if (existingNode && existingNode[fnConfigKey].level !== "temp-root") {
		isNew = false;

		/** Should do something here to handle if it's `isLazilyEvaluated` as `true` */
		if (existingNode.metadata?.intersectionItem) {
			existingNode = resolveIntersectionItemConfig({
				acc: props.acc,
				existingNode: existingNode,
				newNode: props.node,
				resolverUtils: props.resolverUtils,
			});

			if (!existingNode) {
				throw new Error("Could not resolve intersection item");
			}

			if (existingNode[fnConfigKey].level === "never") {
				/** If it was marked as never, we need to update the inheritedMetadata to have isMarkedNever true */
				props.inheritedMetadata.isMarkedNever = true;
			}
		}

		/** Should do something here to handle if it's `isLazilyEvaluated` as `true` */
		if (
			existingNode[fnConfigKey].level &&
			existingNode[fnConfigKey].level === "union-descendant"
		) {
			/** TODO: needs to check the `isMarkedNever` */
			/** Merge union-descendant options */
			const itemsToPush =
				props.node[fnConfigKey].level === "union-descendant"
					? props.node[fnConfigKey].options
					: [props.node];
			existingNode[fnConfigKey].options.push(...(itemsToPush as FieldNode[]));
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
	const metadata = (newNode[fnConfigKey].metadata ??= {});
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
				[fnConfigKey]: {
					level: "union-descendant",
					options: [oldNode as FieldNode],
					pathString: oldNode[fnConfigKey].pathString,
					pathSegments: oldNode[fnConfigKey].pathSegments,
					// Q: default: ctx.default, // Can we pass it from the root somehow? maybe also make it lazy calculated/computed and cached? or just ignore it for union-descendant? is there a use case that needs it and can't be handled easily otherwise?
					constraints: {},
					validation: {
						async validate(value, options): Promise<ValidateReturnShape> {
							const config = newNode[
								fnConfigKey
							] as FieldNodeConfigUnionDescendantLevel;
							for (let i = 0; i < config.options.length; i++) {
								const opt = config.options[i];
								if (!opt) {
									console.warn(
										`\`${config.pathString}.options[${i}]\` is undefined`,
									);
									continue;
								}
								const { result } = await opt[fnConfigKey].validation.validate(
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
											pathString: config.pathString as PathSegmentsToString<
												typeof config.pathSegments
											>,
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

export const calcPresence = (
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
export function tagToOptionIndexSetGuard(
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

/**
 * Update it on the `pathToResolverConfig` by using the `path`
 * @warning it's not accounting for "union-root" yet or recursive compatible intersections
 */
function resolveIntersectionItemConfig<
	TResolverUtilsShape extends TResolverUtilsShapeBase,
>(props: {
	acc: InternalResolverAcc;
	existingNode: InternalFieldNode | undefined;
	newNode: InternalFieldNode;
	resolverUtils: ResolverUtils<TResolverUtilsShape>;
}): InternalFieldNode {
	const existingNode = props.existingNode;
	if (existingNode) {
		if (existingNode[fnConfigKey].level === props.newNode[fnConfigKey].level) {
			const newConfig = props.newNode[fnConfigKey];
			const existingConfig = existingNode[fnConfigKey];

			const newMetadata = props.newNode[fnConfigKey].metadata;
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
					props.newNode[fnConfigKey].pathString
				][fnConfigKey] = {
					level: "never",
					pathString: existingNode[fnConfigKey].pathString,
					pathSegments: existingNode[fnConfigKey].pathSegments,
					constraints: {},
					validation: {
						validate: async (value, options) =>
							// TODO: implement on `props.resolverUtils` the `UnreachableField`
							props.resolverUtils.UnreachableField({
								value,
								currentParentPathString: existingNode[fnConfigKey].pathString,
								currentParentSegments: existingNode[fnConfigKey].pathSegments,
								// TODO: improve
								reason: "intersection-conflict",
								options,
							}),
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

	props.acc.resolvedPathToNode[props.newNode[fnConfigKey].pathString] =
		props.newNode;
	return props.newNode;
}

/**
 * handles schema → node transformation
 */
export function resolverBuilder<
	TResolverUtilsShape extends TResolverUtilsShapeBase,
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
		acc: InternalResolverAcc;
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
			[fnConfigKey]: {
				level: "array",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.metadata,
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
				resolverUtils: ctx.resolverUtils,
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
			[fnConfigKey]: {
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
				resolverUtils: ctx.resolverUtils,
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
			[fnConfigKey]: {
				level: "record",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.metadata,
			} as FieldNodeConfigRecordLevel,
		};

		// TODO:
		// Use `result.keySchema` to make a `FieldNode` that you can add to the `"record"` level config constraints as `key` _(will think of better name)`

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
				resolverUtils: ctx.resolverUtils,
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
			[fnConfigKey]: {
				level: "object",
				pathString: currentParentPathString,
				pathSegments: currentParentPathSegments,
				default: ctx.default,
				constraints: result.constraints,
				validation: {
					validate: result.validate,
				},
				userMetadata: result.userMetadata,
				metadata: result.metadata,
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
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
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
			node: { [fnConfigKey]: config },
			pathString: currentParentPathString,
			currentAttributes: ctx.currentAttributes,
			inheritedMetadata: ctx.inheritedMetadata,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
			resolverUtils: ctx.resolverUtils,
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
	 *
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
	 * - z.ZodSymbol
	 * - z.ZodNaN
	 * - z.ZodTemplateLiteral
	 * - z.ZodPromise
	 */

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

	if (ctx.currentParentNode[fnConfigKey].level !== "temp-root") {
		throw new Error("Primitives cannot be the root schema");
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
			[fnConfigKey]: {
				level: "temp-parent",
				pathString: ctx.currentParentNode[fnConfigKey].pathString,
				pathSegments: ctx.currentParentNode[fnConfigKey].pathSegments,
				constraints: {},
				validation: {
					validate: () => {
						throw new Error("This is a temp node, should not be validated");
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
				get() {
					const allResolvers =
						ctx.acc.lazyPathToLazyNodesAccMap.get(pathString);

					if (!allResolvers) {
						throw new Error("No resolvers found for lazy path!");
					}

					/** Now we should loop on the resolvers and everything is right, the `pushToAcc` should have resolved and handled this path */
					for (const resolver of allResolvers) resolver();

					// biome-ignore lint/suspicious/noTsIgnore: <explanation>
					// @ts-ignore
					const resolvedNode = tempCurrentParentNode[childKey];
					// Replace the lazy getter with the finalized resolved node
					// so next time it's accessed directly
					Object.defineProperty(ctx.currentParentNode, childKey, {
						enumerable: true,
						configurable: true,
						writable: true,
						value: resolvedNode,
					});

					/* Clean up the temp reference */
					// biome-ignore lint/suspicious/noTsIgnore: <explanation>
					// @ts-ignore
					tempCurrentParentNode[childKey] = undefined;
					/** Clean up collection after resolution */
					ctx.acc.lazyPathToLazyNodesAccMap.delete(pathString);

					// Return the finalized resolved node so we should be access it directly
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
			metadata: result.metadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				pathString: currentParentPathString,
				node: { [fnConfigKey]: config },
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};

		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
			metadata: result.metadata,
		};
		return {
			resolvedPathToNode: ctx.acc.resolvedPathToNode,
			node: pushToAcc({
				acc: ctx.acc,
				node: { [fnConfigKey]: config },
				pathString: currentParentPathString,
				currentAttributes: ctx.currentAttributes,
				inheritedMetadata: ctx.inheritedMetadata,
				currentParentNode: ctx.currentParentNode,
				childKey: ctx.childKey,
				resolverUtils: ctx.resolverUtils,
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
				[fnConfigKey]: {
					level: "unknown",
					pathString: currentParentPathString,
					pathSegments: currentParentPathSegments,
					userMetadata: {},
					default: ctx.default,
					constraints: { presence: calcPresence(ctx), readonly: ctx.readonly },
					validation: {
						validate(value, options) {
							return ctx.resolverUtils.unsupportedField({
								value,
								currentParentPathString: currentParentPathString,
								currentParentSegments: currentParentPathSegments,
								schema: ctx.currentSchema,
								options,
							});
						},
					},
				},
			},
			inheritedMetadata: ctx.inheritedMetadata,
			pathString: currentParentPathString,
			currentAttributes: ctx.currentAttributes,
			currentParentNode: ctx.currentParentNode,
			childKey: ctx.childKey,
			resolverUtils: ctx.resolverUtils,
		}).node,
	};

	/** End primitives **/
}
