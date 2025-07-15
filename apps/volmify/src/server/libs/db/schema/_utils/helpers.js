import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

const createId = ulid;

export const userTableName = "user";
export const id = text("id").primaryKey().notNull().$default(createId);
export const fk = text;
export const name = varchar("name", { length: 128 });
export const slug = varchar("slug", { length: 128 });
export const createdAt = timestamp("created_at", { precision: 3 }).notNull().defaultNow();
export const updatedAt = timestamp("updated_at", { precision: 3 });
export const deletedAt = timestamp("deleted_at", { precision: 3 });
export const getLocaleKey =
	/** @param {string} name */
	(name) => varchar(name, { length: 10 }); // .notNull().default("en-US");
export const table = pgTable;
