import { createEnv } from "@de100/env";
import { z } from "zod";

const   ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  
export const env = createEnv({
  server: {
    ENCRYPTION_KEY: z.string().min(1),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      // (str) => process.env.VERCEL_URL ?? str,

      (str) => process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? str,

      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL_URL ? z.string() : z.string().url(),
    ),
  },
  // client: {},
  // runtimeEnv: {
  //   ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  //   NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  // },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
