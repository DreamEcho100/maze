import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4-mini";

import { createEnv } from "@de100/env";

export const env = createEnv({
	extends: [vercel()],
	shared: {
		// NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		NODE_ENV: z.prefault(z.enum(["development", "production", "test"]), "development"),
	},
	/**
	 * Specify your server-side environment variables schema here.
	 * This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		// OPEN_ROUTER_API_KEY: z.string().min(1),
		// EXA_SEARCH_API_KEY: z.string().min(1),
		OPENAI_API_KEY: z.string().check(z.minLength(1)),
		GOOGLE_API_KEY: z.string().check(z.minLength(1)),
	},

	// clientPrefix: "NEXT_PUBLIC_",
	/**
	 * Specify your client-side environment variables schema here.
	 * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
	 */
	// client: {
	// },
	/**
	 * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
	 */
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
	},
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
