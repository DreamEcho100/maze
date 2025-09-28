/**
 * * TODO: revise the use of `z.core.$ZodCheck*`
 * It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
 * So we can have a common ground for different schema validators to work with the form manager.
 * And keep form state agnostic of the validator library.
 */

import { fnConfigKey } from "@de100/form-manager-core/constants";

// ZodCheckOverwriteDef
// ZodCheckPropertyDef

import type {
	FieldNode,
	FieldNodeConfig,
	FieldNodeConfigBigIntPrimitiveLevel,
	FieldNodeConfigBooleanPrimitiveLevel,
	FieldNodeConfigNullLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigStringPrimitiveLevel,
	FieldNodeConfigUndefinedLevel,
	FieldNodeConfigUnionRootLevel,
	InternalFieldNode,
	ValidateReturnShape,
} from "@de100/form-manager-core/fields/shape/types";
import {
	calcPresence,
	resolverBuilder,
	tagToOptionIndexSetGuard,
} from "@de100/form-manager-core/resolver-builder";
import type { ResolverUtils } from "@de100/form-manager-core/resolver-builder/types";
import type {
	FieldNodeConfigValidateOptions,
	Literal,
	PathSegmentItem,
	PathSegmentsToString,
} from "@de100/form-manager-core/shared/types";
import z, { unknown, ZodLiteral } from "zod";

import type {
	ZodLiteralBigInt,
	ZodLiteralBoolean,
	ZodLiteralNumber,
	ZodLiteralString,
	ZodResolverFieldNodeResult,
} from "./types/index.ts";

import type { ZodAny } from "./types/internal.ts";

export const name = "form-manager-resolver-zod";

async function customValidate<
	PathSegments extends PathSegmentItem[] = PathSegmentItem[],
	T = unknown,
>(
	props: {
		value: any;
		currentParentPathString: string;
		currentParentSegments: PathSegmentItem[];
		schema: unknown;
	},
	options: FieldNodeConfigValidateOptions,
): Promise<ValidateReturnShape<PathSegments, T>> {
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
						// pathString: (issue.path?.join(".") ||
						// 	props.currentParentPathString) as PathSegmentsToString<
						// 	PathSegments,
						// 	""
						// >,
						// pathSegments: (issue.path ||
						// 	props.currentParentSegments) as PathSegments,
						normalizedPathSegments: (typeof issue.path === "undefined" ||
						issue.path.length === 0
							? []
							: Array.isArray(issue.path)
								? issue.path
								: [issue.path]) as any,
						pathIssuerSegments: props.currentParentSegments,
						event: options.validationEvent,
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
						// pathString: props.currentParentPathString as PathSegmentsToString<
						// 	PathSegments,
						// 	""
						// >,
						// pathSegments: props.currentParentSegments as PathSegments,
						// TODO: get `normalizedPathSegments` some other way
						normalizedPathSegments: [] as any,
						pathIssuerSegments: props.currentParentSegments,
						event: options.validationEvent,
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
						// pathString: props.currentParentPathString as PathSegmentsToString<
						// 	PathSegments,
						// 	""
						// >,
						// pathSegments: props.currentParentSegments as PathSegments,
						// TODO: get `normalizedPathSegments` some other way
						normalizedPathSegments: [] as any,
						pathIssuerSegments: props.currentParentSegments,
						event: options.validationEvent,
					},
				],
			},
			metadata: { validationEvent: options.validationEvent },
		};
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

					const tagSchema: ZodAny = opt.def.shape[tag.key];

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
						`Discriminated union discriminator/tag must be either ZodLiteral or ZodEnum, got ${
							"def" in tagSchema
								? "typeName" in tagSchema.def
									? tagSchema.def.typeName
									: String(tagSchema)
								: String(tagSchema)
						}`,
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
				keySchema,
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
	unsupportedField(props) {
		return customValidate(
			{
				value: props.value,
				currentParentPathString: props.currentParentPathString,
				currentParentSegments: props.currentParentSegments,
				schema: props.schema,
			},
			props.options,
		);
	},
	UnreachableField(props) {
		return customValidate(
			{
				value: props.value,
				currentParentPathString: props.currentParentPathString,
				currentParentSegments: props.currentParentSegments,
				schema: z.never(),
			},
			props.options,
		);
	},
} satisfies ZodResolverUtils;

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
 * This is why there is a special token for array items: `@@__FN_TKN_ARR_ITEM__@@`, so we can optimize dependencies and validations for all items in an array.
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

	const rootNode = {
		[fnConfigKey]: {
			level: "temp-root",
			pathString: "",
			pathSegments: [] as string[],
			constraints: {},
			validation: {
				validate() {
					throw new Error("Not implemented");
				},
			},
			userMetadata: {},
		},
	} satisfies InternalFieldNode;

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
			[fnConfigKey]: {
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
