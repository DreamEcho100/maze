import type { StandardSchemaV1 } from "@de100/standard-schema";

type ErrorMessage<T extends string> = T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TExtendsItem = Record<string, any>;

type MergeUnion<T> = {
  [K in T extends unknown ? keyof T : never]: T extends Record<K, infer V>
    ? V
    : never;
};

type ExtractObject<Item> =
  Item extends Readonly<infer internal_TExtends>
    ? internal_TExtends extends Record<string, StandardSchemaV1>
      ? {
          [Key in keyof internal_TExtends]: StandardSchemaV1.InferOutput<
            internal_TExtends[Key]
          >;
        }
      : {
          [Key in keyof internal_TExtends]: internal_TExtends[Key];
        }
    : Item extends Record<string, StandardSchemaV1>
      ? {
          [Key in keyof Item]: StandardSchemaV1.InferOutput<Item[Key]>;
        }
      : Item extends Record<string, unknown>
        ? {
            [Key in keyof Item]: Item[Key];
          }
        : never;
type CreateEnvOutput<
  TClientPrefix extends string,
  TClient extends Record<`${TClientPrefix}${string}`, StandardSchemaV1>,
  TServer extends Record<string, StandardSchemaV1> = Record<
    string,
    StandardSchemaV1
  >,
  TShared extends Record<string, StandardSchemaV1> = Record<
    string,
    StandardSchemaV1
  >,
  TExtends extends TExtendsItem[] = TExtendsItem[],
> = ExtractObject<TClient> &
  ExtractObject<TServer> &
  (
    | {
        [Key in keyof TShared]: StandardSchemaV1.InferOutput<TShared[Key]>;
      }
    | {
        [Key in keyof ExtractObject<
          MergeUnion<TExtends[number]>
        >]: ExtractObject<MergeUnion<TExtends[number]>>[Key];
      }
  );

/** The Standard Schema interface. */ function parseWithDictionary(
  dictionary: Readonly<Record<string, StandardSchemaV1>>,
  value: Record<string, unknown>,
) {
  const result: Record<string, unknown> = {};
  const issues = [];
  for (const key in dictionary) {
    const schema = dictionary[key];
    if (!schema) {
      issues.push({
        message: `Schema for ${key} is missing.`,
      });
      continue;
    }

    const prop = value[key];
    const propResult = schema["~standard"].validate(prop);
    if (propResult instanceof Promise) {
      throw new Error(
        `Validation must be synchronous, but ${key} returned a Promise.`,
      );
    }
    if (propResult.issues) {
      issues.push(
        ...propResult.issues.map((issue) => ({
          ...issue,
          path: [key, ...(issue.path ?? [])],
        })),
      );
      continue;
    }
    result[key] = propResult.value;
  }
  if (issues.length) {
    return {
      issues,
    };
  }
  return {
    value: result,
  };
}

export function createEnv<
  TClientPrefix extends string,
  TServer extends Record<string, StandardSchemaV1> = Record<
    string,
    StandardSchemaV1
  >,
  TClient extends Record<
    `${TClientPrefix}${string}`,
    StandardSchemaV1
  > = Record<`${TClientPrefix}${string}`, StandardSchemaV1>,
  TShared extends Record<string, StandardSchemaV1> = Record<
    string,
    StandardSchemaV1
  >,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TExtends extends TExtendsItem[] = TExtendsItem[],
>(options: {
  server?: TServer;
  clientPrefix?: TClientPrefix;
  client?: Partial<{
    [TKey in keyof TClient]: TKey extends `${TClientPrefix}${string}`
      ? TClient[TKey]
      : ErrorMessage<`${TKey extends string ? TKey : never} is not prefixed with ${TClientPrefix}.`>;
  }>;
  shared?: TShared;
  extends?: TExtends;
  skipValidation?: boolean;
  emptyStringAsUndefined?: boolean;
  isServer?: boolean;
  onValidationError?: (issues: unknown[]) => void;
  onInvalidAccess?: (key: string) => void;

  /**
   * Can be used for Next.js ^13.4.4 since they stopped static analysis of server side `process.env`.
   * Only client side `process.env` is statically analyzed and needs to be manually destructured.
   */
  experimental__runtimeEnv?: Record<
    | {
        [TKey in keyof TClient]: TKey extends `${TClientPrefix}${string}`
          ? TKey
          : never;
      }[keyof TClient]
    | {
        [TKey in keyof TShared]: TKey extends string ? TKey : never;
      }[keyof TShared],
    string | boolean | number | undefined
  >;
}): CreateEnvOutput<TClientPrefix, TServer, TClient, TShared, TExtends> {
  type EnvOutput = CreateEnvOutput<
    TClientPrefix,
    TServer,
    TClient,
    TShared,
    TExtends
  >;

  const runtimeEnv = process.env; // opts.runtimeEnvStrict ?? opts.runtimeEnv ??

  const emptyStringAsUndefined = options.emptyStringAsUndefined ?? false;
  if (emptyStringAsUndefined) {
    for (const [key, value] of Object.entries(runtimeEnv)) {
      if (value === "") {
        runtimeEnv[key] = undefined;
      }
    }
  }

  const skip = !!options.skipValidation;
  if (skip) return runtimeEnv as unknown as EnvOutput;

  const _client = typeof options.client === "object" ? options.client : {};
  const _server = typeof options.server === "object" ? options.server : {};
  const _shared = typeof options.shared === "object" ? options.shared : {};

  const isServer =
    options.isServer ?? (typeof window === "undefined" || "Deno" in window);

  const finalSchema = isServer
    ? {
        ..._server,
        ..._shared,
        ..._client,
      }
    : {
        ..._client,
        ..._shared,
      };

  const parsed = parseWithDictionary(finalSchema, runtimeEnv);
  const onValidationError =
    options.onValidationError ??
    ((issues) => {
      console.error("❌ Invalid environment variables:", issues);
      throw new Error("Invalid environment variables");
    });
  const onInvalidAccess =
    options.onInvalidAccess ??
    (() => {
      throw new Error(
        "❌ Attempted to access a server-side environment variable on the client",
      );
    });

  if (parsed.issues) {
    onValidationError(parsed.issues);
  }

  const isServerAccess = (prop: string) => {
    if (!options.clientPrefix) return true;
    return !prop.startsWith(options.clientPrefix) && !(prop in _shared);
  };
  const isValidServerAccess = (prop: string) => {
    return isServer || !isServerAccess(prop);
  };
  const ignoreProp = (prop: string) => {
    return prop === "__esModule" || prop === "$$typeof";
  };

  const fullEnv = {};

  if (options.extends) {
    for (const item of options.extends) {
      Object.assign(fullEnv, item);
    }
  }
  Object.assign(finalSchema, fullEnv);

  const env = new Proxy(runtimeEnv, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (ignoreProp(prop)) return undefined;
      if (!isValidServerAccess(prop)) return onInvalidAccess(prop);
      return Reflect.get(target, prop);
    },
  });

  return Object.freeze(env) as unknown as EnvOutput;
}
