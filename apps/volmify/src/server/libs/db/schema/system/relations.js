import { relations } from "drizzle-orm";

import { organizationPermissionsGroupPermission } from "../organization/schema";
import { systemPermission, systemPermissionCategory } from "./schema";

export const systemPermissionCategoryRelations = relations(
	systemPermissionCategory,
	({ many }) => ({
		permissions: many(systemPermission),
	}),
);
export const systemPermissionRelations = relations(systemPermission, ({ one, many }) => ({
	category: one(systemPermissionCategory, {
		fields: [systemPermission.categoryId],
		references: [systemPermissionCategory.id],
	}),
	groupPermissions: many(organizationPermissionsGroupPermission),
}));
