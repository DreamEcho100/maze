import { relations } from "drizzle-orm";
import { skill } from "../../../general/skill/schema.js";
import { orgEmployee } from "../../../org/member/employee/schema.js";
import { userProfile } from "../schema.js";
import {
	userJobProfile,
	// userJobProfileI18n,
	userJobProfileMetrics,
	userJobProfileSkill,
} from "./schema.js";

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
	skill: one(skill, {
		fields: [userJobProfileSkill.skillId],
		references: [skill.id],
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
