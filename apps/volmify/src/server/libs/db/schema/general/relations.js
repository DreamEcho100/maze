import { relations } from "drizzle-orm";
// import { orgPermissionsGroupPermission } from "../org/schema.js";
import { systemPermission, systemPermissionCategory } from "./schema.js";

/**
 * @fileoverview ABAC System Permission Relations
 *
 * @abacRelationships
 * Defines the foundational relationships for attribute-based access control:
 * - Hierarchical permission org (categories)
 * - Cross-context attribute assignment (org integration)
 */

/**
 * Category → Permissions (ABAC Namespace Relationship)
 *
 * @abacRole Attribute namespace container
 * Enables logical grouping of permission attributes for policy management
 * and simplified role template creation during org onboarding.
 *
 * @cascadeBehavior Maintains ABAC integrity by preventing orphaned attributes
 */
export const systemPermissionCategoryRelations = relations(
	systemPermissionCategory,
	({ many }) => ({
		permissions: many(systemPermission),
	}),
);

/**
 * Permission Relations (ABAC Attribute Assignments)
 *
 * @abacRole Core permission attribute with context assignments
 *
 * @crossContextIntegration
 * The `groupPermissions` relationship enables the same permission attribute
 * to be assigned across multiple org contexts, supporting the
 * multi-tenant ABAC model where permissions are contextual to orgs.
 *
 * @authorizationPath
 * ```
 * User → Org Context → Permission Group → System Permission
 * ```
 * This path enables runtime authorization decisions based on user context.
 */
export const systemPermissionRelations = relations(systemPermission, ({ one, many }) => ({
	/**
	 * @abacContext Namespace assignment for attribute org
	 */
	category: one(systemPermissionCategory, {
		fields: [systemPermission.categoryId],
		references: [systemPermissionCategory.id],
	}),
}));
