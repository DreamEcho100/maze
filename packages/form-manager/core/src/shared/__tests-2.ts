import { fieldNodeTokenEnum, fnConfigKey } from "#constants";
import type { FieldPathToError } from "#fields/errors/types";
import type { FieldNode, ValidateReturnShape } from "#fields/shape/types";
import type {
	AnyRecord,
	DeepFieldNodePath,
	DeepFieldNodePathEntry,
	PathSegmentItem,
	PathSegmentsToString,
} from "./types";

type Pretty<T> = { [K in keyof T]: T[K] } & {};

type Test_SegmentsToStr = PathSegmentsToString<["a", 0, 0.1, "c"]>; // Expected: "a.b.c"
//	 ^?
/*
"a.0.c"
*/

const fieldNode = {
	[fnConfigKey]: {
		level: "object" as const,
		pathSegments: [] as const,
		pathString: "",
		constraints: {
			presence: "required",
			readonly: false,
		},
		userMetadata: {},
		validation: {
			validate: async (val: unknown) => {
				return {
					issues: null,
					data: val as object,
				} as unknown as ValidateReturnShape<PathSegmentItem[], AnyRecord>;
			},
		},
	},
	// a: {
	// 	[fnConfigKey]: {
	// 		level: "string" as const,
	// 		pathSegments: ["a"] as const,
	// 		pathString: "a",
	// 		constraints: {
	// 			presence: "required",
	// 			readonly: false,
	// 		},
	// 		userMetadata: {},
	// 		validation: {
	// 			validate: async (val: unknown) => {
	// 				return {
	// 					issues: null,
	// 					data: val as object,
	// 				} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
	// 			},
	// 		},
	// 	},
	// },
	// b: {
	// 	[fnConfigKey]: {
	// 		level: "number" as const,
	// 		pathSegments: ["b"] as const,
	// 		pathString: "b",
	// 		constraints: {
	// 			presence: "required",
	// 			readonly: false,
	// 		},
	// 		userMetadata: {},
	// 		validation: {
	// 			validate: async (val: unknown) => {
	// 				return {
	// 					issues: null,
	// 					data: val as object,
	// 				} as unknown as ValidateReturnShape<PathSegmentItem[], number>;
	// 			},
	// 		},
	// 	},
	// },
	// c: {
	// 	[fnConfigKey]: {
	// 		level: "array" as const,
	// 		pathSegments: [] as const,
	// 		pathString: "",
	// 		constraints: {
	// 			presence: "required",
	// 			readonly: false,
	// 		},
	// 		userMetadata: {},
	// 		validation: {
	// 			validate: async (val: unknown) => {
	// 				return {
	// 					issues: null,
	// 					data: val as object,
	// 				} as unknown as ValidateReturnShape<PathSegmentItem[], any[]>;
	// 			},
	// 		},
	// 	},
	// 	[fieldNodeTokenEnum.arrayItem]: {
	// 		[fnConfigKey]: {
	// 			level: "object" as const,
	// 			pathSegments: ["c", fieldNodeTokenEnum.arrayItem] as const,
	// 			pathString: `c.${fieldNodeTokenEnum.arrayItem}`,
	// 			constraints: {
	// 				presence: "required",
	// 				readonly: false,
	// 			},
	// 			userMetadata: {},
	// 			validation: {
	// 				validate: async (val: unknown) => {
	// 					return {
	// 						issues: null,
	// 						data: val as object,
	// 					} as unknown as ValidateReturnShape<PathSegmentItem[], AnyRecord>;
	// 				},
	// 			},
	// 		},
	// 		a: {
	// 			[fnConfigKey]: {
	// 				level: "string" as const,
	// 				pathSegments: ["c", fieldNodeTokenEnum.arrayItem, "a"] as const,
	// 				pathString: `c.${fieldNodeTokenEnum.arrayItem}.a`,
	// 				constraints: {
	// 					constraints: {
	// 						presence: "required",
	// 						readonly: false,
	// 					},
	// 					userMetadata: {},
	// 					validation: {
	// 						validate: async (val: unknown) => {
	// 							return {
	// 								issues: null,
	// 								data: val as object,
	// 							} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
	// 						},
	// 					},
	// 				},
	// 			},
	// 		},
	// 		b: {
	// 			[fnConfigKey]: {
	// 				level: "number" as const,
	// 				pathSegments: ["c", fieldNodeTokenEnum.arrayItem, "b"] as const,
	// 				pathString: `c.${fieldNodeTokenEnum.arrayItem}.b`,
	// 				constraints: {
	// 					presence: "required",
	// 					readonly: false,
	// 				},
	// 				userMetadata: {},
	// 				validation: {
	// 					validate: async (val: unknown) => {
	// 						return {
	// 							issues: null,
	// 							data: val as object,
	// 						} as unknown as ValidateReturnShape<PathSegmentItem[], number>;
	// 					},
	// 				},
	// 			},
	// 		},
	// 	},
	// },
	// d: {
	// 	[fnConfigKey]: {
	// 		level: "record" as const,
	// 		pathSegments: ["d"] as const,
	// 		pathString: "d",
	// 		constraints: {
	// 			presence: "required",
	// 			readonly: false,
	// 		},
	// 		userMetadata: {},
	// 		validation: {
	// 			validate: async (val: unknown) => {
	// 				return {
	// 					issues: null,
	// 					data: val as object,
	// 				} as unknown as ValidateReturnShape<
	// 					PathSegmentItem[],
	// 					Record<string, any>
	// 				>;
	// 			},
	// 		},
	// 	},
	// 	[fieldNodeTokenEnum.recordProperty]: {
	// 		[fnConfigKey]: {
	// 			level: "string" as const,
	// 			pathSegments: ["d", fieldNodeTokenEnum.recordProperty] as const,
	// 			pathString: `d.${fieldNodeTokenEnum.recordProperty}`,
	// 			constraints: {
	// 				presence: "required",
	// 				readonly: false,
	// 			},
	// 			userMetadata: {},
	// 			validation: {
	// 				validate: async (val: unknown) => {
	// 					return {
	// 						issues: null,
	// 						data: val as object,
	// 					} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
	// 				},
	// 			},
	// 		},
	// 		a: {
	// 			[fnConfigKey]: {
	// 				level: "string" as const,
	// 				pathSegments: ["d", fieldNodeTokenEnum.recordProperty, "a"] as const,
	// 				pathString: `d.${fieldNodeTokenEnum.recordProperty}.a`,
	// 				constraints: {
	// 					presence: "required",
	// 					readonly: false,
	// 				},
	// 				userMetadata: {},
	// 				validation: {
	// 					validate: async (val: unknown) => {
	// 						return {
	// 							issues: null,
	// 							data: val as object,
	// 						} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
	// 					},
	// 				},
	// 			},
	// 		},
	// 		b: {
	// 			[fnConfigKey]: {
	// 				level: "number" as const,
	// 				pathSegments: ["d", fieldNodeTokenEnum.recordProperty, "b"] as const,
	// 				pathString: `d.${fieldNodeTokenEnum.recordProperty}.b`,
	// 				constraints: {
	// 					presence: "required",
	// 					readonly: false,
	// 				},
	// 				userMetadata: {},
	// 				validation: {
	// 					validate: async (val: unknown) => {
	// 						return {
	// 							issues: null,
	// 							data: val as object,
	// 						} as unknown as ValidateReturnShape<PathSegmentItem[], number>;
	// 					},
	// 				},
	// 			},
	// 		},
	// 	},
	// },
	// TODO: add `e` to test union item
} satisfies FieldNode;

const t = {} as Pretty<DeepFieldNodePath<typeof fieldNode>>;

type Test_DeepFieldNodePathEntry = DeepFieldNodePathEntry<typeof fieldNode>;
//   ^?

type FieldPathToError_Test = FieldPathToError<typeof fieldNode>;

const fieldPathToError_Test = {} as FieldPathToError_Test;
// const testPath1 = "c.0.a";
// if (fieldPathToError_Test[testPath1]) {
// 	const res = fieldPathToError_Test[testPath1];
// 	// 		 ^?
// }
// const testPath2 = "d.b.a";
// if (fieldPathToError_Test[testPath2]) {
// 	const res = fieldPathToError_Test[testPath2];
// 	// 		 ^?
// }
// const testPath3 = "d.b.a.c"; // invalid path, should be undefined
// if (fieldPathToError_Test[testPath3]) {
// 	const res = fieldPathToError_Test[testPath3]; // NOTE: It's not correct, should be undefined
// 	// 		 ^?
// }

//   ^?
/*
{
		pathString: "a";
		pathSegments: ["a"];
} | {
		pathString: "b";
		pathSegments: ["b"];
} | {
		pathString: "c";
		pathSegments: ["c"];
} | {
		pathString: "c.@@__FN_TKN_ARR_ITEM__@@";
		pathSegments: ["c", "@@__FN_TKN_ARR_ITEM__@@"];
} | {
		pathString: "c.@@__FN_TKN_ARR_ITEM__@@.d";
		pathSegments: ["c", "@@__FN_TKN_ARR_ITEM__@@", "d"];
} | {
		pathString: "c.@@__FN_TKN_ARR_ITEM__@@.e";
		pathSegments: ["c", "@@__FN_TKN_ARR_ITEM__@@", "e"];
}
*/
