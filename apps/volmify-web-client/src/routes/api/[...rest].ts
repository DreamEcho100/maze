import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { APIEvent } from "@solidjs/start/server";
import { router } from "#libs/orpc/router/index.ts";
import "#libs/orpc/polyfill.ts";
import { CredentialSchema, TokenSchema } from "#libs/schemas/auth.ts";
import {
	NewPlanetSchema,
	PlanetSchema,
	UpdatePlanetSchema,
} from "#libs/schemas/planet.ts";
import { NewUserSchema, UserSchema } from "#libs/schemas/user.ts";

const handler = new OpenAPIHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
	plugins: [
		new SmartCoercionPlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: "ORPC Playground",
					version: "1.0.0",
				},
				commonSchemas: {
					NewUser: { schema: NewUserSchema },
					User: { schema: UserSchema },
					Credential: { schema: CredentialSchema },
					Token: { schema: TokenSchema },
					NewPlanet: { schema: NewPlanetSchema },
					UpdatePlanet: { schema: UpdatePlanetSchema },
					Planet: { schema: PlanetSchema },
					UndefinedError: { error: "UndefinedError" },
				},
				security: [{ bearerAuth: [] }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
						},
					},
				},
			},
			docsConfig: {
				authentication: {
					securitySchemes: {
						bearerAuth: {
							token: "default-token",
						},
					},
				},
			},
		}),
	],
});

async function handle({ request }: APIEvent) {
	const context = request.headers.get("Authorization")
		? { user: { id: "test", name: "John Doe", email: "john@doe.com" } }
		: {};

	const { response } = await handler.handle(request, {
		prefix: "/api",
		context,
	});

	return response ?? new Response("Not Found", { status: 404 });
}

export const HEAD = handle;
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
