import type { StandardSchemaV1 } from "@standard-schema/spec";

export interface ProtectedRouteRequest<
  RequestBodySchema extends StandardSchemaV1 | undefined = undefined,
> extends Request {
  ctx: {
    user: { userId: string };
    requestBody: RequestBodySchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<RequestBodySchema>
      : undefined;
  };
}

export interface InferRoute<
  RequestBodySchema extends StandardSchemaV1 | undefined = undefined,
  Result = unknown,
> {
  input: {
    requestBody: RequestBodySchema extends StandardSchemaV1
      ? StandardSchemaV1.InferInput<RequestBodySchema>
      : undefined;
  };
  output:
    | {
        type: "success";
        statusNum: number;
        data: Result;
      }
    | {
        type: "error";
        statusNum: number;
        message: string;
      };
}
