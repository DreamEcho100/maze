// http://chatgpt.com/c/67dee916-e8c0-8013-9b41-17b9a86257cb
// https://gemini.google.com/app/ffa819362ef5c276
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TODO, the following code is a work in progress.
 * - TO_SEARCH: baseResponses` and `basePathParams` or `baseHeaders` only
 * - ISSUE: Fix the issue with the `response` field in `ExtractRouteMetadata`.
 * - ISSUE: Fix the issue with the `createOnePostComment.response.result` type.
 * - ISSUE: Fix the issue with the excessive nesting of `ContractDefinition` type properties on the recursive `RouteTree` type.
 *
 *
 */

// -----------------------------
// Core Type Definitions
// -----------------------------
type AllowedHttpStatusCode = number;
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

// Internal keys used for type inference and metadata tagging
const internalInferredKey: unique symbol = Symbol("~internalInferredKey");
type InternalInferredKey = typeof internalInferredKey;
const internalMetaKey: unique symbol = Symbol("~internalMeta");
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
 * @template T The resolved data type.
 */
type SchemaResolver<T> = (val?: unknown) => T;
/**
 * Extract the resolved type from a schema resolver.
 */
type inferSchema<T> = T extends SchemaResolver<infer U> ? U : never;
/** Utility to extract value from SchemaResolver */
type GetSchemaResolverValue<TSchemaResolver> =
  TSchemaResolver extends SchemaResolver<infer Value> ? Value : never;
function SchemaResolverMerger<Schema extends SchemaResolver<any>>(
  base: Schema,
  override?: Schema,
): SchemaResolver<any> {
  // return (val) => {
  // 	return {
  // 		...base(val),
  // 		...override(val),
  // 	};
  // };

  // TODO: Needs to pay attention here when working on the schema stuff
  return override as SchemaResolver<any>;
}

// -----------------------------
// Contract Definition Interface
// -----------------------------

/**
 * Defines possible HTTP responses for a contract.
 * Maps status codes to response schema resolvers.
 */
type RouteResponses<
  Status extends AllowedHttpStatusCode = AllowedHttpStatusCode,
  ResponseBody = Record<string, any>,
> = Record<Status, SchemaResolver<ResponseBody>>;

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
  PathParams extends Record<string, any> = Record<string, any>,
  QueryParams extends Record<string, any> = Record<string, any>,
  RequestBody extends Record<string, any> = Record<string, any>,
  Headers extends Record<string, any> = Record<string, any>,
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
  pathParams?: SchemaResolver<PathParams>;

  /**
   * The schema for validating and typing query string parameters.
   * Optional. If omitted, no query parameters are expected.
   */
  queryParams?: SchemaResolver<QueryParams>;

  /**
   * The schema for validating and typing HTTP headers.
   * Optional. If omitted, no custom headers are expected.
   */
  headers?: SchemaResolver<Headers>;

  /**
   * The response schemas keyed by HTTP status code.
   * Each status code maps to a schema describing the response body shape.
   */
  responses?: Responses;

  /**
   * The schema for validating and typing the request body payload.
   * Optional. Required for methods like POST or PUT that include body data.
   */
  requestBody?: SchemaResolver<RequestBody>;

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
type GetAllRouteKeyPaths<
  Tree extends Record<string, any>,
  Prefix extends string = "",
> = {
  [Key in keyof Tree]: Tree[Key] extends Record<string, any>
    ? Tree[Key] extends { responses: any } | { method: any }
      ? `${Prefix}${Key & string}`
      : GetAllRouteKeyPaths<Tree[Key], `${Prefix}${Key & string}.`>
    : never;
}[keyof Tree];

// -----------------------------
// Response Extraction Types
// -----------------------------

/**
 * Represents a single extracted response entry with status and result.
 */
interface RouteResponseEntry<
  Key extends AllowedHttpStatusCode,
  Resolver extends SchemaResolver<any>,
> {
  status: Key;
  result: ReturnType<Resolver>;
}

/**
 * Extracts a union of all response entries from a response map.
 */
type RouteResponseUnion<ResponsesMap> = {
  [Key in keyof ResponsesMap]: ResponsesMap[Key] extends SchemaResolver<any>
    ? RouteResponseEntry<Key & AllowedHttpStatusCode, ResponsesMap[Key]>
    : never;
}[keyof ResponsesMap];

// -----------------------------
// Route Metadata Extraction
// -----------------------------

type GetOptionalSchemaValue<T> = T extends undefined
  ? undefined
  : GetSchemaResolverValue<T>;
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
type ExtractRouteMetadata<RouteDefinition> =
  RouteDefinition extends ContractDefinition
    ? Omit<RouteDefinition, "pathParams" | "queryParams" | "requestBody"> & {
        pathParams: RouteDefinition["pathParams"] extends undefined
          ? undefined
          : GetSchemaResolverValue<RouteDefinition["pathParams"]>;
        queryParams: RouteDefinition["queryParams"] extends undefined
          ? undefined
          : GetSchemaResolverValue<RouteDefinition["queryParams"]>;
        requestBody: RouteDefinition["requestBody"] extends undefined
          ? undefined
          : GetSchemaResolverValue<RouteDefinition["requestBody"]>;
        headers: RouteDefinition["headers"] extends undefined
          ? undefined
          : GetSchemaResolverValue<RouteDefinition["headers"]>;
        response: RouteDefinition["responses"] extends undefined
          ? NonNullable<RouteDefinition[InternalInferredKey]>["baseResponses"]
          :
              | RouteResponseUnion<NonNullable<RouteDefinition["responses"]>>
              | NonNullable<
                  RouteDefinition[InternalInferredKey]
                >["baseResponses"];
        // ISSUE: Fix the issue here
        // There is a need for away to exclude the keys on the original route
        // {
        // 	[Key in Exclude<NonNullable<RouteDefinition[InternalInferredKey]>["baseResponses"], keyof NonNullable<RouteDefinition["responses"]>>]: {
        // 		status: Key;
        // 		result: GetSchemaResolverValue<NonNullable<RouteDefinition["responses"]>[Key]>;
        // 	};
        // }
      }
    : never;

// -----------------------------
// Route Traversal by Key Path
// -----------------------------

type TraverseRouteTree<
  Tree extends Record<string, any>,
  Prefix extends string,
> =
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
type RouteKeyPathToInfoMap<
  Tree extends Record<string, any>,
  Paths extends string,
> = {
  [KeyPath in Paths & string]: RouteInfoByPath<Tree, KeyPath> & {
    pathChain: KeyPath;
  };
};

/**
 * Extracts a union of all key path strings from a route tree.
 */
type RoutesChainedPaths<Tree extends Record<string, any>> =
  keyof RouteKeyPathToInfoMap<Tree, GetAllRouteKeyPaths<Tree>>;

// -----------------------------
// Contract Enhancer Types
// -----------------------------
/**
 * Merges base path params and base responses into a route contract.
 */
type EnhanceRouteWithBase<
  RouteDef extends RouteTree,
  BasePathParams extends
    | SchemaResolver<Record<string, any>>
    | undefined = undefined,
  BaseResponses extends
    | Record<AllowedHttpStatusCode, SchemaResolver<any>>
    | undefined = undefined,
> = RouteDef extends ContractDefinition
  ? RouteDef & {
      [internalInferredKey]?: {
        baseResponses: IfUndefinedThen<
          {
            [Key in keyof BaseResponses]: {
              status: Key;
              result: BaseResponses[Key] extends SchemaResolver<infer T>
                ? T
                : never;
            };
          }[keyof BaseResponses],
          BaseResponses
        >;
        basePathParams: IfUndefinedThen<
          {
            [Key in keyof BasePathParams]: {
              status: Key;
              result: BasePathParams[Key] extends SchemaResolver<infer T>
                ? T
                : never;
            };
          }[keyof BasePathParams],
          BasePathParams
        >;
      } & RouteDef[InternalInferredKey];
    }
  : RouteDef extends Record<string, any>
    ? {
        [Key in keyof RouteDef]: EnhanceRouteWithBase<
          RouteDef[Key],
          BasePathParams,
          BaseResponses
        >;
      }
    : never;

// -----------------------------
// Recursive Mutator
// -----------------------------

function mutateRoutesRecursively<
  Tree extends RouteTree,
  BasePathParams extends SchemaResolver<Record<string, any>>,
  BaseResponses extends RouteResponses,
>(
  routeTree: Tree,
  options: {
    pathPrefix?: string;
    baseHeaders?: SchemaResolver<Record<string, any>>;
    basePathParams?: BasePathParams;
    baseResponses?: BaseResponses;
  },
) {
  for (const key in routeTree) {
    if (!routeTree[key]) {
      continue;
    }

    // If Not a contract definition
    if (!("method" in routeTree) && !("responses" in routeTree)) {
      // Recurse on it's children
      mutateRoutesRecursively(routeTree[key], {
        baseHeaders: options.baseHeaders,
        baseResponses: options.baseResponses,
      });
      continue;
    }

    // If it's a contract definition
    const route = routeTree[key] as unknown as ContractDefinition;

    if (options.pathPrefix) {
      route.path = options.pathPrefix + route.path;
    }

    if (options.baseResponses) {
      route.responses = {
        ...options.baseResponses,
        ...route.responses,
      };
    }

    if (options.baseHeaders) {
      route.headers = SchemaResolverMerger(options.baseHeaders, route.headers);
    }

    if (options.basePathParams) {
      route.pathParams = SchemaResolverMerger(
        options.basePathParams,
        route.pathParams,
      );
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
function defineRouterContract<
  Tree extends RouteTree,
  BasePathParams extends SchemaResolver<Record<string, any>>,
  BaseResponses extends RouteResponses,
>(
  routeTree: Tree,
  options?: {
    pathPrefix?: string;
    baseHeaders?: SchemaResolver<Record<string, any>>;
    basePathParams?: BasePathParams;
    baseResponses?: BaseResponses;
  },
) {
  if (options) {
    mutateRoutesRecursively(routeTree, options);
  }

  return routeTree as unknown as EnhanceRouteWithBase<
    Tree,
    BasePathParams,
    BaseResponses
  >;
}

const c = {
  router: defineRouterContract,
};

// The following code is only for demonstration purposes
interface Post {
  commentId: number;
  title: string;
  body: string;
}
interface Comment {
  commentId: number;
  postId: number;
  body: string;
}
const routeExample = c.router(
  {
    posts: c.router(
      {
        // path: "/posts",
        getMany: {
          path: "/",
          method: "GET",
          queryParams: () => {
            return {
              page: 1,
              limit: 10,
            };
          },
          responses: {
            200: (val) => {
              return val as Post[];
            },
          },
        },
        getOne: {
          path: "/:postId",
          method: "GET",
          pathParams: () => {
            return {} as { postId: number };
          },
          responses: {
            200: (val) => {
              return val as Post;
            },
          },
        },
        createOne: {
          path: "/",
          method: "POST",
          responses: {
            201: (val) => {
              return val as Post;
            },
          },
        },
        updateOne: {
          path: "/:postId",
          method: "PUT",
          pathParams: () => {
            return {} as { postId: number };
          },
          responses: {
            201: (val) => {
              return val as Post;
            },
          },
        },
        deleteOne: {
          path: "/:postId",
          method: "DELETE",
          pathParams: () => {
            return {} as { postId: number };
          },
          responses: {
            204: () => {
              return {};
            },
          },
        },
        comments: c.router(
          {
            // path: "/comments",
            getMany: {
              path: "/",
              method: "GET",
              queryParams: () => {
                return {
                  page: 1,
                  limit: 10,
                };
              },
              responses: {
                path: "/",
                // ISSUE: Fix the issue here
                // There seem to be an issue with the recursive type `RouteTree`, which leads to the `ContractDefinition` type properties to be able to have a `ContractDefinition` type properties???
                200: (val) => {
                  return val as Comment[];
                },
              },
            },
            getOne: {
              path: "/:commentId",
              method: "GET",
              pathParams: () => {
                return {} as { commentId: number };
              },
              responses: {
                200: (val) => {
                  return val as Comment;
                },
              },
            },
            createOne: {
              method: "POST",
              path: "/",
              responses: {
                201: (val) => {
                  return val as Comment;
                },
              },
            },
            updateOne: {
              method: "PUT",
              path: "/:commentId",
              pathParams: () => {
                return {} as { commentId: number };
              },
              responses: {
                200: (val) => {
                  return val as Comment;
                },
              },
            },
            deleteOne: {
              method: "DELETE",
              path: "/:commentId",
              pathParams: () => {
                return {} as { commentId: number };
              },
              responses: {
                204: () => {
                  return {};
                },
              },
            },
          },
          {
            pathPrefix: "/comments",
          },
        ),
      },
      {
        pathPrefix: "/posts",
      },
    ),
  },
  {
    pathPrefix: "/api/v1",
    baseResponses: {
      // 200: (val) => val as { error: string },
      500: (val) => val as { error: string },
      503: (val) => val as { error: string },
    },
  },
);
type AllAppRouteKeys = RoutesChainedPaths<typeof routeExample>;
type AppRoutesKeysPaths = GetAllRouteKeyPaths<typeof routeExample>;
type AppRouteKeyPathToValue = RouteKeyPathToInfoMap<
  typeof routeExample,
  AppRoutesKeysPaths
>;
const routeKeyPath = "posts.comments.getMany" satisfies AllAppRouteKeys;
const routeKeyPathToValue = {} as AppRouteKeyPathToValue;

const createOnePostComment = routeKeyPathToValue[routeKeyPath];

console.log(createOnePostComment.queryParams);
if (createOnePostComment.response.status === 200) {
  console.log(createOnePostComment.response.result[0]?.commentId);
} else if (createOnePostComment.response.status === 500) {
  console.log(createOnePostComment.response.result.error);
  /*
ISSUE:
The type of `createOnePostComment.response.result` is `Record<string, any> & { error: string; }`
It should be `{ error: string; }` only
*/
}
console.log(createOnePostComment.responses);
