import type { StandardSchemaV1 } from "@standard-schema/spec";

type SchemaReturnType<
  Schema extends StandardSchemaV1,
  IsAsync = false,
> = IsAsync extends true
  ? Promise<StandardSchemaV1.InferOutput<Schema>>
  : StandardSchemaV1.InferOutput<Schema>;

function checkIsAsync<IsAsync extends boolean>(
  result: unknown,
  isAsync?: IsAsync,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): result is Promise<any> {
  if (isAsync) {
    return true;
  }

  if (result instanceof Promise) {
    throw new Error(
      "Expected a synchronous validation, but got an asynchronous one.",
    );
  }

  return false;
}

export function standardValidate<
  T extends StandardSchemaV1,
  IsAsync extends boolean = false,
>(
  schema: T,
  input: StandardSchemaV1.InferInput<T>,
  options?: { isAsync?: IsAsync },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
): SchemaReturnType<T, IsAsync> {
  const result = schema["~standard"].validate(input);

  if (checkIsAsync(result, options?.isAsync)) {
    return result.then((result) => {
      // if the `issues` field exists, the validation failed
      if (result.issues) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      return result.value;
    });
  }

  // if the `issues` field exists, the validation failed
  if (result.issues) {
    throw new Error(JSON.stringify(result.issues, null, 2));
  }

  return result.value as SchemaReturnType<T, IsAsync>;
}
