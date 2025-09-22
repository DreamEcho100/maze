// @ts-nocheck
import { fieldNodeTokenEnum, fnConfigKeyCONFIG } from "#constants";
import type { FieldNode, ValidateReturnShape } from "#fields/shape/types";
import type {
	AnyRecord,
	DeepFieldNodePath,
	DeepFieldNodePathEntry,
	PathSegmentItem,
	PathSegmentsToStr,
} from "./types";

type Pretty<T> = { [K in keyof T]: T[K] } & {};

type Test_SegmentsToStr = PathSegmentsToStr<["a", 0, "c"]>; // Expected: "a.b.c"
//	 ^?
/*
"a.0.c"
*/

const fieldNode = {
	[fnConfigKeyCONFIG]: {
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
	a: {
		[fnConfigKeyCONFIG]: {
			level: "string" as const,
			pathSegments: ["a"] as const,
			pathString: "a",
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
					} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
				},
			},
		},
	},
	b: {
		[fnConfigKeyCONFIG]: {
			level: "number" as const,
			pathSegments: ["b"] as const,
			pathString: "b",
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
					} as unknown as ValidateReturnShape<PathSegmentItem[], number>;
				},
			},
		},
	},
	c: {
		[fnConfigKeyCONFIG]: {
			level: "array" as const,
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
					} as unknown as ValidateReturnShape<PathSegmentItem[], any[]>;
				},
			},
		},
		[fieldNodeTokenEnum.arrayItem]: {
			[fnConfigKeyCONFIG]: {
				level: "object" as const,
				pathSegments: ["c", fieldNodeTokenEnum.arrayItem] as const,
				pathString: `c.${fieldNodeTokenEnum.arrayItem}`,
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
			d: {
				[fnConfigKeyCONFIG]: {
					level: "string" as const,
					pathSegments: ["c", fieldNodeTokenEnum.arrayItem, "d"] as const,
					pathString: `c.${fieldNodeTokenEnum.arrayItem}.d`,
					constraints: {
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
								} as unknown as ValidateReturnShape<PathSegmentItem[], string>;
							},
						},
					},
				},
			},
			e: {
				[fnConfigKeyCONFIG]: {
					level: "number" as const,
					pathSegments: ["c", fieldNodeTokenEnum.arrayItem, "b"] as const,
					pathString: `c.${fieldNodeTokenEnum.arrayItem}.b`,
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
							} as unknown as ValidateReturnShape<PathSegmentItem[], number>;
						},
					},
				},
			},
		},
	},
} satisfies FieldNode;

const t = {} as Pretty<DeepFieldNodePath<typeof fieldNode>>;

type Test_DeepFieldNodePathEntry = DeepFieldNodePathEntry<typeof fieldNode>;
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
		pathString: "c.@@__FIELD_TOKEN_ARRAY_ITEM__@@";
		pathSegments: ["c", "@@__FIELD_TOKEN_ARRAY_ITEM__@@"];
} | {
		pathString: "c.@@__FIELD_TOKEN_ARRAY_ITEM__@@.d";
		pathSegments: ["c", "@@__FIELD_TOKEN_ARRAY_ITEM__@@", "d"];
} | {
		pathString: "c.@@__FIELD_TOKEN_ARRAY_ITEM__@@.e";
		pathSegments: ["c", "@@__FIELD_TOKEN_ARRAY_ITEM__@@", "e"];
}
*/
