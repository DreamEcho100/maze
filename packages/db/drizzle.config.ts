import type { Config } from "drizzle-kit";

// if (!process.env.POSTGRES_URL) {
// 	throw new Error("Missing POSTGRES_URL");
// }

// const _nonPoolingUrl = process.env.POSTGRES_URL.replace(":6543", ":5432");
console.log("___ process.env.DATABASE_URL", process.env.DATABASE_URL);
export default {
	// schema: "./src/schema.ts",
	// dialect: "postgresql",
	// dbCredentials: { url: nonPoolingUrl },
	// casing: "snake_case",
	schema: "./src/schema/index.js",
	out: "./src/schema/_migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
} satisfies Config;
