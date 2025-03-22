/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// HTTP Methods
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

/**
 * It's an interface so that the metadata can be extended in the future without breaking changes by the consumer of the library
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ContractDefinitionMeta {}

/**
 * Base response type for all API endpoints
 */
interface BaseResponseMap {
  // Default responses for all endpoints
  [statusCode: number]: SchemaResolver<Record<string, any>>;
}

/**
 * The core contract definition for a REST API endpoint
 */
interface ContractDefinition<
  //
  PathSegment extends string = string,
  Responses extends Record<
    number,
    SchemaResolver<Record<string, any>>
  > = Record<number, SchemaResolver<Record<string, any>>>,
  THttpMethod extends HttpMethod = HttpMethod,
  //
  //------------------------------------------------
  BasePathParams extends Record<string, any> = Record<string, any>,
  PathParams extends BasePathParams & Record<string, any> = BasePathParams &
    Record<string, any>,
  //
  BaseQueryParams extends Record<string, any> = Record<string, any>,
  QueryParams extends BaseQueryParams & Record<string, any> = BaseQueryParams &
    Record<string, any>,
  //------------------------------------------------
  //
  Meta extends ContractDefinitionMeta = ContractDefinitionMeta,
> {
  path: PathSegment;
  method: THttpMethod;
  pathParams?: SchemaResolver<PathParams>;
  queryParams?: SchemaResolver<QueryParams>;
  headers?: SchemaResolver<Record<string, any>>;
  responses?: Responses;
  meta?: Meta;
  // Other useful fields can be added here
  summary?: string;
  description?: string;
}

// Router options for configuration
interface RouterOptions<
  BaseResponses extends BaseResponseMap = BaseResponseMap,
  BasePathParams extends Record<string, any> = Record<string, any>,
  BaseHeaders extends Record<string, any> = Record<string, any>,
> {
  pathPrefix?: string;
  baseHeaders?: SchemaResolver<BaseHeaders>;
  basePathParams?: SchemaResolver<BasePathParams>;
  baseResponses?: BaseResponses;
}

// Route definition that combines all endpoint configurations
type Route<
  BaseResponses extends BaseResponseMap = BaseResponseMap,
  BasePathParams extends Record<string, any> = Record<string, any>,
  BaseHeaders extends Record<string, any> = Record<string, any>,
> =
  | ContractDefinition<
      string,
      BaseResponses & Record<number, SchemaResolver<Record<string, any>>>,
      HttpMethod,
      BasePathParams
    >
  | {
      [Key: string]: Route<BaseResponses, BasePathParams, BaseHeaders>;
      // path: string;
    };

// Helper for extracting response types with proper type inference
interface ResponseInfo<Status extends number, Data> {
  status: Status;
  result: Data;
}

type ExtractResponseTypes<Responses extends BaseResponseMap> = {
  [Status in keyof Responses]: Responses[Status] extends SchemaResolver<infer R>
    ? ResponseInfo<Status & number, R>
    : never;
}[keyof Responses];

// Utility to extract route metadata with strong typing
type ExtractRouteMetadata<
  RouteDefinition,
  BasePathParams extends Record<string, any> = Record<string, any>,
  BaseResponses extends BaseResponseMap = BaseResponseMap,
> = RouteDefinition extends {
  path: infer PathValue;
  method?: infer HttpMethod;
  pathParams?: infer PathParamsSchema;
  queryParams?: infer QueryParamsSchema;
  headers?: infer HeadersSchema;
  responses?: infer ResponsesMap;
  meta?: infer Metadata;
}
  ? {
      path: PathValue;
      method: HttpMethod extends HttpMethod ? HttpMethod : undefined;
      pathParams: PathParamsSchema extends SchemaResolver<infer P>
        ? P
        : BasePathParams;
      queryParams: QueryParamsSchema extends SchemaResolver<infer Q>
        ? Q
        : undefined;
      headers: HeadersSchema extends SchemaResolver<infer H> ? H : undefined;
      responses: ExtractResponseTypes<
        BaseResponses &
          (ResponsesMap extends BaseResponseMap ? ResponsesMap : {})
      >[];
      response: ExtractResponseTypes<
        BaseResponses &
          (ResponsesMap extends BaseResponseMap ? ResponsesMap : {})
      >;
      meta: Metadata extends Record<string, any>
        ? Record<string, any>
        : undefined;
    }
  : never;

// Utility for retrieving dot-notation paths from nested route structure
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

// Traverse through route definitions using dot-notation paths
type TraverseRouteDefinition<
  Item extends Record<string, any>,
  PathChain extends string,
> = PathChain extends `${infer Key}.${infer Rest}`
  ? Key extends keyof Item
    ? TraverseRouteDefinition<Item[Key], Rest>
    : never
  : PathChain extends keyof Item
    ? Item[PathChain]
    : never;

// Get route info by dot-notation path
type RouteInfo<
  Item extends Record<string, any>,
  PathChain extends string,
  BasePathParams extends Record<string, any> = Record<string, any>,
  BaseResponses extends BaseResponseMap = BaseResponseMap,
> = ExtractRouteMetadata<
  TraverseRouteDefinition<Item, PathChain>,
  BasePathParams,
  BaseResponses
>;

// Convert path strings to route info objects
type RouteKeyPathToValue<
  Item extends Record<string, any>,
  Paths extends string,
  BasePathParams extends Record<string, any> = Record<string, any>,
  BaseResponses extends BaseResponseMap = BaseResponseMap,
> = {
  [PathChain in Paths & string]: RouteInfo<
    Item,
    PathChain,
    BasePathParams,
    BaseResponses
  > & {
    pathChain: PathChain;
  };
};

// Get all valid route keys as a union type
type KeysToUnion<T> = T extends any ? keyof T : never;
type AllRoutesUnion<Item extends Record<string, any>> = KeysToUnion<
  RouteKeyPathToValue<Item, GetRoutesKeysPaths<Item>>
>;

/**
 * Router builder with improved inference for base configurations
 */
class RouterBuilder<
  BaseResponses extends BaseResponseMap = {},
  BasePathParams extends Record<string, any> = {},
  BaseHeaders extends Record<string, any> = {},
> {
  private options: RouterOptions<BaseResponses, BasePathParams, BaseHeaders>;

  constructor(
    options: RouterOptions<BaseResponses, BasePathParams, BaseHeaders> = {},
  ) {
    this.options = options;
  }

  /**
   * Creates a router with the current configuration
   * @param config Route configuration
   * @returns Router with applied configurations
   */
  router<TRoute extends Route<BaseResponses, BasePathParams, BaseHeaders>>(
    config: TRoute,
    options: Partial<
      RouterOptions<BaseResponses, BasePathParams, BaseHeaders>
    > = {},
  ): TRoute {
    const mergedOptions = {
      ...this.options,
      ...options,
      baseResponses: {
        ...this.options.baseResponses,
        ...options.baseResponses,
      } as BaseResponses,
    };

    // Create an immutable copy of the config with applied options
    return this.applyOptions(config, mergedOptions);
  }

  private applyOptions(
    config: any,
    options: RouterOptions<BaseResponses, BasePathParams, BaseHeaders>,
  ): any {
    const result: Route = { ...config };
    const pathPrefix = options.pathPrefix ?? "";

    // Process each key in the config object
    for (const key in result) {
      const value = result[key];

      // If it's a route definition with a method
      if (value && typeof value === "object" && "method" in value) {
        // Create a copy of the route
        result[key] = {
          ...value,
          path: pathPrefix + value.path,
          // Merge responses with base responses if they exist
          responses: options.baseResponses
            ? { ...options.baseResponses, ...value.responses }
            : value.responses,
          // Apply base path params if they exist
          pathParams: this.mergeSchemaResolvers(
            options.basePathParams,
            value.pathParams,
          ),
          // Apply base headers if they exist
          headers: this.mergeSchemaResolvers(
            options.baseHeaders,
            value.headers,
          ),
        };
      }
      // If it's a nested router config
      else if (value && typeof value === "object" && !("method" in value)) {
        const nestedPathPrefix =
          (value.path ? pathPrefix + value.path : pathPrefix) || "";

        // Recursively process nested routes
        result[key] = this.applyOptions(value, {
          ...options,
          pathPrefix: nestedPathPrefix,
        });
      }
    }

    return result;
  }

  /**
   * Merges schema resolvers to combine base and route-specific schemas
   */
  private mergeSchemaResolvers<T, U>(
    baseResolver?: SchemaResolver<T>,
    routeResolver?: SchemaResolver<U>,
  ): SchemaResolver<T & U> | undefined {
    if (!baseResolver && !routeResolver) return undefined;
    if (baseResolver && !routeResolver)
      return baseResolver as unknown as SchemaResolver<T & U>;
    if (!baseResolver && routeResolver)
      return routeResolver as unknown as SchemaResolver<T & U>;

    // Both resolvers exist, merge them
    return ((val?: unknown) => {
      const baseResult = baseResolver!(val);
      const routeResult = routeResolver!(val);
      return { ...baseResult, ...routeResult } as T & U;
    }) as SchemaResolver<T & U>;
  }

  /**
   * Adds base responses to the builder
   */
  withBaseResponses<R extends BaseResponseMap>(
    responses: R,
  ): RouterBuilder<BaseResponses & R, BasePathParams, BaseHeaders> {
    return new RouterBuilder<BaseResponses & R, BasePathParams, BaseHeaders>({
      ...this.options,
      baseResponses: {
        ...this.options.baseResponses,
        ...responses,
      } as BaseResponses & R,
    });
  }

  /**
   * Adds base path parameters to the builder
   */
  withBasePathParams<P extends Record<string, any>>(
    pathParams: SchemaResolver<P>,
  ): RouterBuilder<BaseResponses, BasePathParams & P, BaseHeaders> {
    return new RouterBuilder<BaseResponses, BasePathParams & P, BaseHeaders>({
      ...this.options,
      basePathParams: this.mergeSchemaResolvers(
        this.options.basePathParams,
        pathParams,
      ) as SchemaResolver<BasePathParams & P>,
    });
  }

  /**
   * Adds base headers to the builder
   */
  withBaseHeaders<H extends Record<string, any>>(
    headers: SchemaResolver<H>,
  ): RouterBuilder<BaseResponses, BasePathParams, BaseHeaders & H> {
    return new RouterBuilder<BaseResponses, BasePathParams, BaseHeaders & H>({
      ...this.options,
      baseHeaders: this.mergeSchemaResolvers(
        this.options.baseHeaders,
        headers,
      ) as SchemaResolver<BaseHeaders & H>,
    });
  }

  /**
   * Adds a path prefix to the builder
   */
  withPathPrefix(
    prefix: string,
  ): RouterBuilder<BaseResponses, BasePathParams, BaseHeaders> {
    return new RouterBuilder<BaseResponses, BasePathParams, BaseHeaders>({
      ...this.options,
      pathPrefix: (this.options.pathPrefix || "") + prefix,
    });
  }
}

// Create a builder instance
const c = new RouterBuilder();

// Example usage
interface Post {
  postId: number;
  title: string;
  body: string;
}

interface Comment {
  commentId: number;
  postId: number;
  body: string;
}

// Create a router with base error responses
const apiBuilder = c.withBaseResponses({
  500: (val) => ({ error: "Internal Server Error", details: val as string }),
  400: (val) => ({ error: "Bad Request", details: val as string }),
  401: (val) => ({ error: "Unauthorized", details: val as string }),
  404: (val) => ({ error: "Not Found", details: val as string }),
});

// Define routes with the builder pattern
const routeExample = apiBuilder.withPathPrefix("/api/v1").router({
  posts: apiBuilder
    .withPathPrefix("/posts")
    .withBasePathParams(() => ({ apiVersion: "1.0" }))
    .router({
      getMany: {
        path: "/",
        method: "GET",
        queryParams: () => ({
          page: 1,
          limit: 10,
        }),
        responses: {
          200: (val) => val as Post[],
        },
      },
      getOne: {
        path: "/:postId",
        method: "GET",
        pathParams: () => ({ postId: 0 }) as { postId: number },
        responses: {
          200: (val) => val as Post,
        },
      },
      createOne: {
        path: "/",
        method: "POST",
        responses: {
          201: (val) => val as Post,
        },
      },
      updateOne: {
        path: "/:postId",
        method: "PUT",
        pathParams: () => ({ postId: 0 }) as { postId: number },
        responses: {
          200: (val) => val as Post,
        },
      },
      deleteOne: {
        path: "/:postId",
        method: "DELETE",
        pathParams: () => ({ postId: 0 }) as { postId: number },
        responses: {
          204: () => ({}),
        },
      },
      comments: apiBuilder.withPathPrefix("/comments").router({
        getMany: {
          path: "/",
          method: "GET",
          queryParams: () => ({
            page: 1,
            limit: 10,
          }),
          responses: {
            200: (val) => val as Comment[],
          },
        },
        getOne: {
          path: "/:commentId",
          method: "GET",
          pathParams: () => ({ commentId: 0 }) as { commentId: number },
          responses: {
            200: (val) => val as Comment,
          },
        },
        createOne: {
          method: "POST",
          path: "/",
          responses: {
            201: (val) => val as Comment,
          },
        },
        updateOne: {
          method: "PUT",
          path: "/:commentId",
          pathParams: () => ({ commentId: 0 }) as { commentId: number },
          responses: {
            200: (val) => val as Comment,
          },
        },
        deleteOne: {
          method: "DELETE",
          path: "/:commentId",
          pathParams: () => ({ commentId: 0 }) as { commentId: number },
          responses: {
            204: () => ({}),
          },
        },
      }),
    }),
});

// Type extraction for routes
type AppRoutesKeysPaths = GetRoutesKeysPaths<typeof routeExample>;
type AppRouteKeyPathToValue = RouteKeyPathToValue<
  typeof routeExample,
  AppRoutesKeysPaths,
  { apiVersion: string },
  {
    500: SchemaResolver<{ error: string; details: string }>;
    400: SchemaResolver<{ error: string; details: string }>;
    401: SchemaResolver<{ error: string; details: string }>;
    404: SchemaResolver<{ error: string; details: string }>;
  }
>;
type AllRouteKeys = AllRoutesUnion<typeof routeExample>;

// Example usage
const routeKeyPath = "posts.comments.getMany" satisfies AllRouteKeys;
const routeKeyPathToValue = {} as AppRouteKeyPathToValue;

const getCommentsRoute = routeKeyPathToValue[routeKeyPath];

// Now we can properly infer base responses
if (getCommentsRoute.response.status === 200) {
  // We can access typed Comment array
  console.log(getCommentsRoute.response.result[0]?.commentId);
} else if (getCommentsRoute.response.status === 500) {
  // We can now properly infer error type from base responses
  console.log(getCommentsRoute.response.result.error);
  console.log(getCommentsRoute.response.result.details);
}

// Base path params are also properly inferred
console.log(getCommentsRoute.pathParams.apiVersion);
