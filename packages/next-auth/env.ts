import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4-mini";

export const env = createEnv({
	server: {
		AUTH_DISCORD_ID: z.string().check(z.minLength(1)),
		AUTH_DISCORD_SECRET: z.string().check(z.minLength(1)),
		AUTH_SECRET:
			// process.env.NODE_ENV === "production" ? z.string().min(1) : z.string().min(1).optional(),
			process.env.NODE_ENV === "production"
				? z.string().check(z.minLength(1))
				: z.optional(z.string().check(z.minLength(1))),
		// NODE_ENV: z.enum(["development", "production"]).optional(),
		NODE_ENV: z.prefault(z.enum(["development", "production", "test"]), "development"),
	},
	client: {},
	experimental__runtimeEnv: {},
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
