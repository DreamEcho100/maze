// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import type z from "zod/v4";

export const name = "form-manager-resolver-zod";

import { fieldNodeTokenEnum } from "@de100/form-manager-core/constants";
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
	Literal,
	PathSegmentItem,
} from "@de100/form-manager-core/shared/types";
import type { ZodAny } from "./internal.ts";

type ZodTupleItemResolverMap<
	T extends readonly ZodAny[],
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = {
	[K in keyof T as K extends `${number}`
		? K
		: never]: ZodResolverFieldNodeResult<
		T[K] extends ZodAny ? T[K] : never,
		T[K] extends ZodAny ? T[K] : never,
		[...PathAcc, K extends `${infer TNum extends number}` ? TNum : never],
		Options
	>;
};

type AttachCollectableTypeFieldNodeNodesToUnionRootResolverMap<
	Options extends readonly any[],
	PathAcc extends PathSegmentItem[] = [],
> = (Options extends readonly (infer UnionItem)[]
	? UnionItem extends z.ZodRecord
		? {
				[fieldNodeTokenEnum.recordProperty]: ZodResolverFieldNodeResult<
					UnionItem["valueType"],
					UnionItem["valueType"],
					[...PathAcc, typeof fieldNodeTokenEnum.recordProperty],
					{ isUnionRootDescendant: true }
				>;
			}
		: UnionItem extends z.ZodObject
			? {
					[key in keyof UnionItem["shape"]]: ZodResolverFieldNodeResult<
						UnionItem["shape"][key],
						UnionItem["shape"][key],
						[...PathAcc, Extract<key, string>],
						{ isUnionRootDescendant: true }
					>;
				}
			: UnionItem extends z.ZodArray
				? {
						[fieldNodeTokenEnum.arrayItem]: ZodResolverFieldNodeResult<
							UnionItem["element"],
							UnionItem["element"],
							[...PathAcc, typeof fieldNodeTokenEnum.arrayItem],
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
	[fieldNodeTokenEnum.unionOptionOn]: {
		[K in keyof Options as K extends `${number}`
			? K
			: never]: ZodResolverFieldNodeResult<
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
	PathAcc extends PathSegmentItem[] = [],
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
			PathAcc
		>
	: ZodSchemaToUnwrap extends
				| z.ZodString
				| ZodLiteralString
				| z.ZodEnum
				| z.ZodStringFormat
		? FieldNode<
				Options extends { isUnionRootDescendant: true }
					? FieldNodeConfigUnionDescendantLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathAcc
						>
					: FieldNodeConfigStringPrimitiveLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathAcc
						>
			>
		: ZodSchemaToUnwrap extends
					| z.ZodNumber
					| z.ZodNumberFormat
					| ZodLiteralNumber
			? FieldNode<
					Options extends { isUnionRootDescendant: true }
						? FieldNodeConfigUnionDescendantLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathAcc
							>
						: FieldNodeConfigNumberPrimitiveLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathAcc
							>
				>
			: ZodSchemaToUnwrap extends
						| z.ZodBigInt
						| z.ZodBigIntFormat
						| ZodLiteralBigInt
				? FieldNode<
						Options extends { isUnionRootDescendant: true }
							? FieldNodeConfigUnionDescendantLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
							: FieldNodeConfigBigIntPrimitiveLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
					>
				: ZodSchemaToUnwrap extends z.ZodBoolean | ZodLiteralBoolean
					? FieldNode<
							Options extends { isUnionRootDescendant: true }
								? FieldNodeConfigUnionDescendantLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
								: FieldNodeConfigBooleanPrimitiveLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
						>
					: ZodSchemaToUnwrap extends z.ZodFile
						? FieldNode<
								Options extends { isUnionRootDescendant: true }
									? FieldNodeConfigUnionDescendantLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
									: FieldNodeConfigFilePrimitiveLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
							>
						: ZodSchemaToUnwrap extends z.ZodDate
							? FieldNode<
									Options extends { isUnionRootDescendant: true }
										? FieldNodeConfigUnionDescendantLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
										: FieldNodeConfigDatePrimitiveLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
								>
							: ZodSchemaToUnwrap extends z.ZodUndefined | ZodLiteralUndefined
								? FieldNode<
										Options extends { isUnionRootDescendant: true }
											? FieldNodeConfigUnionDescendantLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
											: FieldNodeConfigUndefinedLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
									>
								: ZodSchemaToUnwrap extends z.ZodNull | ZodLiteralNull
									? FieldNode<
											Options extends { isUnionRootDescendant: true }
												? FieldNodeConfigUnionDescendantLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
												: FieldNodeConfigNullLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
										>
									: ZodSchemaToUnwrap extends z.ZodVoid
										? FieldNode<
												Options extends { isUnionRootDescendant: true }
													? FieldNodeConfigUnionDescendantLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
													: FieldNodeConfigVoidLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
											>
										: ZodSchemaToUnwrap extends z.ZodNever
											? FieldNode<
													Options extends { isUnionRootDescendant: true }
														? FieldNodeConfigUnionDescendantLevel<
																z.input<ZodSchemaToInfer>,
																z.output<ZodSchemaToInfer>,
																PathAcc
															>
														: FieldNodeConfigNeverLevel<
																never, // z.input<ZodSchemaToInfer>,
																never, // z.output<ZodSchemaToInfer>,
																PathAcc
															>
												>
											: // ------------------------------------------------
												//  RECORD  (z.record(...))
												// ------------------------------------------------
												ZodSchemaToUnwrap extends z.ZodRecord
												? FieldNode<
														Options extends { isUnionRootDescendant: true }
															? FieldNodeConfigUnionDescendantLevel<
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>,
																	PathAcc
																>
															: FieldNodeConfigRecordLevel<
																	z.input<ZodSchemaToInfer>,
																	z.output<ZodSchemaToInfer>,
																	PathAcc
																>
													> & {
														[fieldNodeTokenEnum.recordProperty]: ZodResolverFieldNodeResult<
															ZodSchemaToUnwrap["valueType"],
															ZodSchemaToUnwrap["valueType"],
															[
																...PathAcc,
																typeof fieldNodeTokenEnum.recordProperty,
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
															Options extends { isUnionRootDescendant: true }
																? FieldNodeConfigUnionDescendantLevel<
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>,
																		PathAcc
																	>
																: FieldNodeConfigObjectLevel<
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>,
																		PathAcc
																	>
														> & {
															[key in keyof ZodSchemaToUnwrap["shape"]]: ZodResolverFieldNodeResult<
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
														? FieldNode<
																Options extends { isUnionRootDescendant: true }
																	? FieldNodeConfigUnionDescendantLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathAcc
																		>
																	: FieldNodeConfigArrayLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathAcc
																		>
															> & {
																[fieldNodeTokenEnum.arrayItem]: ZodResolverFieldNodeResult<
																	ZodSchemaToUnwrap["element"],
																	ZodSchemaToUnwrap["element"],
																	[
																		...PathAcc,
																		typeof fieldNodeTokenEnum.arrayItem,
																	],
																	Options
																>;
															}
														: // ------------------------------------------------
															//  TUPLE  (z.tuple([...]))
															// ------------------------------------------------
															ZodSchemaToUnwrap extends z.ZodTuple
															? FieldNode<
																	Options extends {
																		isUnionRootDescendant: true;
																	}
																		? FieldNodeConfigUnionDescendantLevel<
																				z.input<ZodSchemaToInfer>,
																				z.output<ZodSchemaToInfer>,
																				PathAcc
																			>
																		: FieldNodeConfigTupleLevel<
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
																? FieldNode<
																		// TODO: FieldNodeConfigUnionDescendantLevel
																		FieldNodeConfigUnionRootLevel<
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>,
																			PathAcc,
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
																		ZodResolverFieldNodeResult<
																			// TODO: FieldNodeConfigUnionDescendantLevel
																			L,
																			L,
																			PathAcc,
																			Options
																		> &
																			ZodResolverFieldNodeResult<
																				// TODO: FieldNodeConfigUnionDescendantLevel
																				R,
																				R,
																				PathAcc,
																				Options
																			>
																	: ZodSchemaToUnwrap extends z.ZodPipe
																		? ZodResolverFieldNodeResult<
																				// TODO: FieldNodeConfigUnionDescendantLevel
																				ZodSchemaToUnwrap["def"]["out"],
																				ZodSchemaToInfer, // Q: is this correct
																				PathAcc,
																				Options
																			>
																		: FieldNode<
																				Options extends {
																					isUnionRootDescendant: true;
																				}
																					? FieldNodeConfigUnionDescendantLevel<
																							z.input<ZodSchemaToInfer>,
																							z.output<ZodSchemaToInfer>,
																							PathAcc
																						>
																					: FieldNodeConfigUnknownLevel<
																							z.input<ZodSchemaToInfer>,
																							z.output<ZodSchemaToInfer>,
																							PathAcc
																						>
																			>;
