import { z } from "zod/v4";

import { createEnv } from "@de100/env";

export const env = createEnv({
	server: {
		ENCRYPTION_KEY: z.string().min(1),
		// .refine(
		//     (key) => {
		//         try {
		//             // Decode base64 and check length
		//             const decoded = Buffer.from(key, 'base64');
		//             return decoded.length === 16; // 16 bytes for AES-128
		//         } catch {
		//             return false; // Invalid base64
		//         }
		//     },
		//     {
		//         message: "ENCRYPTION_KEY must be a valid base64 string that decodes to exactly 16 bytes (128 bits). Generate one with: openssl rand -base64 16"
		//     }
		// ),
		NEXTAUTH_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
			// Since NextAuth.js automatically uses the VERCEL_URL if present.
			// (str) => process.env.VERCEL_URL ?? str,

			(str) => process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? str,

			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL_URL ? z.string() : z.url(),
		),
	},
	// // client: {},
	// runtimeEnv: {
	// 	ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
	// 	NEXTAUTH_URL: process.env.NEXTAUTH_URL,
	// },
	skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
