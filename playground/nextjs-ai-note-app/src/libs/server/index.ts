import type { StandardSchemaV1 } from "@standard-schema/spec";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import type { ProtectedRouteRequest } from "./types";

export const protectedRoute = <
	RequestBodySchema extends StandardSchemaV1 | undefined = undefined,
	Result = unknown,
>(param: {
	handler: (req: ProtectedRouteRequest<RequestBodySchema>) => Promise<
		| ({
				type?: "success";
		  } & (
				| { json: Result; stream?: never; statusNum?: number }
				| { json?: never; stream: ReadableStream }
		  ))
		| { type: "error"; statusNum?: number; message: string }
	>;
	requestBodySchema?: RequestBodySchema;
}) => {
	return async (req: ProtectedRouteRequest<RequestBodySchema>) => {
		try {
			const user = await auth();

			if (!user.userId) {
				return Response.json({ error: "Unauthorized" }, { status: 401 });
			}

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			req.ctx = req.ctx ?? {};

			req.ctx.user = {
				userId: user.userId,
			};

			if (param.requestBodySchema) {
				const body = await param.requestBodySchema["~standard"].validate(await req.json());
				if (body.issues) {
					console.error(body.issues);
					return Response.json({ error: "Invalid input" }, { status: 400 });
				}
				req.ctx.requestBody =
					body.value as ProtectedRouteRequest<RequestBodySchema>["ctx"]["requestBody"];
			}

			const result = await param.handler(req);

			if (result.type === "error") {
				return Response.json(
					{
						type: "error",
						statusNum: result.statusNum,
						message: result.message,
					},
					{ status: result.statusNum ?? 500 },
				);
			}

			if (result.stream) {
				return new NextResponse(result.stream, {
					headers: {
						// "Content-Type": "text/plain",
						"Transfer-Encoding": "chunked",
						"Content-Type": "text/html; charset=utf-8",
						Connection: "keep-alive",
						"Cache-Control": "no-cache, no-transform",
					},
				});
			}

			return Response.json(
				{
					type: "success",
					statusNum: result.statusNum ?? 200,
					data: result.json,
				},
				{ status: result.statusNum ?? 200 },
			);
		} catch (error) {
			console.error(error);
			return Response.json(
				{
					type: "error",
					statusNum: 500,
					message: "Internal server error",
				},
				{ status: 500 },
			);
		}
	};
};
