// ## user -> category

import { relations } from "drizzle-orm";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { category } from "../../schema.js";
import { userLocale } from "../0-locale/00-schema.js";
import { userJobProfileSkill } from "../1-profile/schema.js";
import { user } from "../00-schema.js";
import { userCategory, userCategoryI18n } from "./schema.js";

// =====================================
//  ORG CATEGORY RELATIONS
// =====================================

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

	usersJobsProfilesSkills: many(userJobProfileSkill),
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
// -- user -> category
