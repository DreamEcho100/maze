// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import type z from "zod/v4";

export const name = "form-manager-resolver-zod";

import { formFieldTNTokenEnum } from "@de100/form-manager-core/constants";
import type {
	AnyRecord,
	Literal,
	NeverRecord,
	PathSegmentItem,
} from "@de100/form-manager-core/shared";
import type {
	FormFieldTN,
	FormFieldTNConfigArrayLevel,
	FormFieldTNConfigBigIntPrimitiveLevel,
	FormFieldTNConfigBooleanPrimitiveLevel,
	FormFieldTNConfigDatePrimitiveLevel,
	FormFieldTNConfigFilePrimitiveLevel,
	FormFieldTNConfigNeverLevel,
	FormFieldTNConfigNumberPrimitiveLevel,
	FormFieldTNConfigObjectLevel,
	FormFieldTNConfigRecordLevel,
	FormFieldTNConfigStringPrimitiveLevel,
	FormFieldTNConfigTupleLevel,
	FormFieldTNConfigUnionDescendantLevel,
	FormFieldTNConfigUnionRootLevel,
	FormFieldTNConfigUnknownLevel,
} from "@de100/form-manager-core/types/form-manger/fields/structure";
import type { ZodAny } from "./internal.ts";

export interface InheritedMetadata {
	intersectionItem?: {
		[pathString: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
	};
	unionRootDescendant?: {
		rootPathToInfo: Record<
			string,
			{
				rootPath: string;
				rootPathSegments: PathSegmentItem[];
				paths: Set<string>;
			}[]
		>;
	};
	isMarkedNever?: boolean;
}

export interface ZodResolverAcc {
	pathToNode: Record<string, FormFieldTN>;
	node: FormFieldTN;
}
export interface CurrentAttributes {
	isObjectProperty?: boolean;
	"array-item"?: boolean;
	isArrayTokenItem?: boolean;
	isTupleItem?: boolean;
	isRecordProperty?: boolean;
	isLazyChildren?: boolean;
}

type ZodTupleItemResolverMap<
	T extends readonly ZodAny[],
	PathAcc extends PathSegmentItem[] = [],
	Options extends { isUnionRootDescendant?: boolean } = {},
> = {
	[K in keyof T as K extends `${number}`
		? K
		: never]: ZodResolverFormFieldTNResult<
		T[K] extends ZodAny ? T[K] : never,
		T[K] extends ZodAny ? T[K] : never,
		[...PathAcc, K extends `${infer TNum extends number}` ? TNum : never],
		Options
	>;
};

type AttachCollectableTypeFormFieldTNNodesToUnionRootResolverMap<
	Options extends readonly any[],
	PathAcc extends PathSegmentItem[] = [],
> = (Options extends readonly (infer UnionItem)[]
	? UnionItem extends z.ZodRecord
		? {
				[formFieldTNTokenEnum.recordProperty]: ZodResolverFormFieldTNResult<
					UnionItem["valueType"],
					UnionItem["valueType"],
					[...PathAcc, typeof formFieldTNTokenEnum.recordProperty],
					{ isUnionRootDescendant: true }
				>;
			}
		: UnionItem extends z.ZodObject
			? {
					[key in keyof UnionItem["shape"]]: ZodResolverFormFieldTNResult<
						UnionItem["shape"][key],
						UnionItem["shape"][key],
						[...PathAcc, Extract<key, string>],
						{ isUnionRootDescendant: true }
					>;
				}
			: UnionItem extends z.ZodArray
				? {
						[formFieldTNTokenEnum.arrayItem]: ZodResolverFormFieldTNResult<
							UnionItem["element"],
							UnionItem["element"],
							[...PathAcc, typeof formFieldTNTokenEnum.arrayItem],
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
	[formFieldTNTokenEnum.unionOptionOn]: {
		[K in keyof Options as K extends `${number}`
			? K
			: never]: ZodResolverFormFieldTNResult<
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

export type ZodResolverFormFieldTNResult<
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
	? ZodResolverFormFieldTNResult<
			ZodSchemaToUnwrap["def"]["innerType"],
			ZodSchemaToInfer,
			PathAcc
		>
	: ZodSchemaToUnwrap extends
				| z.ZodString
				| z.ZodLiteral
				| z.ZodEnum
				| z.ZodStringFormat
		? FormFieldTN<
				Options extends { isUnionRootDescendant: true }
					? FormFieldTNConfigUnionDescendantLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathAcc
						>
					: FormFieldTNConfigStringPrimitiveLevel<
							z.input<ZodSchemaToInfer>,
							z.output<ZodSchemaToInfer>,
							PathAcc
						>
			>
		: ZodSchemaToUnwrap extends z.ZodNumber | z.ZodNumberFormat
			? FormFieldTN<
					Options extends { isUnionRootDescendant: true }
						? FormFieldTNConfigUnionDescendantLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathAcc
							>
						: FormFieldTNConfigNumberPrimitiveLevel<
								z.input<ZodSchemaToInfer>,
								z.output<ZodSchemaToInfer>,
								PathAcc
							>
				>
			: ZodSchemaToUnwrap extends z.ZodBigInt | z.ZodBigIntFormat
				? FormFieldTN<
						Options extends { isUnionRootDescendant: true }
							? FormFieldTNConfigUnionDescendantLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
							: FormFieldTNConfigBigIntPrimitiveLevel<
									z.input<ZodSchemaToInfer>,
									z.output<ZodSchemaToInfer>,
									PathAcc
								>
					>
				: ZodSchemaToUnwrap extends z.ZodBoolean
					? FormFieldTN<
							Options extends { isUnionRootDescendant: true }
								? FormFieldTNConfigUnionDescendantLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
								: FormFieldTNConfigBooleanPrimitiveLevel<
										z.input<ZodSchemaToInfer>,
										z.output<ZodSchemaToInfer>,
										PathAcc
									>
						>
					: ZodSchemaToUnwrap extends z.ZodFile
						? FormFieldTN<
								Options extends { isUnionRootDescendant: true }
									? FormFieldTNConfigUnionDescendantLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
									: FormFieldTNConfigFilePrimitiveLevel<
											z.input<ZodSchemaToInfer>,
											z.output<ZodSchemaToInfer>,
											PathAcc
										>
							>
						: ZodSchemaToUnwrap extends z.ZodDate
							? FormFieldTN<
									Options extends { isUnionRootDescendant: true }
										? FormFieldTNConfigUnionDescendantLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
										: FormFieldTNConfigDatePrimitiveLevel<
												z.input<ZodSchemaToInfer>,
												z.output<ZodSchemaToInfer>,
												PathAcc
											>
								>
							: // ------------------------------------------------
								//  RECORD  (z.record(...))
								// ------------------------------------------------
								ZodSchemaToUnwrap extends z.ZodRecord
								? FormFieldTN<
										Options extends { isUnionRootDescendant: true }
											? FormFieldTNConfigUnionDescendantLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
											: FormFieldTNConfigRecordLevel<
													z.input<ZodSchemaToInfer>,
													z.output<ZodSchemaToInfer>,
													PathAcc
												>
									> & {
										[formFieldTNTokenEnum.recordProperty]: ZodResolverFormFieldTNResult<
											ZodSchemaToUnwrap["valueType"],
											ZodSchemaToUnwrap["valueType"],
											[...PathAcc, typeof formFieldTNTokenEnum.recordProperty],
											Options extends { isUnionRootDescendant: true }
												? { isUnionRootDescendant: true }
												: AnyRecord
										>;
									}
								: // ------------------------------------------------
									//  OBJECT  (z.object({...}))
									// ------------------------------------------------
									ZodSchemaToUnwrap extends z.ZodObject
									? FormFieldTN<
											Options extends { isUnionRootDescendant: true }
												? FormFieldTNConfigUnionDescendantLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
												: FormFieldTNConfigObjectLevel<
														z.input<ZodSchemaToInfer>,
														z.output<ZodSchemaToInfer>,
														PathAcc
													>
										> & {
											[key in keyof ZodSchemaToUnwrap["shape"]]: ZodResolverFormFieldTNResult<
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
										? FormFieldTN<
												Options extends { isUnionRootDescendant: true }
													? FormFieldTNConfigUnionDescendantLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
													: FormFieldTNConfigArrayLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc
														>
											> & {
												[formFieldTNTokenEnum.arrayItem]: ZodResolverFormFieldTNResult<
													ZodSchemaToUnwrap["element"],
													ZodSchemaToUnwrap["element"],
													[...PathAcc, typeof formFieldTNTokenEnum.arrayItem],
													Options
												>;
											}
										: // ------------------------------------------------
											//  TUPLE  (z.tuple([...]))
											// ------------------------------------------------
											ZodSchemaToUnwrap extends z.ZodTuple
											? FormFieldTN<
													Options extends { isUnionRootDescendant: true }
														? FormFieldTNConfigUnionDescendantLevel<
																z.input<ZodSchemaToInfer>,
																z.output<ZodSchemaToInfer>,
																PathAcc
															>
														: FormFieldTNConfigTupleLevel<
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
												? FormFieldTN<
														FormFieldTNConfigUnionRootLevel<
															z.input<ZodSchemaToInfer>,
															z.output<ZodSchemaToInfer>,
															PathAcc,
															ZodSchemaToUnwrap extends z.ZodDiscriminatedUnion<
																infer Options
															>
																? {
																		tag: {
																			key: ZodSchemaToUnwrap["def"]["discriminator"];
																			values: ZodSchemaToUnwrap["def"]["discriminator"] extends keyof z.infer<
																				Options[number]
																			>
																				? Set<
																						z.infer<
																							Options[number]
																						>[ZodSchemaToUnwrap["def"]["discriminator"]]
																					>
																				: Set<Literal>;
																			valueToOptionIndex: ZodTagValueMap<
																				Options,
																				ZodSchemaToUnwrap["def"]["discriminator"]
																			>;
																		};
																	}
																: NeverRecord
														>
													> &
														AttachCollectableTypeFormFieldTNNodesToUnionRootResolverMap<
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
														ZodResolverFormFieldTNResult<
															L,
															L,
															PathAcc,
															Options
														> &
															ZodResolverFormFieldTNResult<
																R,
																R,
																PathAcc,
																Options
															>
													: ZodSchemaToUnwrap extends z.ZodPipe
														? ZodResolverFormFieldTNResult<
																ZodSchemaToUnwrap["def"]["out"],
																ZodSchemaToInfer, // Q: is this correct
																PathAcc,
																Options
															>
														: ZodSchemaToUnwrap extends z.ZodAny | z.ZodUnknown
															? FormFieldTN<
																	FormFieldTNConfigUnknownLevel<
																		PathAcc,
																		z.input<ZodSchemaToInfer>,
																		z.output<ZodSchemaToInfer>
																	>
																>
															: ZodSchemaToUnwrap extends z.ZodNever
																? FormFieldTN<
																		FormFieldTNConfigNeverLevel<
																			never,
																			never,
																			PathAcc
																		>
																	>
																: FormFieldTN<
																		FormFieldTNConfigUnknownLevel<
																			PathAcc,
																			z.input<ZodSchemaToInfer>,
																			z.output<ZodSchemaToInfer>
																		>
																	>;
