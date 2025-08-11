import { drizzle } from "drizzle-orm/node-postgres";

import * as dbSchema from "./schema/index.js";

export const db = drizzle(process.env.DATABASE_URL ?? "", { schema: dbSchema, logger: true });
export { dbSchema };
