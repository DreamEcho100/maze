import { boolean, jsonb } from "drizzle-orm/pg-core";

export const sharedCols = {
	isDefault: () => boolean("is_default").default(false),

	// Business status columns
	isActive: () => boolean("is_active").default(true),
	isSystem: () => boolean("is_system").default(false), // System vs custom entities
	isFeatured: () => boolean("is_featured").default(false), // Marketing prominence

	// Creator economy columns
	attribution: () => jsonb("attribution"), // Creator/brand attribution
	compensation: () => jsonb("compensation"), // Revenue sharing config
};
