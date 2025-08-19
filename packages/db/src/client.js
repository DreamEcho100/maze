import { drizzle } from "drizzle-orm/node-postgres";

import * as dbSchema from "./schema/index.js";

function generateDbClient() {
	return drizzle(process.env.DATABASE_URL ?? "", {
		schema: dbSchema,
		logger: true,
	});
}

function ensureGlobalDbInstance() {
	const global_ = /** @type {{ __db: ReturnType<typeof generateDbClient> }} */ (
		/** @type {unknown} */ (global)
	);

	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	return (global_.__db ??= generateDbClient());
}

export const db = ensureGlobalDbInstance();
export { dbSchema };
