import { index, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, name, table, updatedAt } from "../_utils/helpers.js";

/**
 * @fileoverview System Permission Registry - ABAC Foundation
 *
 * @architecture Attribute-Based Access Control (ABAC)
 * Implements a centralized permission registry where permissions are attributes
 * that can be dynamically assigned to subjects (users) through org
 * contexts. Supports complex permission combinations and contextual access control.
 *
 * @designPattern Registry + Attribute Assignment
 * - Registry: All possible permissions defined at system level
 * - Attributes: Permissions become attributes assigned through org groups
 * - Context: Access control evaluated within org boundaries
 *
 * @abacFlow
 * ```
 * Subject (User) + Context (Organization) + Action (Permission) + Resource → Decision
 * ```
 *
 * @integrationPoints
 * - Authorization middleware: Real-time permission evaluation
 * - Organization onboarding: Permission group template creation
 * - Admin dashboards: Permission management interfaces
 *
 * @businessValue
 * Enables fine-grained, contextual access control across multi-tenant platform
 * while maintaining centralized permission definitions and audit trails.
 */

/**
 * Permission Category Registry
 *
 * @abacRole Attribute Namespace
 * Categories serve as namespaces for organizing permission attributes in ABAC.
 * They enable contextual permission grouping for both UI presentation and
 * logical access control policies.
 *
 * @businessLogic
 * Categories represent functional domains (e.g., "content_management", "user_administration").
 * This org supports role-based permission templates and simplifies
 * permission discovery during org setup.
 *
 * @cascadeDesign
 * Cascade deletion ensures no orphaned permissions exist, maintaining ABAC
 * integrity by preventing references to undefined permission attributes.
 */
export const systemPermissionCategory = table(
	"system_permission_category",
	{
		id: id.notNull(),
		/**
		 * Namespace identifier for permission grouping
		 * @businessRule snake_case, represents functional domain
		 * @abacContext Used for attribute namespace org
		 */
		name: name.notNull().unique("uq_system_permission_category_name"),
		description: varchar("description", { length: 256 }),
		createdAt,
	},
	(table) => [
		index("idx_system_permission_category_created_at").on(table.createdAt),
		index("idx_system_permission_category_name").on(table.name),
		index("idx_system_permission_category_name_lookup").on(table.name),
	],
);

/**
 * System Permission Attribute Registry
 *
 * @abacRole Permission Attribute Definition
 * Each permission represents an atomic attribute that can be assigned to subjects
 * within organizational contexts. Forms the foundation for all access control
 * decisions in the ABAC system.
 *
 * @immutabilityConstraint
 * Permission names become immutable once referenced by organizations to prevent
 * breaking existing access control policies and maintain audit trail integrity.
 *
 * @attributeNaming action_resource pattern enables clear policy definition
 * Examples: "create_course", "publish_content", "manage_users"
 *
 * @securityModel Whitelist-only approach
 * - No custom permissions at org level
 * - All permissions must be predefined in this registry
 * - Enables centralized security policy management
 */
export const systemPermission = table(
	"system_permission",
	{
		id: id.notNull(),
		/**
		 * Unique permission attribute identifier
		 * @abacAttribute Core attribute for access control decisions
		 * @namingPattern action_resource (e.g., "create_course", "delete_user")
		 * @immutable Once referenced by organizations, should not change
		 */
		name: name.notNull().unique("uq_system_permission_name"),
		description: varchar("description", { length: 256 }),
		/**
		 * Category namespace assignment
		 * @abacContext Groups related permissions for policy management
		 * @cascadePolicy Removing category cleans up all contained permissions
		 */
		categoryId: text("category_id")
			.notNull()
			.references(() => systemPermissionCategory.id, { onDelete: "cascade" }),
		createdAt,
	},
	(table) => [
		index("idx_system_permission_created_at").on(table.createdAt),
		// Critical for authorization performance - high-frequency lookups
		index("idx_system_permission_name").on(table.name),
		index("idx_system_permission_category").on(table.categoryId),
	],
);

/**
 * Locale Registry
 *
 * @abacRole Locale Definition
 * Defines supported locales for the platform, enabling
 * multi-language support and regional customization.
 * @businessLogic
 * Locales are defined by a combination of language and region codes,
 * e.g., "en-US" for English (United States).
 * @namingPattern
 * "language-region" (e.g., "en-US", "fr-FR")
 * @integrationPoints
 * - Localization middleware: Determines content language based on user locale
 * - UI rendering: Displays content in user's preferred language
 * @businessValue
 * Enables global reach and user experience personalization
 * by supporting multiple languages and regions.
 * @designPattern
 * Centralized locale registry with unique locale identifiers
 * to ensure consistent language handling across the platform.
 * @securityModel
 * - Whitelist-only approach: All supported locales must be predefined
 * - No custom locales allowed at org level
 *  Ensures consistent language handling and prevents
 * locale-related security issues.
 */
export const locale = table(
	"locale",
	{
		// id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,

		// locale: text("locale").notNull(),
		// languageCode: text("language_code").notNull(), // e.g. "en", "fr", "es"
		// regionCode: text("region_code").notNull(), // e.g. "US", "GB", "CA"
		locale: text("locale").notNull().primaryKey(), // e.g. "en-US", "fr-FR"
	},
	(t) => {
		const _base = "locale";
		return [
			index(`idx_${_base}_created_at`).on(t.createdAt),
			index(`idx_${_base}_updated_at`).on(t.updatedAt),
		];
	},
);
