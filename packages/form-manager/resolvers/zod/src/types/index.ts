// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import type z from "zod/v4";

export const name = "form-manager-resolver-zod";

import type {
	FieldNode,
	FieldNodeConfigArrayLevel,
	FieldNodeConfigBigIntPrimitiveLevel,
	FieldNodeConfigBooleanPrimitiveLevel,
	FieldNodeConfigDatePrimitiveLevel,
	FieldNodeConfigFilePrimitiveLevel,
	FieldNodeConfigNeverLevel,
	FieldNodeConfigNullLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigObjectLevel,
	FieldNodeConfigRecordLevel,
	FieldNodeConfigStringPrimitiveLevel,
	FieldNodeConfigTupleLevel,
	FieldNodeConfigUndefinedLevel,
	FieldNodeConfigUnionDescendantLevel,
	FieldNodeConfigUnionRootLevel,
	FieldNodeConfigUnknownLevel,
	FieldNodeConfigVoidLevel,
} from "@de100/form-manager-core/fields/shape/types";
import type {
	AnyRecord,
	FieldNodeConfigTokenEnum,
	Literal,
	PathSegmentItem,
} from "@de100/form-manager-core/shared/types";
import type { ZodAny } from "./internal.ts";

type ZodTupleItemResolverMap<
	T extends readonly ZodAny[],
	PathSegments extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = {
	[K in keyof T as K extends `${number}`
		? K
		: never]: ZodResolverFieldNodeResult<
		T[K] extends ZodAny ? T[K] : never,
		T[K] extends ZodAny ? T[K] : never,
		[...PathSegments, K extends `${infer TNum extends number}` ? TNum : never],
		Options
	>;
};

type AttachCollectableTypeFieldNodeNodesToUnionRootResolverMap<
	Options extends readonly any[],
	PathSegments extends PathSegmentItem[] = [],
> = (Options extends readonly (infer UnionItem)[]
	? UnionItem extends z.ZodRecord
		? {
				[Key in FieldNodeConfigTokenEnum["recordProperty"]]: ZodResolverFieldNodeResult<
					UnionItem["valueType"],
					UnionItem["valueType"],
					[...PathSegments, FieldNodeConfigTokenEnum["recordProperty"]],
					{ isUnionRootDescendant: true }
				>;
			}
		: UnionItem extends z.ZodObject
			? {
					[key in keyof UnionItem["shape"]]: ZodResolverFieldNodeResult<
						UnionItem["shape"][key],
						UnionItem["shape"][key],
						[...PathSegments, Extract<key, string>],
						{ isUnionRootDescendant: true }
					>;
				}
			: UnionItem extends z.ZodArray
				? {
						[Key in FieldNodeConfigTokenEnum["arrayItem"]]: ZodResolverFieldNodeResult<
							UnionItem["element"],
							UnionItem["element"],
							[...PathSegments, FieldNodeConfigTokenEnum["arrayItem"]],
							{ isUnionRootDescendant: true }
						>;
					}
				: UnionItem extends z.ZodTuple
					? ZodTupleItemResolverMap<
							UnionItem["def"]["items"],
							PathSegments,
							{ isUnionRootDescendant: true }
						>
					: AnyRecord
	: AnyRecord) & {
	[Key in FieldNodeConfigTokenEnum["unionOptionOn"]]: {
		[K in keyof Options as K extends `${number}`
			? K
			: never]: ZodResolverFieldNodeResult<
			Options[K] extends z.ZodTypeAny | z.core.$ZodType<any, any, any>
				? Options[K]
				: never,
			Options[K] extends z.ZodTypeAny | z.core.$ZodType<any, any, any>
				? Options[K]
				: never,
			[...PathSegments, K extends `${infer TNum extends number}` ? TNum : never]
		>;
	};
};

export type ZodLiteralString = z.ZodLiteral & {
	def: {
		values: string[];
	};
};
export type ZodLiteralNumber = z.ZodLiteral & {
	def: {
		values: number[];
	};
};
export type ZodLiteralBigInt = z.ZodLiteral & {
	def: {
		values: bigint[];
	};
};
export type ZodLiteralBoolean = z.ZodLiteral & {
	def: {
		values: boolean[];
	};
};
export type ZodLiteralNull = z.ZodLiteral & {
	def: {
		values: null[];
	};
};
export type ZodLiteralUndefined = z.ZodLiteral & {
	def: {
		values: undefined[];
	};
};

// ({} as ZodLiteralString).def.

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

export type ZodResolverFieldNodeResult<
	ZodSchemaToUnwrap extends ZodAny,
	ZodSchemaToInfer extends ZodAny = ZodSchemaToUnwrap,
	PathSegments extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = ZodSchemaToUnwrap extends
	| z.ZodPrefault
	| z.ZodDefault
	| z.ZodNonOptional
	| z.ZodReadonly
	| z.ZodOptional
	| z.ZodNullable
	? ZodResolverFieldNodeResult<
			ZodSchemaToUnwrap["def"]["innerType"],
			ZodSchemaToInfer,
			PathSegments
		>
	: ZodSchemaToUnwrap extends
				| z.ZodString
				| ZodLiteralString
				| z.ZodEnum
				| z.ZodStringFormat
		? FieldNode<
				z.input<ZodSchemaToInfer>,
				z.output<ZodSchemaToInfer>,
				Options extends { isUnionRootDescendant: true }
					? FieldNodeConfigUnionDescendantLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathSegments
						>
					: FieldNodeConfigStringPrimitiveLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathSegments
						>
			>
		: ZodSchemaToUnwrap extends
					| z.ZodNumber
					| z.ZodNumberFormat
					| ZodLiteralNumber
			? FieldNode<
					z.input<ZodSchemaToInfer>,
					z.output<ZodSchemaToInfer>,
					Options extends { isUnionRootDescendant: true }
						? FieldNodeConfigUnionDescendantLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathSegments
							>
						: FieldNodeConfigNumberPrimitiveLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathSegments
							>
				>
			: ZodSchemaToUnwrap extends
						| z.ZodBigInt
						| z.ZodBigIntFormat
						| ZodLiteralBigInt
				? FieldNode<
						z.input<ZodSchemaToInfer>,
						z.output<ZodSchemaToInfer>,
						Options extends { isUnionRootDescendant: true }
							? FieldNodeConfigUnionDescendantLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathSegments
								>
							: FieldNodeConfigBigIntPrimitiveLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathSegments
								>
					>
				: ZodSchemaToUnwrap extends z.ZodBoolean | ZodLiteralBoolean
					? FieldNode<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							Options extends { isUnionRootDescendant: true }
								? FieldNodeConfigUnionDescendantLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathSegments
									>
								: FieldNodeConfigBooleanPrimitiveLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathSegments
									>
						>
					: ZodSchemaToUnwrap extends z.ZodFile
						? FieldNode<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								Options extends { isUnionRootDescendant: true }
									? FieldNodeConfigUnionDescendantLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathSegments
										>
									: FieldNodeConfigFilePrimitiveLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathSegments
										>
							>
						: ZodSchemaToUnwrap extends z.ZodDate
							? FieldNode<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									Options extends { isUnionRootDescendant: true }
										? FieldNodeConfigUnionDescendantLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathSegments
											>
										: FieldNodeConfigDatePrimitiveLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathSegments
											>
								>
							: ZodSchemaToUnwrap extends z.ZodUndefined | ZodLiteralUndefined
								? FieldNode<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										Options extends { isUnionRootDescendant: true }
											? FieldNodeConfigUnionDescendantLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathSegments
												>
											: FieldNodeConfigUndefinedLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathSegments
												>
									>
								: ZodSchemaToUnwrap extends z.ZodNull | ZodLiteralNull
									? FieldNode<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											Options extends { isUnionRootDescendant: true }
												? FieldNodeConfigUnionDescendantLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathSegments
													>
												: FieldNodeConfigNullLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathSegments
													>
										>
									: ZodSchemaToUnwrap extends z.ZodVoid
										? FieldNode<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												Options extends { isUnionRootDescendant: true }
													? FieldNodeConfigUnionDescendantLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathSegments
														>
													: FieldNodeConfigVoidLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathSegments
														>
											>
										: ZodSchemaToUnwrap extends z.ZodNever
											? FieldNode<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													Options extends { isUnionRootDescendant: true }
														? FieldNodeConfigUnionDescendantLevel<
																z.input<ZodSchemaToInfer>,
																z.output<ZodSchemaToInfer>,
																PathSegments
															>
														: FieldNodeConfigNeverLevel<
																never, // z.input<ZodSchemaToInfer>,
																never, // z.output<ZodSchemaToInfer>,
																PathSegments
															>
												>
											: // ------------------------------------------------
												//  RECORD  (z.record(...))
												// ------------------------------------------------
												ZodSchemaToUnwrap extends z.ZodRecord
												? FieldNode<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														Options extends { isUnionRootDescendant: true }
															? FieldNodeConfigUnionDescendantLevel<
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>,
																	PathSegments
																>
															: FieldNodeConfigRecordLevel<
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>,
																	PathSegments
																>
													> & {
														[Key in FieldNodeConfigTokenEnum["recordProperty"]]: ZodResolverFieldNodeResult<
															ZodSchemaToUnwrap["valueType"],
															ZodSchemaToUnwrap["valueType"],
															[
																...PathSegments,
																FieldNodeConfigTokenEnum["recordProperty"],
															],
															Options extends { isUnionRootDescendant: true }
																? { isUnionRootDescendant: true }
																: AnyRecord
														>;
													}
												: // ------------------------------------------------
													//  OBJECT  (z.object({...}))
													// ------------------------------------------------
													ZodSchemaToUnwrap extends z.ZodObject
													? FieldNode<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															Options extends { isUnionRootDescendant: true }
																? FieldNodeConfigUnionDescendantLevel<
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>,
																		PathSegments
																	>
																: FieldNodeConfigObjectLevel<
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>,
																		PathSegments
																	>
														> & {
															[key in keyof ZodSchemaToUnwrap["shape"]]: ZodResolverFieldNodeResult<
																ZodSchemaToUnwrap["shape"][key],
																ZodSchemaToUnwrap["shape"][key],
																[...PathSegments, Extract<key, string>],
																Options
															>;
														}
													: // ------------------------------------------------
														//  ARRAY  (z.array(...))
														// ------------------------------------------------
														ZodSchemaToUnwrap extends z.ZodArray
														? FieldNode<
																z.input<ZodSchemaToInfer>,
																z.output<ZodSchemaToInfer>,
																Options extends { isUnionRootDescendant: true }
																	? FieldNodeConfigUnionDescendantLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathSegments
																		>
																	: FieldNodeConfigArrayLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathSegments
																		>
															> & {
																[Key in FieldNodeConfigTokenEnum["arrayItem"]]: ZodResolverFieldNodeResult<
																	ZodSchemaToUnwrap["element"],
																	ZodSchemaToUnwrap["element"],
																	[
																		...PathSegments,
																		FieldNodeConfigTokenEnum["arrayItem"],
																	],
																	Options
																>;
															}
														: // ------------------------------------------------
															//  TUPLE  (z.tuple([...]))
															// ------------------------------------------------
															ZodSchemaToUnwrap extends z.ZodTuple
															? FieldNode<
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>,
																	Options extends {
																		isUnionRootDescendant: true;
																	}
																		? FieldNodeConfigUnionDescendantLevel<
																				z.input<ZodSchemaToInfer>,
																				z.output<ZodSchemaToInfer>,
																				PathSegments
																			>
																		: FieldNodeConfigTupleLevel<
																				z.input<ZodSchemaToInfer>,
																				z.output<ZodSchemaToInfer>,
																				PathSegments
																			>
																> &
																	ZodTupleItemResolverMap<
																		ZodSchemaToUnwrap["def"]["items"],
																		PathSegments,
																		Options
																	>
															: // ------------------------------------------------
																//  UNION  (z.union([...]))
																// ------------------------------------------------
																// :
																ZodSchemaToUnwrap extends
																		| z.ZodUnion
																		| z.ZodDiscriminatedUnion
																? FieldNode<
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>,
																		// TODO: FieldNodeConfigUnionDescendantLevel
																		FieldNodeConfigUnionRootLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathSegments,
																			{
																				tag: ZodSchemaToUnwrap extends z.ZodDiscriminatedUnion<
																					infer Options
																				>
																					? {
																							key: ZodSchemaToUnwrap["def"]["discriminator"];
																							values: ZodSchemaToUnwrap["def"]["discriminator"] extends keyof z.infer<
																								Options[number]
																							>
																								? Set<
																										z.infer<
																											Options[number]
																										>[ZodSchemaToUnwrap["def"]["discriminator"]] extends infer O
																											? O extends Literal
																												? O
																												: never
																											: never
																									>
																								: Set<Literal>;
																							valueToOptionIndex: ZodTagValueMap<
																								Options,
																								ZodSchemaToUnwrap["def"]["discriminator"]
																							>;
																						}
																					: undefined;
																			}
																		>
																	> &
																		AttachCollectableTypeFieldNodeNodesToUnionRootResolverMap<
																			ZodSchemaToUnwrap["def"]["options"],
																			PathSegments
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
																		ZodResolverFieldNodeResult<
																			// TODO: FieldNodeConfigUnionDescendantLevel
																			L,
																			L,
																			PathSegments,
																			Options
																		> &
																			ZodResolverFieldNodeResult<
																				// TODO: FieldNodeConfigUnionDescendantLevel
																				R,
																				R,
																				PathSegments,
																				Options
																			>
																	: ZodSchemaToUnwrap extends z.ZodPipe
																		? ZodResolverFieldNodeResult<
																				// TODO: FieldNodeConfigUnionDescendantLevel
																				ZodSchemaToUnwrap["def"]["out"],
																				ZodSchemaToInfer, // Q: is this correct
																				PathSegments,
																				Options
																			>
																		: FieldNode<
																				z.input<ZodSchemaToInfer>,
																				z.output<ZodSchemaToInfer>,
																				Options extends {
																					isUnionRootDescendant: true;
																				}
																					? FieldNodeConfigUnionDescendantLevel<
																							z.input<ZodSchemaToInfer>,
																							z.output<ZodSchemaToInfer>,
																							PathSegments
																						>
																					: FieldNodeConfigUnknownLevel<
																							z.input<ZodSchemaToInfer>,
																							z.output<ZodSchemaToInfer>,
																							PathSegments
																						>
																			>;
