import { index, text, varchar } from "drizzle-orm/pg-core";

import { createdAt, id, name, table } from "../_utils/helpers.js";

export const systemPermissionCategory = table(
	"system_permission_category",
	{
		id,
		name: name.notNull().unique("uq_system_permission_category_name"),
		description: varchar("description", { length: 256 }),
		createdAt,
	},
	(table) => [
		index("idx_system_permission_category_created_at").on(table.createdAt),
		index("idx_system_permission_category_name").on(table.name),
		index("idx_system_permission_category_name_lookup").on(table.name), // For fast lookups
	],
);
export const systemPermission = table(
	"system_permission",
	{
		id,
		name: name.notNull().unique("uq_system_permission_name"),
		description: varchar("description", { length: 256 }),
		categoryId: text("category_id")
			.notNull()
			.references(() => systemPermissionCategory.id, { onDelete: "cascade" }),
		createdAt,
	},
	(table) => [
		index("idx_system_permission_created_at").on(table.createdAt),
		index("idx_system_permission_name").on(table.name),
		index("idx_system_permission_category").on(table.categoryId),
	],
);
