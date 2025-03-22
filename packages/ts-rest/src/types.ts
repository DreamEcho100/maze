// https://claude.ai/chat/a8d1bb21-ca32-458d-b6f1-4fc613b2db00
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Core types
type AllowedStatusesCodes = number | string;
// | 200
// | 201
// | 204
// | 400
// | 401
// | 403
// | 404
// | 500;
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
 * The core contract definition for a REST API endpoint
 */
interface ContractDefinition<
  //
  PathSegment extends string = string,
  Responses extends Record<
    AllowedStatusesCodes,
    SchemaResolver<Record<string, any>>
  > = Record<AllowedStatusesCodes, SchemaResolver<Record<string, any>>>,
  THttpMethod extends HttpMethod = HttpMethod,
  //
  //------------------------------------------------
  PathParams extends Record<string, any> = Record<string, any>,
  QueryParams extends Record<string, any> = Record<string, any>,
  //------------------------------------------------
  //
  RequestBody extends SchemaResolver<any> = SchemaResolver<any>,
  Meta extends ContractDefinitionMeta = ContractDefinitionMeta,
> {
  path: PathSegment;
  method: THttpMethod;
  pathParams?: SchemaResolver<PathParams>;
  // SchemaResolver<
  //   BaseToInherit extends { basePathParams: infer P }
  //     ? P & PathParams
  //     : PathParams
  // >;
  queryParams?: SchemaResolver<QueryParams>;
  headers?: SchemaResolver<Record<string, any>>;
  responses?: Responses;
  // BaseToInherit extends { baseResponses: infer R }
  //   ? R & Responses
  //   : Responses;
  requestBody?: RequestBody;
  meta?: Meta;
  // Other useful fields can be added here
  summary?: string;
  description?: string;
}

// const parentDefType

// type ParentRoute = { [Key: string]: Route } & { path?: string };
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
// type ExtractResponseMap<ResponsesMap> =
//   ResponsesMap extends Record<AllowedStatusesCodes, SchemaResolver<any>>
//     ? {
//         [Key in keyof ResponsesMap]: ResponsesMap[Key] extends (
//           val?: any,
//         ) => infer ReturnType
//           ? { status: Key; response: ReturnType }
//           : never;
//       }
//     : never;
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

// Extract relevant fields from a Route definition into a structured type
type ExtractRouteMetadata<RouteDefinition> =
  RouteDefinition extends ContractDefinition<
    infer PathValue,
    infer ResponsesMap,
    infer HttpMethod,
    infer PathParamsSchema,
    infer QueryParamsSchema,
    // infer HeadersSchema,
    infer RequestBodySchema,
    infer Metadata
  >
    ? {
        path: PathValue;
        method: HttpMethod extends HttpMethod ? HttpMethod : undefined;
        pathParams: PathParamsSchema extends SchemaResolver<infer P>
          ? P
          : undefined;
        queryParams: QueryParamsSchema extends SchemaResolver<infer Q>
          ? Q
          : undefined;
        // headers: HeadersSchema extends SchemaResolver<infer H> ? H : undefined;
        responses: ExtractResponseUnion<ResponsesMap>[];
        response: ExtractResponseUnion<ResponsesMap>;
        requestBody: RequestBodySchema extends SchemaResolver<infer B>
          ? B
          : undefined; // 🔹 Added this line
        meta: Metadata extends Record<string, any>
          ? Record<string, any>
          : undefined;
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

// type MergeResponses<
//   Base extends Record<AllowedStatusesCodes, SchemaResolver<any>> | undefined,
//   RouteResp extends Record<AllowedStatusesCodes, SchemaResolver<any>> | undefined,
//   // eslint-disable-next-line @typescript-eslint/no-empty-object-type
// > = (Base extends Record<AllowedStatusesCodes, SchemaResolver<any>> ? Base : {}) &
//   // eslint-disable-next-line @typescript-eslint/no-empty-object-type
//   (RouteResp extends Record<AllowedStatusesCodes, SchemaResolver<any>> ? RouteResp : {});
// type MergeResponses<
//   Base extends Record<AllowedStatusesCodes, SchemaResolver<any>> | undefined,
//   RouteResp extends Record<AllowedStatusesCodes, SchemaResolver<any>> | undefined,
// > = {
//   [Key in
//     | (Base extends Record<AllowedStatusesCodes, any> ? keyof Base : never)
//     | (RouteResp extends Record<AllowedStatusesCodes, any>
//         ? keyof RouteResp
//         : never)]: Key extends keyof RouteResp
//     ? RouteResp[Key]
//     : Key extends keyof Base
//       ? Base[Key]
//       : never;
// };
type Merge<Base, RouteResp> = Base & {
  [K in Exclude<keyof RouteResp, keyof Base> & number]: RouteResp[K];
};
type MergeResponses<
  Base extends Record<AllowedStatusesCodes, SchemaResolver<any>> | undefined,
  RouteResp extends
    | Record<AllowedStatusesCodes, SchemaResolver<any>>
    | undefined,
> =
  Base extends Record<
    infer BaseStatuses extends AllowedStatusesCodes,
    SchemaResolver<any>
  >
    ? RouteResp extends Record<
        infer RouteResp extends AllowedStatusesCodes,
        SchemaResolver<any>
      >
      ? Merge<Base, RouteResp>
      : // Base & { [K in Exclude<keyof RouteResp, keyof Base> & number]: RouteResp[K] }
        // Merge<Base, RouteResp>
        Base
    : RouteResp extends Record<AllowedStatusesCodes, SchemaResolver<any>>
      ? RouteResp
      : never;
// ^ This leads to the responses being generically typed as `Record<AllowedStatusesCodes, SchemaResolver<Record<string, any>>>` instead of the actual response type

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
    infer Meta
  >
    ? ContractDefinition<
        Path,
        MergeResponses<BaseResponses, Responses>,
        // Responses,
        Method,
        PathParams,
        QueryParams,
        RequestBody,
        Meta
      >
    : TRoute extends Record<string, any>
      ? {
          [Key in keyof TRoute]: RouteAndBaseToInheritMerger<
            TRoute[Key],
            BasePathParams,
            BaseResponses
          >;
        }
      : never;

function routerContractDefinition<
  TRoute extends Route,
  BasePathParams extends SchemaResolver<Record<string, any>>,
  BaseResponses extends Record<
    AllowedStatusesCodes,
    SchemaResolver<Record<string, any>>
  >,
>(
  config: TRoute,
  options?: {
    pathPrefix?: string;
    baseHeaders?: SchemaResolver<Record<string, any>>;
    basePathParams?: BasePathParams;
    baseResponses?: BaseResponses;
  },
): RouteAndBaseToInheritMerger<TRoute, BasePathParams, BaseResponses> {
  if (options) {
    function mutateRecursively(route: Route, pathPrefix: string) {
      if (!("method" in route) && typeof route !== "string") {
        for (const key in route) {
          if (key === "path" || !route[key]) {
            continue;
          }
          mutateRecursively(route[key], pathPrefix + (route.path ?? ""));
        }
        return;
      }

      route.path = pathPrefix + (route.path ?? "");

      if (options?.baseResponses) {
        route.responses = {
          ...options.baseResponses,
          ...route.responses,
        };
      }
    }

    mutateRecursively(config, options.pathPrefix ?? "");
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

// Can't infer any of it's properties, looks like there's an issue with `RouteAndBaseToInheritMerger` and `MergeResponses`
// console.log(createOnePostComment.responses.);
if (createOnePostComment.response.status === 200) {
  console.log(createOnePostComment.response.result[0]?.commentId);
} else if (createOnePostComment.response.status === 500) {
  // This can't be inferred from the base responses on the `routerContractDefinition` function
  console.log(createOnePostComment.response.result.error);
}
console.log(createOnePostComment.responses);
