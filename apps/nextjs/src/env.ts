import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4-mini";

import { createEnv } from "@de100/env";
import { env as authEnv } from "@de100/next-auth/env";

export const env = createEnv({
	extends: [authEnv, vercel()],
	shared: {
		NODE_ENV: z.prefault(z.enum(["development", "production", "test"]), "development"),
	},
	/**
	 * Specify your server-side environment variables schema here.
	 * This way you can ensure the app isn't built with invalid env vars.
	 */
	server: {
		POSTGRES_URL: z.string().check(z.url()),
	},

	// // clientPrefix: 'NEXT_PUBLIC_',
	// /**
	//  * Specify your client-side environment variables schema here.
	//  * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
	//  */
	// client: {
	//   // NEXT_PUBLIC_CLIENTVAR: z.string(),
	// },
	/**
	 * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
	 */
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,

		// NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
	},
	skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
