import { relations } from "drizzle-orm";
import { orgLocale } from "#db/schema/org/locale-region/schema.js";
import { orgEmployee } from "#db/schema/org/member/employee/schema.js";
import { userLocale } from "#db/schema/user/locale/schema.js";
import { user } from "#db/schema/user/schema.js";
import { seoMetadata } from "../seo/schema.js";
import {
	category,
	categoryMetrics,
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
	orgCategoryI18n,
	userCategory,
	userCategoryI18n,
} from "./schema.js";

// =====================================
//  GLOBAL CATEGORY RELATIONS
// =====================================

/**
 * Global category registry relations
 * Connects to platform-wide metrics and migration targets
 */
export const categoryRelations = relations(category, ({ one, many }) => ({
	// One-to-one with metrics for analytics
	metrics: one(categoryMetrics, {
		fields: [category.slug],
		references: [categoryMetrics.slugRef],
	}),

	// Self-referential migration target relationship
	migrationTarget: one(category, {
		fields: [category.migrationTarget],
		references: [category.slug],
		relationName: "categoryMigration",
	}),
	migrationSources: many(category, {
		relationName: "categoryMigration",
	}),

	// Organization adoptions of this category
	orgAdoptions: many(orgCategory),

	// User adoptions of this category
	userAdoptions: many(userCategory),

	// I18n content for organizations
	orgI18nEntries: many(orgCategoryI18n),

	// I18n content for users
	userI18nEntries: many(userCategoryI18n),

	// Ancestor path title references
	ancestorPathTitles: many(orgCategoryClosureAncestorPath),
}));

/**
 * Category metrics relations
 * Links analytics back to the global category
 */
export const categoryMetricsRelations = relations(categoryMetrics, ({ one }) => ({
	category: one(category, {
		fields: [categoryMetrics.slugRef],
		references: [category.slug],
	}),
}));

// =====================================
//  ORG CATEGORY RELATIONS
// =====================================

/**
 * Organization category relations
 * Central hub connecting org-specific category data
 */
export const orgCategoryRelations = relations(orgCategory, ({ one, many }) => ({
	// Link to global category registry
	globalCategory: one(category, {
		fields: [orgCategory.slugRef],
		references: [category.slug],
	}),
	org: one(orgCategory, {
		fields: [orgCategory.orgId],
		references: [orgCategory.orgId],
	}),
	createdByEmployee: one(orgEmployee, {
		fields: [orgCategory.createdByEmployeeId],
		references: [orgEmployee.id],
		relationName: "createdByEmployee",
	}),
	lastUpdatedByEmployee: one(orgEmployee, {
		fields: [orgCategory.lastUpdatedByEmployeeId],
		references: [orgEmployee.id],
		relationName: "lastUpdatedByEmployee",
	}),

	// I18n content for this org category
	translations: many(orgCategoryI18n),

	// Parent relationships (this category as child)
	parentRelationships: many(orgCategoryAssociation, {
		relationName: "categoryChild",
	}),

	// Child relationships (this category as parent)
	childRelationships: many(orgCategoryAssociation, {
		relationName: "categoryParent",
	}),

	// Ancestor path entries where this is the main category
	ancestorPaths: many(orgCategoryClosureAncestorPath),

	// Closure entries as ancestor
	closureAsAncestor: many(orgCategoryClosure, {
		relationName: "closureAncestor",
	}),

	// Closure entries as descendant
	closureAsDescendant: many(orgCategoryClosure, {
		relationName: "closureDescendant",
	}),
}));

/**
 * Organization category I18n relations
 * Connects translated content to global categories
 */
export const orgCategoryI18nRelations = relations(orgCategoryI18n, ({ one }) => ({
	org: one(orgCategory, {
		fields: [orgCategoryI18n.orgId],
		references: [orgCategory.orgId],
	}),

	// Link to global category
	globalCategory: one(category, {
		fields: [orgCategoryI18n.slugRef],
		references: [category.slug],
	}),

	seoMetadata: one(seoMetadata, {
		fields: [orgCategoryI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(orgLocale, {
		fields: [orgCategoryI18n.localeKey],
		references: [orgLocale.localeKey],
	}),

	// Note: orgCategory relationship would need composite key support
	// This is handled through slugRef → globalCategory → orgAdoptions pattern
}));

// =====================================
//  ORG CATEGORY DAG RELATIONS
// =====================================

/**
 * Organization category association relations
 * Defines parent-child relationships in the DAG
 */
export const orgCategoryAssociationRelations = relations(orgCategoryAssociation, ({ one }) => ({
	org: one(orgCategory, {
		fields: [orgCategoryAssociation.orgId],
		references: [orgCategory.orgId],
	}),
	createdByEmployee: one(orgEmployee, {
		fields: [orgCategoryAssociation.createdByEmployeeId],
		references: [orgEmployee.id],
		relationName: "createdByEmployee",
	}),
	lastUpdatedByEmployee: one(orgEmployee, {
		fields: [orgCategoryAssociation.lastUpdatedByEmployeeId],
		references: [orgEmployee.id],
		relationName: "lastUpdatedByEmployee",
	}),

	// Parent category in the relationship
	parentCategory: one(orgCategory, {
		fields: [
			orgCategoryAssociation.orgId,
			orgCategoryAssociation.parentSlugRef,
			orgCategoryAssociation.scope,
		],
		references: [orgCategory.orgId, orgCategory.slugRef, orgCategory.scope],
		relationName: "categoryParent",
	}),

	// Child category in the relationship
	childCategory: one(orgCategory, {
		fields: [
			orgCategoryAssociation.orgId,
			orgCategoryAssociation.childSlugRef,
			orgCategoryAssociation.scope,
		],
		references: [orgCategory.orgId, orgCategory.slugRef, orgCategory.scope],
		relationName: "categoryChild",
	}),
}));

/**
 * Ancestor path closure relations
 * Links path definitions to categories and closures
 */
export const orgCategoryClosureAncestorPathRelations = relations(
	orgCategoryClosureAncestorPath,
	({ one, many }) => ({
		org: one(orgCategory, {
			fields: [orgCategoryClosureAncestorPath.orgId],
			references: [orgCategory.orgId],
		}),
		createdByEmployee: one(orgEmployee, {
			fields: [orgCategoryClosureAncestorPath.createdByEmployeeId],
			references: [orgEmployee.id],
			relationName: "createdByEmployee",
		}),
		lastUpdatedByEmployee: one(orgEmployee, {
			fields: [orgCategoryClosureAncestorPath.lastUpdatedByEmployeeId],
			references: [orgEmployee.id],
			relationName: "lastUpdatedByEmployee",
		}),

		// Main category this path represents
		mainCategory: one(orgCategory, {
			fields: [
				orgCategoryClosureAncestorPath.orgId,
				orgCategoryClosureAncestorPath.mainSlugRef,
				orgCategoryClosureAncestorPath.scope,
			],
			references: [orgCategory.orgId, orgCategory.slugRef, orgCategory.scope],
		}),

		// Title category for display
		titleCategory: one(category, {
			fields: [orgCategoryClosureAncestorPath.titleSlugRef],
			references: [category.slug],
		}),

		// Closure entries using this path
		closureEntries: many(orgCategoryClosure),
	}),
);

/**
 * Category closure relations
 * Links materialized paths to ancestor paths and categories
 */
export const orgCategoryClosureRelations = relations(orgCategoryClosure, ({ one }) => ({
	org: one(orgCategory, {
		fields: [orgCategoryClosure.orgId],
		references: [orgCategory.orgId],
	}),
	createdByEmployee: one(orgEmployee, {
		fields: [orgCategoryClosure.createdByEmployeeId],
		references: [orgEmployee.id],
		relationName: "createdByEmployee",
	}),
	lastUpdatedByEmployee: one(orgEmployee, {
		fields: [orgCategoryClosure.lastUpdatedByEmployeeId],
		references: [orgEmployee.id],
		relationName: "lastUpdatedByEmployee",
	}),

	// Ancestor path definition
	ancestorPath: one(orgCategoryClosureAncestorPath, {
		fields: [orgCategoryClosure.ancestorPathId],
		references: [orgCategoryClosureAncestorPath.id],
	}),

	// Ancestor category
	ancestorCategory: one(orgCategory, {
		fields: [
			orgCategoryClosure.orgId,
			orgCategoryClosure.ancestorSlugRef,
			orgCategoryClosure.scope,
		],
		references: [orgCategory.orgId, orgCategory.slugRef, orgCategory.scope],
		relationName: "closureAncestor",
	}),

	// Descendant category
	descendantCategory: one(orgCategory, {
		fields: [
			orgCategoryClosure.orgId,
			orgCategoryClosure.descendantSlugRef,
			orgCategoryClosure.scope,
		],
		references: [orgCategory.orgId, orgCategory.slugRef, orgCategory.scope],
		relationName: "closureDescendant",
	}),
}));

// =====================================
//  USER CATEGORY RELATIONS
// =====================================

/**
 * User category relations
 * Links user-specific categories to global registry
 */
export const userCategoryRelations = relations(userCategory, ({ one, many }) => ({
	user: one(user, {
		fields: [userCategory.userId],
		references: [user.id],
	}),

	// Link to global category registry
	globalCategory: one(category, {
		fields: [userCategory.slugRef],
		references: [category.slug],
	}),

	// I18n content for this user category
	translations: many(userCategoryI18n),
}));

/**
 * User category I18n relations
 * Connects user-translated content to global categories
 */
export const userCategoryI18nRelations = relations(userCategoryI18n, ({ one }) => ({
	user: one(user, {
		fields: [userCategoryI18n.userId],
		references: [user.id],
	}),

	// Link to global category
	globalCategory: one(category, {
		fields: [userCategoryI18n.slugRef],
		references: [category.slug],
	}),

	seoMetadata: one(seoMetadata, {
		fields: [userCategoryI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(userLocale, {
		fields: [userCategoryI18n.localeKey],
		references: [userLocale.localeKey],
	}),

	// Note: userCategory relationship would need composite key support
	// This is handled through slugRef → globalCategory → userAdoptions pattern
}));
