import { relations } from "drizzle-orm";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { userProfileOrgMembership } from "../../4-user/profile/schema.js";
import { contactInfo, orgEmployee } from "../../schema.js";
import { userCategory } from "../0-category/schema.js";
import { userLocale } from "../0-locale/00-schema.js";
import { user } from "../00-schema.js";
import {
	userJobProfile,
	userJobProfileMetrics,
	userJobProfileSkill,
	userProfile,
	userProfileContactInfo,
	userProfileI18n,
} from "./schema.js";

// ### user -> profile
export const userProfileRelations = relations(userProfile, ({ many, one }) => ({
	user: one(user, {
		fields: [userProfile.userId],
		references: [user.id],
	}),
	translations: many(userProfileI18n),
	contacts: many(userProfileContactInfo),
	orgsMembership: many(userProfileOrgMembership),
	jobProfile: one(userJobProfile, {
		fields: [userProfile.id],
		references: [userJobProfile.userProfileId],
	}),
}));
export const userProfileI18nRelations = relations(userProfileI18n, ({ one }) => ({
	/**
	 * @localeKey Unique locale identifier for translations
	 * @immutable Once set, should not change to maintain translation integrity
	 */
	locale: one(userLocale, {
		fields: [userProfileI18n.localeKey],
		references: [userLocale.localeKey],
	}),

	/**
	 * @seoMetadata SEO metadata for translated job profiles
	 */
	seoMetadata: one(seoMetadata, {
		fields: [userProfileI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),

	/**
	 * @jobProfileLink Links translation to the main job profile
	 */
	profile: one(userProfile, {
		fields: [userProfileI18n.userProfileId],
		references: [userProfile.id],
	}),
}));
export const userProfileContactInfoRelations = relations(userProfileContactInfo, ({ one }) => ({
	userProfile: one(userProfile, {
		fields: [userProfileContactInfo.userProfileId],
		references: [userProfile.id],
	}),
	contactInfo: one(contactInfo, {
		fields: [userProfileContactInfo.contactInfoId],
		references: [contactInfo.id],
	}),
}));

// #### user -> profile -> job

/**
 * Job Profile Relations
 *
 * @jobIdentity Global job identity across orgs
 * Enables jobs to maintain consistent professional identity while
 * participating in multiple org contexts.
 */
export const userJobProfileRelations = relations(userJobProfile, ({ one, many }) => ({
	userProfile: one(userProfile, {
		fields: [userJobProfile.userProfileId],
		references: [userProfile.id],
	}),

	// translations: many(userJobProfileI18n),
	skills: many(userJobProfileSkill),
	employees: many(orgEmployee),
	// metrics: one(userJobProfileMetrics),

	metrics: one(userJobProfileMetrics, {
		fields: [userJobProfile.userProfileId],
		references: [userJobProfileMetrics.jobProfileId],
	}),

	// 	jobProfileMetrics: one(userJobProfileMetrics, {
	// 	fields: [userProfile.id],
	// 	references: [userJobProfileMetrics.jobProfileId],
	// }),
}));
// export const userJobProfileTranslationRelations = relations(userJobProfileI18n, ({ one }) => ({
// 	/**
// 	 * @localeKey Unique locale identifier for translations
// 	 * @immutable Once set, should not change to maintain translation integrity
// 	 */
// 	locale: one(locale, {
// 		fields: [userJobProfileI18n.localeKey],
// 		references: [locale.key],
// 	}),

// 	/**
// 	 * @seoMetadata SEO metadata for translated job profiles
// 	 */
// 	seoMetadata: one(seoMetadata, {
// 		fields: [userJobProfileI18n.seoMetadataId],
// 		references: [seoMetadata.id],
// 	}),

// 	/**
// 	 * @jobProfileLink Links translation to the main job profile
// 	 */
// 	jobProfile: one(userJobProfile, {
// 		fields: [userJobProfileI18n.jobProfileId],
// 		references: [userJobProfile.userProfileId],
// 	}),
// }));

export const userJobProfileSkillRelations = relations(userJobProfileSkill, ({ one }) => ({
	// TODO: Define skill relation
	// /**
	//  * @skillId Unique identifier for the skill
	//  * @immutable Once set, should not change to maintain skill integrity
	//  */
	// skill: one(userJobProfile, {
	// 	fields: [userJobProfileSkill.skillId],
	// 	references: [userJobProfile.id],
	// }),
	skill: one(userCategory, {
		fields: [userJobProfileSkill.skillId],
		references: [userCategory.id],
	}),
	/**
	 * @jobProfileLink Links skill to the main job profile
	 */
	jobProfile: one(userJobProfile, {
		fields: [userJobProfileSkill.jobProfileId],
		references: [userJobProfile.userProfileId],
	}),
}));

export const userJobProfileMetricsRelations = relations(userJobProfileMetrics, ({ one }) => ({
	/**
	 * @jobProfileLink Links metrics to the main job profile
	 */
	jobProfile: one(userJobProfile, {
		fields: [userJobProfileMetrics.jobProfileId],
		references: [userJobProfile.userProfileId],
	}),
}));
// ---- user -> profile -> job

// --- user -> profile
