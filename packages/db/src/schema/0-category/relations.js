// ## category

import { relations } from "drizzle-orm";
import { userCategory, userCategoryI18n } from "../2-user/0-category/schema.js";
import { orgCategory, orgCategoryI18n } from "../3-org/1-category/schema.js";
import { category, categoryMetrics } from "./schema.js";

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
