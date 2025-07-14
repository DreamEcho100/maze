import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

const createId = ulid;

export const orgTableName = "org";
export const id = text("id").primaryKey().notNull().$default(createId);
export const fk = text;
export const name = varchar("name", { length: 100 });
export const slug = varchar("slug", { length: 100 });
export const createdAt = timestamp("created_at", { precision: 3 }).notNull().defaultNow();
export const updatedAt = timestamp("updated_at", { precision: 3 });
export const deletedAt = timestamp("deleted_at", { precision: 3 });
export const table = pgTable;
