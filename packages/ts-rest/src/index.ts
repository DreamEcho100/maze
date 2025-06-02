// http://chatgpt.com/c/67dee916-e8c0-8013-9b41-17b9a86257cb
// https://gemini.google.com/app/ffa819362ef5c276
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TODO, the following code is a work in progress.
 * - TO_SEARCH: baseResponses` and `basePathParams` or `sharedHeaders` only
 * - ISSUE: Fix the issue with the excessive nesting of `ContractDefinition` type properties on the recursive `RouteTree` type.
 * - ISSUE: The Inner shared headers are not being merged with the outer shared headers, if there is an outer shared headers defined it takes precedence over the inner shared headers, the issue could be on the `EnhanceRouteWithBase` type utility.
 *
 *
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";
// The following code is only for demonstration purposes
import { z } from "zod/v4";

// -----------------------------
// Core Type Definitions
// -----------------------------
type AllowedHttpStatusCode = number;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

// Internal keys used for type inference and metadata tagging
const internalInferredKey: unique symbol = Symbol("~@de100/ts-rest-internalInferredKey");
type InternalInferredKey = typeof internalInferredKey;
const internalMetaKey: unique symbol = Symbol("~@de100/ts-rest-internalMeta");
type InternalMetaKey = typeof internalMetaKey;

/**
 * Metadata structure for a contract route definition.
 */
type ContractDefinitionMeta = {
	[internalMetaKey]?: object;
} & Record<string, any>;

type IfUndefinedThen<Item, Fallback> = Item extends undefined ? Fallback : Item;

// -----------------------------
// TODO: Schema Adapter
// -----------------------------
/**
 * Generic schema resolver for validation/parsing.
 * @template TSchema The resolved data type.
 */
type SchemaShape<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output>;
type InferSchemaOutput<TSchema extends SchemaShape> = StandardSchemaV1.InferOutput<TSchema>;
type InferSchemaInput<TSchema extends SchemaShape> = StandardSchemaV1.InferInput<TSchema>;

// -----------------------------
// Contract Definition Interface
// -----------------------------

/**
 * Defines possible HTTP responses for a contract.
 * Maps status codes to response schema resolvers.
 */
type RouteResponses<
	Status extends AllowedHttpStatusCode = AllowedHttpStatusCode,
	ResponseBody = SchemaShape,
> = Record<Status, ResponseBody>;

/**
 * Represents a fully-typed REST API contract for a single endpoint.
 */
/**
 * The core contract definition for a REST API endpoint.
 *
 * This interface defines the structure used to represent a typed API route,
 * including schemas for path/query parameters, request/response bodies, headers,
 * and metadata. It supports powerful TypeScript inference to ensure type safety
 * across both client and server implementations.
 *
 * @template PathSegment The static or parameterized route path (e.g., '/users/:id').
 * @template Responses The possible response schemas keyed by HTTP status codes.
 * @template THttpMethod The HTTP method for this route (e.g., 'GET', 'POST').
 * @template PathParams The shape of dynamic path parameters.
 * @template QueryParams The shape of query string parameters.
 * @template RequestBody The expected shape of the request body payload.
 * @template Headers The shape of HTTP request headers.
 * @template Meta Optional metadata associated with this route (e.g., tags, auth).
 */
interface ContractDefinition<
	PathSegment extends string = string,
	Responses extends RouteResponses = RouteResponses,
	THttpMethod extends HttpMethod = HttpMethod,
	PathParams extends SchemaShape = SchemaShape,
	QueryParams extends SchemaShape = SchemaShape,
	RequestBody extends SchemaShape = SchemaShape,
	Headers extends SchemaShape = SchemaShape,
	Meta extends ContractDefinitionMeta = ContractDefinitionMeta,
> {
	/**
	 * The path string representing this route.
	 * Can include dynamic segments (e.g., '/users/:id').
	 */
	path: PathSegment;

	/**
	 * The HTTP method for this route (e.g., 'GET', 'POST', 'PUT', 'DELETE').
	 */
	method: THttpMethod;

	/**
	 * The schema for validating and typing dynamic route path parameters.
	 * Optional. If omitted, no path params are expected.
	 */
	pathParams?: PathParams;

	/**
	 * The schema for validating and typing query string parameters.
	 * Optional. If omitted, no query parameters are expected.
	 */
	queryParams?: QueryParams;

	/**
	 * The schema for validating and typing HTTP headers.
	 * Optional. If omitted, no custom headers are expected.
	 */
	headers?: Headers;

	/**
	 * The response schemas keyed by HTTP status code.
	 * Each status code maps to a schema describing the response body shape.
	 */
	responses?: Responses;

	/**
	 * The schema for validating and typing the request body payload.
	 * Optional. Required for methods like POST or PUT that include body data.
	 */
	requestBody?: RequestBody;

	/**
	 * Optional metadata used for route documentation or internal tooling.
	 */
	meta?: Meta;

	/**
	 * A brief summary of the route's purpose.
	 * Useful for documentation (e.g., OpenAPI descriptions).
	 */
	summary?: string;

	/**
	 * A detailed description of the route's behavior and usage.
	 */
	description?: string;

	/**
	 * A special internal field used to inject additional inferred type information
	 * (e.g., enriched response contracts) into the `ContractDefinition` without
	 * modifying the discriminant (`type`) or structure.
	 *
	 * This enables enhanced type inference and composition during contract processing,
	 * such as inside a `routeContract()` helper.
	 *
	 * ⚠️ Runtime logic must ignore this.
	 * ⚠️ This field exists purely for typing purposes and is erased at runtime.
	 * It should never be serialized or used in runtime logic.
	 */
	[internalInferredKey]?: Record<string, any>;
}

// -----------------------------
// Route Tree Types
// -----------------------------
type RouteTree = ContractDefinition | { [Key: string]: RouteTree };

/**
 * Recursively computes all valid key paths in a nested route tree.
 * Produces dot-separated key paths, e.g., "posts.getOne".
 */
type GetAllRouteKeyPaths<Tree extends Record<string, any>, Prefix extends string = ""> = {
	[Key in keyof Tree]: Tree[Key] extends Record<string, any>
		? Tree[Key] extends { responses: any } | { method: any }
			? `${Prefix}${Key & string}`
			: GetAllRouteKeyPaths<Tree[Key], `${Prefix}${Key & string}.`>
		: never;
}[keyof Tree];

// -----------------------------
// Response Extraction Types
// -----------------------------

// -----------------------------
// Route Metadata Extraction
// -----------------------------
/**
 * Extracts structured route metadata including inferred fields.
 */
/*
export interface ExtractRouteMetadata<
  RouteDefinition extends ContractDefinition,
> {
  method: RouteDefinition["method"];
  path: RouteDefinition["path"];
  pathParams: GetOptionalSchemaValue<RouteDefinition["pathParams"]>;
  queryParams: GetOptionalSchemaValue<RouteDefinition["queryParams"]>;
  requestBody: GetOptionalSchemaValue<RouteDefinition["requestBody"]>;
  headers: GetOptionalSchemaValue<RouteDefinition["headers"]>;
  responses: GetOptionalSchemaValue<RouteDefinition["responses"]>;
  response:
    | RouteResponseUnion<NonNullable<RouteDefinition["responses"]>>
    | NonNullable<RouteDefinition[InternalInferredKey]>["baseResponses"];
}
*/
type SchemaIO<TSchema> =
	TSchema extends SchemaShape<infer TInput, infer TOutput>
		? {
				input: TInput;
				output: TOutput;
			}
		: {
				input: undefined;
				output: undefined;
			};

type MereSchemaIO<
	RouteDefinition extends ContractDefinition,
	MainKey extends keyof RouteDefinition,
	MetaKey extends keyof NonNullable<RouteDefinition[InternalInferredKey]>,
	TargetKey extends "input" | "output",
> = SchemaIO<RouteDefinition[MainKey]>[TargetKey] extends undefined
	? SchemaIO<NonNullable<RouteDefinition[InternalInferredKey]>[MetaKey]>[TargetKey]
	: SchemaIO<RouteDefinition[MainKey]>[TargetKey] &
			Omit<
				SchemaIO<NonNullable<RouteDefinition[InternalInferredKey]>[MetaKey]>[TargetKey],
				keyof SchemaIO<RouteDefinition[MainKey]>[TargetKey]
			>;

type ExtractRouteMetadata<RouteDefinition> = RouteDefinition extends ContractDefinition
	? Omit<
			RouteDefinition,
			"pathParams" | "queryParams" | "requestBody" | "headers" | "responses"
		> & {
			pathParams: SchemaIO<RouteDefinition["pathParams"]>;
			queryParams: SchemaIO<RouteDefinition["queryParams"]>;
			requestBody: SchemaIO<RouteDefinition["requestBody"]>;
			___: SchemaIO<NonNullable<RouteDefinition[InternalInferredKey]>["baseHeader"]>;
			headers: SchemaIO<RouteDefinition["headers"]> extends undefined
				? SchemaIO<NonNullable<RouteDefinition[InternalInferredKey]>["baseHeaders"]>
				: {
						input: MereSchemaIO<RouteDefinition, "headers", "baseHeaders", "input">;
						output: MereSchemaIO<RouteDefinition, "headers", "baseHeaders", "output">;
					};

			response: {
				[Key in keyof NonNullable<RouteDefinition["responses"]>]: NonNullable<
					RouteDefinition["responses"]
				>[Key] extends SchemaShape
					? SchemaIO<NonNullable<RouteDefinition["responses"]>[Key]>
					: never;
			}[keyof NonNullable<RouteDefinition["responses"]>];
		}
	: never;

// -----------------------------
// Route Traversal by Key Path
// -----------------------------

type TraverseRouteTree<Tree extends Record<string, any>, Prefix extends string> =
	// If the path chain extends further, continue traversing
	Prefix extends `${infer Key}.${infer Rest}`
		? // If the current key is a record, continue traversing
			Key extends keyof Tree
			? TraverseRouteTree<Tree[Key], Rest>
			: never
		: // If the path chain is at the end, extract the metadata
			Prefix extends keyof Tree
			? Tree[Prefix]
			: never;

/**
 * Given a dot-separated route key path, returns enriched route info.
 */
type RouteInfoByPath<
	Tree extends Record<string, any>,
	KeyPath extends string,
> = ExtractRouteMetadata<TraverseRouteTree<Tree, KeyPath>>;

/**
 * Maps all route key paths to their enriched route info.
 */
type RouteKeyPathToInfoMap<Tree extends Record<string, any>, Paths extends string> = {
	[KeyPath in Paths & string]: RouteInfoByPath<Tree, KeyPath> & {
		pathChain: KeyPath;
	};
};

/**
 * Extracts a union of all key path strings from a route tree.
 */
type RoutesChainedPaths<Tree extends Record<string, any>> = keyof RouteKeyPathToInfoMap<
	Tree,
	GetAllRouteKeyPaths<Tree>
>;

// -----------------------------
// Contract Enhancer Types
// -----------------------------

// type MergeTypes<Global, Local> = {
//   [Key in keyof Global | keyof Local]: Key extends keyof Local
//     ? Local[Key]
//     : Key extends keyof Global
//       ? Global[Key]
//       : never;
// };

/**
 * Merges base path params and base responses into a route contract.
 */
// type EnhanceRouteWithBase<
//   RouteDef extends RouteTree,
//   BaseHeaders extends SchemaShape | undefined = undefined,
// > = RouteDef extends ContractDefinition
//   ? NonNullable<RouteDef[InternalInferredKey]>['baseHeader'] extends Record<string, any>
//     ? Omit<RouteDef, InternalInferredKey> & {
//         [internalInferredKey]?: {
//           baseHeaders: MergeTypes<
//             BaseHeaders,
//             NonNullable<RouteDef[InternalInferredKey]>["baseHeaders"]
//           >;
//         };
//       }
//     : RouteDef & {
//         [internalInferredKey]?: {
//           baseHeaders: BaseHeaders;
//         };
//       }
//   : RouteDef extends Record<string, any>
//     ? {
//         [Key in keyof RouteDef]: EnhanceRouteWithBase<
//           RouteDef[Key],
//           BaseHeaders
//         >;
//       }
// 	: never;

/**
 * Merge two header types.
 * For any key, if the key exists in Local then use Local's type; otherwise use Global's type.
 */
type MergeHeaders<Global, Local> = {
	[K in keyof Global | keyof Local]: K extends keyof Local
		? Local[K]
		: K extends keyof Global
			? Global[K]
			: never;
};

/**
 * Merge two types. If Existing is undefined, return New.
 */
type MergeInternal<Existing, New> = [Existing] extends [undefined]
	? New
	: [New] extends [undefined]
		? Existing
		: MergeTypes<Existing, New>;

/**
 * Merges two SchemaIO objects by merging their input and output properties.
 */
interface MergeSchemaIO<A, B> {
	input: MergeTypes<A["input"], B["input"]>;
	output: MergeTypes<A["output"], B["output"]>;
}

/**
 * MergeTypes: for any key, if it exists in B then use B's type; otherwise use A's type.
 */
type MergeTypes<Global, Local> = {
	[K in keyof Global | keyof Local]: K extends keyof Local
		? Local[K]
		: K extends keyof Global
			? Global[K]
			: never;
};

// type EnhanceRouteWithBase<
//   RouteDef extends RouteTree,
//   BaseHeaders extends SchemaShape | undefined = undefined,
// > = RouteDef extends ContractDefinition
// 	? Omit<RouteDef, InternalInferredKey> & {

// 		/*
//       [internalInferredKey]: NonNullable<RouteDef[InternalInferredKey]> & {
//         // baseHeaders: NonNullable<
//         //   RouteDef[InternalInferredKey]
//         // >["baseHeaders"] extends infer RouteDefBaseHeaders
//         //   ? RouteDefBaseHeaders extends SchemaShape
//         //     ? Omit<RouteDefBaseHeaders, keyof BaseHeaders> & BaseHeaders
//         //     : BaseHeaders
//         //   : BaseHeaders;
//         // For shared headers, if BaseHeaders is defined then merge it with any local shared headers.
//         baseHeaders: BaseHeaders extends SchemaShape
//           ? RouteDef[InternalInferredKey] extends { baseHeaders: infer Local }
//             ? Local extends SchemaShape
//               ? MergeHeaders<BaseHeaders, Local>
//               : BaseHeaders
//             : BaseHeaders
//           : undefined;
//         // For debugging: if testCurrentHeadersIO exists already, preserve it; otherwise, produce a combined SchemaIO.
//         testCurrentHeadersIO: RouteDef[InternalInferredKey] extends {
//           testCurrentHeadersIO: infer T;
//         }
//           ? T
//           : BaseHeaders extends SchemaShape
//             ? RouteDef["headers"] extends SchemaShape
//               ? SchemaIO<BaseHeaders> & SchemaIO<RouteDef["headers"]>
//               : SchemaIO<BaseHeaders>
//             : RouteDef["headers"] extends SchemaShape
//               ? SchemaIO<RouteDef["headers"]>
//               : undefined;
//         // testCurrentHeadersIO: // 1.
//         // NonNullable<
//         //   RouteDef[InternalInferredKey]
//         // >["testCurrentHeadersIO"] extends Record<string, any>
//         //   ? // 1.1
//         //     BaseHeaders extends SchemaShape
//         //     ? // 1.1.1
//         //       RouteDef["headers"] extends SchemaShape
//         //       ? // 1.1.2
//         //         SchemaIO<
//         //           NonNullable<
//         //             RouteDef[InternalInferredKey]
//         //           >["testCurrentHeadersIO"]
//         //         > &
//         //           SchemaIO<BaseHeaders> &
//         //           SchemaIO<RouteDef["headers"]>
//         //       : // 1.1.3
//         //         SchemaIO<
//         //           NonNullable<
//         //             RouteDef[InternalInferredKey]
//         //           >["testCurrentHeadersIO"]
//         //         > &
//         //           SchemaIO<BaseHeaders>
//         //     : // 1.2
//         //       SchemaIO<
//         //         NonNullable<
//         //           RouteDef[InternalInferredKey]
//         //         >["testCurrentHeadersIO"]
//         //       >
//         //   : // 2
//         //     BaseHeaders extends SchemaShape
//         //     ? // 2.1
//         //       RouteDef["headers"] extends SchemaShape
//         //       ? // 2.1.1
//         //         SchemaIO<BaseHeaders> & SchemaIO<RouteDef["headers"]>
//         //       : // 2.1.2
//         //         SchemaIO<BaseHeaders>
//         //     : // 2.2
//         //       RouteDef["headers"] extends SchemaShape
//         //       ? // 2.2.1
//         //         SchemaIO<RouteDef["headers"]>
//         //       : // 2.2.2
//         //         undefined;
// 		};
// 		*/
//       // headers: NonNullable<RouteDef[InternalInferredKey]>["baseHeaders"] extends infer RouteDefBaseHeaders
//       // 	? RouteDefBaseHeaders extends SchemaShape
//       // 		? Omit<RouteDefBaseHeaders, keyof BaseHeaders> & BaseHeaders
//       // 		: BaseHeaders
//       // 	: BaseHeaders;
//     }
//   : RouteDef extends Record<string, any>
//     ? {
//         [Key in keyof RouteDef]: EnhanceRouteWithBase<
//           RouteDef[Key],
//           BaseHeaders
//         >;
//       }
//     : never;

type EnhanceRouteWithBase<
	RouteDef extends RouteTree,
	BaseHeaders extends SchemaShape | undefined = undefined,
> = RouteDef extends ContractDefinition
	? Omit<RouteDef, InternalInferredKey> & {
			// [internalInferredKey]: NonNullable<RouteDef[InternalInferredKey]> & {
			//   baseHeaders: BaseHeaders extends SchemaShape
			//     ? RouteDef[InternalInferredKey] extends { baseHeaders: infer Local }
			//       ? Local extends SchemaShape
			//         ? MergeHeaders<BaseHeaders, Local>
			//         : BaseHeaders
			//       : BaseHeaders
			//     : undefined;
			//   testCurrentHeadersIO: RouteDef[InternalInferredKey] extends {
			//     testCurrentHeadersIO: infer T;
			//   }
			//     ? T
			//     : BaseHeaders extends SchemaShape
			//       ? RouteDef["headers"] extends SchemaShape
			//         ? MergeSchemaIO<SchemaIO<BaseHeaders>, SchemaIO<RouteDef["headers"]>>
			//         : SchemaIO<BaseHeaders>
			//       : RouteDef["headers"] extends SchemaShape
			//         ? SchemaIO<RouteDef["headers"]>
			//         : undefined;
			// };
			[internalInferredKey]: MergeInternal<
				RouteDef[InternalInferredKey],
				{
					// For shared headers, if BaseHeaders is defined then merge it with any local shared headers.
					baseHeaders: BaseHeaders extends SchemaShape
						? RouteDef[InternalInferredKey] extends { baseHeaders: infer Local }
							? Local extends SchemaShape
								? MergeHeaders<BaseHeaders, Local>
								: BaseHeaders
							: BaseHeaders
						: undefined;
					// For debugging: if testCurrentHeadersIO exists already, preserve it; otherwise, produce a combined SchemaIO.
					testCurrentHeadersIO: RouteDef[InternalInferredKey] extends {
						testCurrentHeadersIO: infer T;
					}
						? T
						: BaseHeaders extends SchemaShape
							? RouteDef["headers"] extends SchemaShape
								? SchemaIO<BaseHeaders> & SchemaIO<RouteDef["headers"]>
								: SchemaIO<BaseHeaders>
							: RouteDef["headers"] extends SchemaShape
								? SchemaIO<RouteDef["headers"]>
								: undefined;
				}
			>;
		}
	: RouteDef extends Record<string, any>
		? { [K in keyof RouteDef]: EnhanceRouteWithBase<RouteDef[K], BaseHeaders> }
		: never;

// Omit<RouteDef, InternalInferredKey> & {
//     [internalInferredKey]: (RouteDef[InternalInferredKey] extends Record<
//       string,
//       any
//     >
//       ? RouteDef[InternalInferredKey]
//       : "never") & {
//       baseHeaders: NonNullable<
//         RouteDef[InternalInferredKey]
//       >["baseHeaders"] extends infer RouteDefBaseHeaders
//         ? RouteDefBaseHeaders extends SchemaShape
//           ? MergeTypes<BaseHeaders, RouteDefBaseHeaders>
//           : BaseHeaders
//         : NonNullable<RouteDef[InternalInferredKey]>["baseHeaders"];
//     };
//   }
// : RouteDef extends Record<string, any>
//   ? {
//       [Key in keyof RouteDef]: EnhanceRouteWithBase<
//         RouteDef[Key],
//         BaseHeaders
//       >;
//     }
//   : never;

// -----------------------------
// Recursive Mutator
// -----------------------------

function isContractDefinition(routeTree: any): routeTree is ContractDefinition {
	return (
		typeof routeTree === "object" &&
		!!routeTree &&
		!("method" in routeTree) &&
		!("responses" in routeTree)
	);
}

function mutateRoutesRecursively<Tree extends RouteTree, SharedHeaders extends SchemaShape>(
	routeTree: Tree,
	options: {
		pathPrefix?: string;
		sharedHeaders?: SharedHeaders;
		schemaResolverMerger?: (base: any, override?: any) => SchemaShape;
	},
	// (
	// 	| {
	// 			sharedHeaders?: undefined;
	// 			schemaResolverMerger?: undefined;
	// 		}
	// 	| {
	// 			sharedHeaders: SharedHeaders;
	// 			schemaResolverMerger: (base: any, override?: any) => SchemaShape;
	// 		}
	// ),
) {
	for (const key in routeTree) {
		if (!routeTree[key]) {
			continue;
		}

		// If Not a contract definition
		if (!isContractDefinition(routeTree[key])) {
			// Recurse on it's children
			mutateRoutesRecursively(routeTree[key], {
				sharedHeaders: options.sharedHeaders,
				schemaResolverMerger: options.schemaResolverMerger,
			});
			continue;
		}

		// If it's a contract definition
		const route = routeTree[key] as unknown as ContractDefinition;

		// Apply path prefix
		if (options.pathPrefix) {
			route.path = `${options.pathPrefix}${route.path}`;
		}

		if (options.sharedHeaders && route.headers) {
			if (!options.schemaResolverMerger) {
				throw new Error("Missing `schemaResolverMerger` function in options.");
			}

			route.headers = options.schemaResolverMerger(options.sharedHeaders, route.headers);
		}
	}
}

// -----------------------------
// Main Router Contract Definition
// -----------------------------

/**
 * Defines a contract for nested API routes with optional shared configuration.
 * @param routeTree Route tree definition.
 * @param options Optional base config (headers, params, prefix, etc).
 */
function defineRouterContract<Tree extends RouteTree, SharedHeaders extends SchemaShape>(
	routeTree: Tree,
	options?: {
		pathPrefix?: string;
		sharedHeaders?: SharedHeaders;
		schemaResolverMerger?: (base: any, override?: any) => SchemaShape;
	},
) {
	if (options) {
		mutateRoutesRecursively(routeTree, options);
	}

	return routeTree as unknown as EnhanceRouteWithBase<Tree, SharedHeaders>;
}

const c = {
	router: defineRouterContract,
};

const errorSchemaBuilder = <StatusNumber extends number>(param: { statusNumber: StatusNumber }) =>
	z.object({
		type: z.literal("error"),
		statusNumber: z.literal(param.statusNumber),
		message: z.string(),
	});
const successSchemaBuilder = <
	StatusNumber extends number,
	TDataSchema extends z.ZodTypeAny,
>(param: {
	statusNumber: StatusNumber;
	data: TDataSchema;
}) =>
	z.object({
		type: z.literal("success"),
		statusNumber: z.literal(param.statusNumber),
		data: param.data,
	});
const baseResponses = {
	500: errorSchemaBuilder({ statusNumber: 500 }),
	503: errorSchemaBuilder({ statusNumber: 503 }),
	504: errorSchemaBuilder({ statusNumber: 504 }),
};
const baseResponsesBuilder = <TSchemaMap extends Record<number, z.ZodTypeAny>>(
	schemaMap: TSchemaMap,
) => {
	type CorrectedSchemaMap = {
		[Key in keyof TSchemaMap]: TSchemaMap[Key] extends z.ZodTypeAny
			? ReturnType<typeof successSchemaBuilder<Key & number, TSchemaMap[Key]>>
			: never;
	};
	type SatisfiedCorrectedSchemaMap = Record<
		number,
		ReturnType<typeof successSchemaBuilder<number, any>>
	>;

	const correctedSchemaMap: Partial<SatisfiedCorrectedSchemaMap> = {};

	for (const key in schemaMap) {
		const statusNumber = Number(key);
		const data = schemaMap[statusNumber];

		if (!data) {
			continue;
		}

		correctedSchemaMap[statusNumber] = successSchemaBuilder({
			statusNumber: statusNumber,
			data,
		});
	}

	return {
		...baseResponses,
		...(correctedSchemaMap as CorrectedSchemaMap),
	};
};

const postSchema = z.object({
	commentId: z.number(),
	title: z.string(),
	body: z.string(),
});
const commentSchema = z.object({
	commentId: z.number(),
	postId: z.coerce.number(),
	body: z.string(),
});
const basePageParamsSchema = z.object({
	page: z.number(),
	limit: z.number(),
});
const authHeadersSchema = z.object({
	authorization: z.string(),
});

/** Utility to extract value from SchemaResolver */
function schemaResolverMerger<Schema extends SchemaShape>(
	base: Schema,
	override: Schema,
): SchemaShape {
	if (base["~standard"].vendor === "zod" && override["~standard"].vendor === "zod") {
		return (base as unknown as z.ZodObject<any>).merge(
			override as unknown as z.ZodObject<any>,
		) as SchemaShape;
	}

	throw new Error("Unsupported schema vendor.");
}

const commentsRouter = c.router(
	{
		// path: "/comments",
		getMany: {
			path: "/",
			method: "GET",
			queryParams: basePageParamsSchema,
			responses: {
				path: "/",
				// ISSUE: Fix the issue here
				// There seem to be an issue with the recursive type `RouteTree`, which leads to the `ContractDefinition` type properties to be able to have a `ContractDefinition` type properties???
				...baseResponsesBuilder({
					200: z.array(commentSchema),
				}),
			},
		},
		getOne: {
			path: "/:commentId",
			method: "GET",
			pathParams: z.object({
				postId: z.coerce.number(),
				commentId: z.coerce.number(),
			}),
			responses: baseResponsesBuilder({ 200: commentSchema }),
		},
		createOne: {
			method: "POST",
			path: "/",
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 201: commentSchema }),
		},
		updateOne: {
			method: "PUT",
			path: "/:commentId",
			pathParams: z.object({
				postId: z.coerce.number(),
				commentId: z.coerce.number(),
			}),
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 200: commentSchema }),
		},
		deleteOne: {
			method: "DELETE",
			path: "/:commentId",
			pathParams: z.object({
				commentId: z.number(),
			}),
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 204: z.undefined() }),
		},
		replies: c.router(
			{
				createOne: {
					method: "POST",
					path: "/",
					headers: authHeadersSchema,
					responses: baseResponsesBuilder({ 201: commentSchema }),
				},
			},
			{
				sharedHeaders: z.object({
					"content-type": z.literal("application/text"),
					"x-test-3": z.coerce.number(),
				}),
				schemaResolverMerger,
			},
		),
	},
	{
		pathPrefix: "/comments",
		sharedHeaders: z.object({
			"content-type": z.literal("application/text"),
			"x-test-2": z.coerce.number(),
		}),
		schemaResolverMerger,
	},
);
type CommentsRouterBaseHeaders = NonNullable<
	(typeof commentsRouter.createOne)[InternalInferredKey]
>["testCurrentHeadersIO"]["output"]["x-test-2"];
/*
testCurrentHeadersIO: {
    input: {
        "content-type": "application/text";
        "x-test-2": number;
    };
    output: {
        "content-type": "application/text";
        "x-test-2": number;
    };
} & {
    input: {
        authorization: string;
    };
    output: {
        authorization: string;
    };
}
*/

const postsRouter = c.router(
	{
		// path: "/posts",
		getMany: {
			path: "/",
			method: "GET",
			queryParams: basePageParamsSchema,
			responses: baseResponsesBuilder({ 200: z.array(postSchema) }),
		},
		getOne: {
			path: "/:postId",
			method: "GET",
			pathParams: z.object({ postId: z.coerce.number() }),
			responses: baseResponsesBuilder({ 200: postSchema }),
		},
		createOne: {
			path: "/",
			method: "POST",
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 201: postSchema }),
		},
		updateOne: {
			path: "/:postId",
			method: "PUT",
			pathParams: z.object({ postId: z.coerce.number() }),
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 201: postSchema }),
		},
		deleteOne: {
			path: "/:postId",
			method: "DELETE",
			pathParams: z.object({ postId: z.coerce.number() }),
			headers: authHeadersSchema,
			responses: baseResponsesBuilder({ 204: z.undefined() }),
		},
		comments: commentsRouter,
	},
	{
		pathPrefix: "/posts",
		sharedHeaders: z.object({
			"content-type": z.literal("application/text"),
			"x-test": z.coerce.number(),
		}),
		schemaResolverMerger,
		// ISSUE: The Inner shared headers are not being merged with the outer shared headers, if there is an outer shared headers defined it takes precedence over the inner shared headers, the issue could be on the `EnhanceRouteWithBase` type utility.
	},
);
type PostsRouterBaseHeaders = NonNullable<
	(typeof postsRouter.createOne)[InternalInferredKey]
>["testCurrentHeadersIO"]["output"]["x-test"];
/*
testCurrentHeadersIO: {
    input: {
        "content-type": "application/text";
        "x-test": number;
    };
    output: {
        "content-type": "application/text";
        "x-test": number;
    };
} & {
    input: {
        authorization: string;
    };
    output: {
        authorization: string;
    };
}
*/

const routeExample = c.router(
	{
		posts: postsRouter,
	},
	{
		pathPrefix: "/api/v1",
		sharedHeaders: z.object({ "content-type": z.literal("application/json") }), // baseResponses:
		schemaResolverMerger,
	},
);

type AllAppRouteKeys = RoutesChainedPaths<typeof routeExample>;
type AppRoutesKeysPaths = GetAllRouteKeyPaths<typeof routeExample>;
type AppRouteKeyPathToValue = RouteKeyPathToInfoMap<typeof routeExample, AppRoutesKeysPaths>;
{
	const routeKeyPath = "posts.comments.replies.createOne" satisfies AllAppRouteKeys;
	const routeKeyPathToValue = {} as AppRouteKeyPathToValue;
	const createOnePostComment = routeKeyPathToValue[routeKeyPath];
	console.log(createOnePostComment.headers.output);
	console.log(createOnePostComment.headers.output.authorization);
	// ISSUE: it only infers the headers from the most inner and outer and not in between
	console.log(createOnePostComment.headers.output["x-test"]);
	console.log(createOnePostComment.headers.output["x-test-2"]);
	console.log(createOnePostComment.headers.output["x-test-3"]);
	console.log(createOnePostComment.headers.output["content-type"]);
	console.log(createOnePostComment.pathChain);
	console.log(createOnePostComment.method);
	switch (createOnePostComment.response.output.type) {
		case "success": {
			console.log(createOnePostComment.response.output.data);
			break;
		}
		case "error": {
			console.log(createOnePostComment.response.output.message);
			break;
		}
	}
	console.log(createOnePostComment.queryParams);
	console.log(createOnePostComment.pathParams);
	console.log(createOnePostComment.path);
	console.log(createOnePostComment.requestBody);
}
