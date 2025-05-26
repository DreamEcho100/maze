import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/server/libs/db/schema",
	out: "./src/server/libs/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
