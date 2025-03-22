/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-check

import type { SchemaAdapter } from "#schemas";

/**
 * ts-flex-rest - A type-safe REST API library with pluggable validators
 * Similar to ts-rest but with support for different validation libraries
 */

// Core types
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Base types for endpoints
export interface BaseEndpoint<
  Path extends string = string,
  Method extends HttpMethod = HttpMethod,
  Query = unknown,
  Params = unknown,
  ReqBody = unknown,
  ResBody = unknown,
> {
  method: Method;
  path: Path;
  query?: SchemaAdapter<Query>;
  params?: SchemaAdapter<Params>;
  body?: SchemaAdapter<ReqBody>;
  response: Record<number, SchemaAdapter<any>>;
}

// Contract builder
export class ContractBuilder {
  private endpoints: Record<string, BaseEndpoint> = {};

  endpoint<
    Path extends string,
    Method extends HttpMethod,
    Query,
    Params,
    ReqBody,
    ResBody,
  >(
    name: string,
    config: {
      method: Method;
      path: Path;
      query?: SchemaAdapter<Query>;
      params?: SchemaAdapter<Params>;
      body?: SchemaAdapter<ReqBody>;
      response: Record<number, SchemaAdapter<ResBody>>;
    },
  ) {
    this.endpoints[name] = config;
    return this;
  }

  build() {
    return this.endpoints;
  }
}

// Contract type
export type Contract = Record<string, BaseEndpoint>;

// Helper to create a contract builder
export function initContract() {
  return new ContractBuilder();
}

// Types for request contexts
export interface RequestContext<T> {
  body?: T;
  query?: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

// Server implementation
export class ServerBuilder<C extends Contract> {
  constructor(private contract: C) {}

  endpoint<K extends keyof C>(
    name: K,
    handler: (
      context: RequestContext<
        C[K] extends { body: SchemaAdapter<infer T> } ? T : undefined
      >,
    ) => Promise<{
      status: number;
      body: any;
    }>,
  ) {
    return {
      name,
      handler,
      endpoint: this.contract[name],
    };
  }
}

// Create server builder
export function initServer<C extends Contract>(contract: C) {
  return new ServerBuilder(contract);
}

// Express integration
export type ExpressRequestHandler = (
  req: any,
  res: any,
  next?: any,
) => Promise<void>;

export function createExpressEndpoints<C extends Contract>(
  serverBuilder: ServerBuilder<C>,
  endpoints: ReturnType<ServerBuilder<C>["endpoint"]>[],
): Record<string, ExpressRequestHandler> {
  const handlers: Record<string, ExpressRequestHandler> = {};

  for (const { name, handler, endpoint } of endpoints) {
    handlers[String(name)] = async (req: any, res: any) => {
      try {
        let body: RequestContext<any>["body"] = undefined;
        if (!endpoint) {
          return res.status(404).json({
            error: "Endpoint not found",
          });
        }

        if (endpoint.body && req.body) {
          const parseResult = endpoint.body.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({
              error: "Invalid request body",
              details: parseResult.error,
            });
          }
          body = parseResult.data;
        }

        let query: RequestContext<any>["query"] = undefined;
        if (endpoint.query && req.query) {
          const parseResult = endpoint.query.safeParse(req.query);
          if (!parseResult.success) {
            return res.status(400).json({
              error: "Invalid query parameters",
              details: parseResult.error,
            });
          }
          query = parseResult.data as RequestContext<any>["query"];
        }

        let params: RequestContext<any>["params"] = undefined;
        if (endpoint.params && req.params) {
          const parseResult = endpoint.params.safeParse(req.params);
          if (!parseResult.success) {
            return res.status(400).json({
              error: "Invalid path parameters",
              details: parseResult.error,
            });
          }
          params = parseResult.data as RequestContext<any>["params"];
        }

        const context: RequestContext<any> = {
          body,
          query,
          params,
          headers: req.headers,
        };

        const result = await handler(context);

        // Validate response
        const responseSchema = endpoint.response[result.status];
        if (responseSchema) {
          const parseResult = responseSchema.safeParse(result.body);
          if (!parseResult.success) {
            // Log internal server error but don't expose details to client
            console.error("Response validation failed:", parseResult.error);
            return res.status(500).json({
              error: "Internal server error: invalid response format",
            });
          }
        }

        return res.status(result.status).json(result.body);
      } catch (err) {
        console.error("Unhandled error in endpoint handler:", err);
        return res.status(500).json({
          error: "Internal server error",
        });
      }
    };
  }

  return handlers;
}

// Client implementation
export class ClientBuilder<C extends Contract> {
  constructor(
    private contract: C,
    private baseUrl: string,
    private fetcher?: (url: string, init: RequestInit) => Promise<Response>,
  ) {}

  private getFetcher() {
    return this.fetcher || fetch;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string>,
    query?: Record<string, any>,
  ): string {
    let url = path;

    // Replace path params
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url = url.replace(`:${key}`, encodeURIComponent(value));
      }
    }

    // Add query params
    if (query && Object.keys(query).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            searchParams.append(key, String(item));
          }
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      url += `?${searchParams.toString()}`;
    }

    return `${this.baseUrl}${url}`;
  }

  async request<K extends keyof C>(
    name: K,
    options: {
      params?: C[K] extends { params: SchemaAdapter<infer T> } ? T : never;
      query?: C[K] extends { query: SchemaAdapter<infer T> } ? T : never;
      body?: C[K] extends { body: SchemaAdapter<infer T> } ? T : never;
      headers?: Record<string, string>;
    },
  ): Promise<
    C[K] extends { response: infer R }
      ? R extends Record<number, SchemaAdapter<infer T>>
        ? T
        : never
      : never
  > {
    const endpoint = this.contract[name];
    const { method, path } = endpoint as BaseEndpoint;

    const url = this.buildUrl(path, options.params, options.query);

    const requestInit: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    if (options.body !== undefined) {
      requestInit.body = JSON.stringify(options.body);
    }

    const fetcher = this.getFetcher();
    const response = await fetcher(url, requestInit);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    // Validate response data against the schema for this status code
    const statusCodeKey = response.status.toString();
    const responseSchema = (endpoint as BaseEndpoint).response[response.status];

    if (responseSchema) {
      return responseSchema.parse(responseData);
    }

    return responseData as any;
  }
}

// Create client
export function createClient<C extends Contract>(
  contract: C,
  baseUrl: string,
  fetcher?: (url: string, init: RequestInit) => Promise<Response>,
) {
  return new ClientBuilder(contract, baseUrl, fetcher);
}

// Utility type to infer request and response types from an endpoint
export type InferRequestBody<E> =
  E extends BaseEndpoint<any, any, any, any, infer Req, any> ? Req : never;

export type InferResponseBody<E> =
  E extends BaseEndpoint<any, any, any, any, any, infer Res> ? Res : never;

// Error types
export class ValidationError extends Error {
  constructor(public details: any) {
    super("Validation error");
    this.name = "ValidationError";
  }
}

// Integration with OpenAPI (basic example)
export function generateOpenAPI<C extends Contract>(
  contract: C,
  info: {
    title: string;
    version: string;
    description?: string;
  },
) {
  // This is a simplified implementation
  // A full implementation would need to extract schema information from the validators

  const paths: Record<string, any> = {};

  for (const [name, endpoint] of Object.entries(contract)) {
    const { method, path } = endpoint;

    if (!paths[path]) {
      paths[path] = {};
    }

    paths[path][method.toLowerCase()] = {
      operationId: name,
      // This would need schema information extraction from the validator
      // which would require custom logic for each validator type
    };
  }

  return {
    openapi: "3.0.0",
    info,
    paths,
  };
}
