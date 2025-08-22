// ## category

import { relations } from "drizzle-orm";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { category, orgEmployee } from "../../schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgBrand } from "../3-brand/schema.js";
import { orgTaxRateCategory } from "../3-tax/schema.js";
import { orgProductCourseSkill } from "../4-product/1-by-type/course/schema.js";
import { org } from "../00-schema.js";
import {
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
	orgCategoryI18n,
} from "./schema.js";

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
	org: one(org, {
		fields: [orgCategory.orgId],
		references: [org.id],
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

	// Ancestor path title references
	ancestorPathTitles: many(orgCategoryClosureAncestorPath),

	orgsBrands: many(orgBrand),
	orgsProductsCoursesSkills: many(orgProductCourseSkill),
	orgsTaxesCategories: many(orgTaxRateCategory),
}));

/**
 * Organization category I18n relations
 * Connects translated content to global categories
 */
export const orgCategoryI18nRelations = relations(orgCategoryI18n, ({ one }) => ({
	org: one(org, {
		fields: [orgCategoryI18n.orgId],
		references: [org.id],
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
	org: one(org, {
		fields: [orgCategoryAssociation.orgId],
		references: [org.id],
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
		fields: [orgCategoryAssociation.parentId],
		references: [orgCategory.id],
		relationName: "categoryParent",
	}),

	// Child category in the relationship
	childCategory: one(orgCategory, {
		fields: [orgCategoryAssociation.childId],
		references: [orgCategory.id],
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
		org: one(org, {
			fields: [orgCategoryClosureAncestorPath.orgId],
			references: [org.id],
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
			fields: [orgCategoryClosureAncestorPath.mainId],
			references: [orgCategory.id],
		}),

		// Title category for display
		titleCategory: one(orgCategory, {
			fields: [orgCategoryClosureAncestorPath.titleId],
			references: [orgCategory.id],
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
	org: one(org, {
		fields: [orgCategoryClosure.orgId],
		references: [org.id],
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
		fields: [orgCategoryClosure.ancestorId],
		references: [orgCategory.id],
		relationName: "closureAncestor",
	}),

	// Descendant category
	descendantCategory: one(orgCategory, {
		fields: [orgCategoryClosure.descendantId],
		references: [orgCategory.id],
		relationName: "closureDescendant",
	}),
}));

// -- category
