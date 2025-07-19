import { relations } from "drizzle-orm";
import { skill, skillI18n } from "./schema";

export const skillRelations = relations(skill, ({ many, one }) => ({
	// 	/**
	// 	 * @skillHierarchy Parent skill for nested skill org
	// 	 * @marketplaceNavigation Enables hierarchical skill browsing and filtering
	// 	 */
	// 	parentSkill: one(skill, {
	// 		fields: [skill.parentSkillId],
	// 		references: [skill.id],
	// 		relationName: "skillHierarchy",
	// 	}),
	// 	/**
	// 	 * @skillHierarchy Child skills for comprehensive skill taxonomy
	// 	 * @platformIntelligence Enables skill relationship tracking and recommendations
	// 	 */
	// 	childSkills: many(skill, {
	// 		relationName: "skillHierarchy",
	// 	}),
	// 	/**
	// 	 * @skillCreation Org that created this skill
	// 	 * @qualityControl Skill origin tracking for taxonomy management
	// 	 */
	// 	createdByOrganization: one(org, {
	// 		fields: [skill.createdByOrganizationId],
	// 		references: [org.id],
	// 	}),
	// 	/**
	// 	 * @courseMapping Courses that teach or require this skill
	// 	 * @learningPathways Enables course sequencing based on skill prerequisites
	// 	 */
	// 	courses: many(orgProductCourseSkill),
	// 	/**
	// 	 * @internationalization Multi-language skill names and descriptions
	// 	 * @globalPlatform Localized skill taxonomy for international markets
	// 	 */
	// 	translations: many(skillI18n),
}));
export const skillI18nRelations = relations(skillI18n, ({ many, one }) => ({
	// 	/**
	// 	 * @localizationTarget Skill being translated for international taxonomy
	// 	 * @businessContext Enables localized skill discovery and course matching
	// 	 */
	// 	skill: one(skill, {
	// 		fields: [skillI18n.skillId],
	// 		references: [skill.id],
	// 	}),
	// 	seoMetadata: one(seoMetadata, {
	// 		fields: [skillI18n.seoMetadataId],
	// 		references: [seoMetadata.id],
	// 	}),
	// 	locale: one(orgLocale, {
	// 		fields: [skillI18n.localeKey],
	// 		references: [orgLocale.localeKey],
	// 	}),
}));
