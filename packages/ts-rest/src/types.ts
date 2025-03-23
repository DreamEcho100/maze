// https://claude.ai/chat/a8d1bb21-ca32-458d-b6f1-4fc613b2db00
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Core types
type AllowedStatusesCodes = number;
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

type SchemaResolver<T> = (val?: unknown) => T;
type inferSchema<T> = T extends SchemaResolver<infer U> ? U : never;

const internalInferredKey = "~inferredKey";
type InternalInferredKey = typeof internalInferredKey;
const internalMetaKey = "~meta";
type InternalMetaKey = typeof internalMetaKey;

type ContractDefinitionMeta = {
  [internalMetaKey]?: {
    pathPrefix?: string;
  };
} & Record<string, any>;

type ContractDefinitionResponse<
  Status extends AllowedStatusesCodes = AllowedStatusesCodes,
  ResponseBody = Record<string, any>,
> = Record<Status, SchemaResolver<ResponseBody>>;

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
  Responses extends ContractDefinitionResponse = ContractDefinitionResponse,
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
   * ⚠️ This field exists purely for typing purposes and is erased at runtime.
   * It should never be serialized or used in runtime logic.
   */
  [internalInferredKey]?: Record<string, any>;
}

type Route = ContractDefinition | { [Key: string]: Route };

type GetRoutesKeysPaths<
  Item extends Record<string, any>,
  BasePath extends string = "",
> = {
  [Key in keyof Item]: Item[Key] extends Record<string, any>
    ? Item[Key] extends { responses: any } | { method: any }
      ? `${BasePath}${Key & string}`
      : GetRoutesKeysPaths<Item[Key], `${BasePath}${Key & string}.`>
    : never;
}[keyof Item];

/********************************+********************************/
/********************************+********************************/
/********************************+********************************/
interface ExtractResponseMapEntry<
  Key extends AllowedStatusesCodes,
  Resolver extends SchemaResolver<any>,
> {
  status: Key;
  result: ReturnType<Resolver>;
}
type ExtractResponseUnion<ResponsesMap> = {
  [Key in keyof ResponsesMap]: ResponsesMap[Key] extends SchemaResolver<any>
    ? ExtractResponseMapEntry<Key & AllowedStatusesCodes, ResponsesMap[Key]>
    : never;
}[keyof ResponsesMap];

type GetSchemaResolverValue<TSchemaResolver> =
  TSchemaResolver extends SchemaResolver<infer Value> ? Value : never;

// Extract relevant fields from a Route definition into a structured type
type ExtractRouteMetadata<RouteDefinition> =
  RouteDefinition extends ContractDefinition
    ? Omit<RouteDefinition, "pathParams" | "queryParams" | "requestBody"> & {
        pathParams: GetSchemaResolverValue<
          NonNullable<RouteDefinition["pathParams"]>
        >;
        queryParams: GetSchemaResolverValue<
          NonNullable<RouteDefinition["queryParams"]>
        >;
        requestBody: GetSchemaResolverValue<
          NonNullable<RouteDefinition["requestBody"]>
        >;
        headers: GetSchemaResolverValue<
          NonNullable<RouteDefinition["headers"]>
        >;
        response:
          | ExtractResponseUnion<NonNullable<RouteDefinition["responses"]>>
          | NonNullable<RouteDefinition[InternalInferredKey]>["baseResponses"];
      }
    : never;

type TraverseRouteDefinition<
  Item extends Record<string, any>,
  PathChain extends string,
> =
  // If the path chain extends further, continue traversing
  PathChain extends `${infer Key}.${infer Rest}`
    ? // If the current key is a record, continue traversing
      Key extends keyof Item
      ? TraverseRouteDefinition<Item[Key], Rest>
      : never
    : // If the path chain is at the end, extract the metadata
      PathChain extends keyof Item
      ? Item[PathChain]
      : never;

// Get RouteInfo by a dot-notated path string
type RouteInfo<
  Item extends Record<string, any>,
  PathChain extends string,
> = ExtractRouteMetadata<TraverseRouteDefinition<Item, PathChain>>;
// Get all valid route key paths
type RouteKeyPathToValue<
  Item extends Record<string, any>,
  Paths extends string,
> = {
  [PathChain in Paths & string]: RouteInfo<Item, PathChain> & {
    pathChain: PathChain;
  };
};

type KeysToUnion<T> = T extends any ? keyof T : never;
type AllRoutesUnion<Item extends Record<string, any>> = KeysToUnion<
  RouteKeyPathToValue<Item, GetRoutesKeysPaths<Item>>
>;

/********************************+********************************/
/********************************+********************************/
/********************************+********************************/

type IfUndefinedThen<T, Default> = T extends undefined ? Default : T;

type RouteAndBaseToInheritMerger<
  TRoute extends Route,
  BasePathParams extends
    | SchemaResolver<Record<string, any>>
    | undefined = undefined,
  BaseResponses extends
    | Record<AllowedStatusesCodes, SchemaResolver<any>>
    | undefined = undefined,
> =
  TRoute extends ContractDefinition<
    infer Path,
    infer Responses,
    infer Method,
    infer PathParams,
    infer QueryParams,
    infer RequestBody,
    infer HeadersSchema,
    infer Meta
  >
    ? ContractDefinition<
        Path,
        Responses,
        Method,
        PathParams,
        QueryParams,
        RequestBody,
        HeadersSchema,
        Meta
      > & {
        [internalInferredKey]?: {
          baseResponses: IfUndefinedThen<
            {
              [K in keyof BaseResponses]: {
                status: K;
                result: BaseResponses[K] extends SchemaResolver<infer T>
                  ? T
                  : never;
              };
            }[keyof BaseResponses],
            BaseResponses
          >;
          basePathParams: IfUndefinedThen<
            {
              [K in keyof BasePathParams]: {
                status: K;
                result: BasePathParams[K] extends SchemaResolver<infer T>
                  ? T
                  : never;
              };
            }[keyof BasePathParams],
            BasePathParams
          >;
        } & TRoute[InternalInferredKey];
      }
    : TRoute extends Record<string, any>
      ? {
          [Key in keyof TRoute]: RouteAndBaseToInheritMerger<
            TRoute[Key],
            BasePathParams,
            BaseResponses
          >;
        }
      : never;

function mutateRoutesRecursively<
  TRoute extends Route,
  BasePathParams extends SchemaResolver<Record<string, any>>,
  BaseResponses extends ContractDefinitionResponse,
>(
  route: TRoute,
  options: {
    pathPrefix?: string;
    baseHeaders?: SchemaResolver<Record<string, any>>;
    basePathParams?: BasePathParams;
    baseResponses?: BaseResponses;
  },
) {
  if (!("method" in route) && typeof route !== "string") {
    for (const key in route) {
      if (key === "path" || !route[key]) {
        continue;
      }
      mutateRoutesRecursively(route[key], options);
    }
    return;
  }

  if (options.baseResponses) {
    route.responses = {
      ...options.baseResponses,
      ...route.responses,
    };
  }

  if (options.baseHeaders) {
    route.headers = {
      ...options.baseHeaders,
      ...route.headers,
    };
  }

  if (options.basePathParams) {
    route.pathParams = {
      ...options.basePathParams,
      ...route.pathParams,
    };
  }
}
function routerContractDefinition<
  TRoute extends Route,
  BasePathParams extends SchemaResolver<Record<string, any>>,
  BaseResponses extends ContractDefinitionResponse,
>(
  config: TRoute,
  options?: {
    pathPrefix?: string;
    baseHeaders?: SchemaResolver<Record<string, any>>;
    basePathParams?: BasePathParams;
    baseResponses?: BaseResponses;
  },
) {
  if (options) {
    for (const key in config) {
      if (options.pathPrefix) {
        const route = config[key] as ContractDefinition;
        route.path = options.pathPrefix + route.path;

        // route.meta = {
        //   ...(route.meta ?? {}),
        //   [internalMetaKey]: {
        //     ...(route.meta?.[internalMetaKey] ?? {}),
        //     pathPrefix: options.pathPrefix,
        //   },
        // };
      }
    }

    mutateRoutesRecursively(config, options);
  }

  return config as unknown as RouteAndBaseToInheritMerger<
    TRoute,
    BasePathParams,
    BaseResponses
  >;
}

const c = {
  router: routerContractDefinition,
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
type AllRouteKeys = AllRoutesUnion<typeof routeExample>;
type AppRoutesKeysPaths = GetRoutesKeysPaths<typeof routeExample>;
type AppRouteKeyPathToValue = RouteKeyPathToValue<
  typeof routeExample,
  AppRoutesKeysPaths
>;
const routeKeyPath = "posts.comments.getMany" satisfies AllRouteKeys;
const routeKeyPathToValue = {} as AppRouteKeyPathToValue;

const createOnePostComment = routeKeyPathToValue[routeKeyPath];

if (createOnePostComment.response.status === 200) {
  console.log(createOnePostComment.response.result[0]?.commentId);
} else if (createOnePostComment.response.status === 500) {
  console.log(createOnePostComment.response.result.error);
}
console.log(createOnePostComment.responses);
