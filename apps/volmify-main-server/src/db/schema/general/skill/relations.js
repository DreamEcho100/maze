import { relations } from "drizzle-orm";
import { orgProductCourseSkill } from "../../org/product/by-type/course/schema";
import { org } from "../../org/schema";
import { userJobProfileSkill } from "../../user/profile/job/schema";
import { locale } from "../locale-and-currency/schema";
import { seoMetadata } from "../seo/schema";
import { skill, skillI18n } from "./schema";

export const skillRelations = relations(skill, ({ many, one }) => ({
	parentSkill: one(skill, {
		fields: [skill.parentSkillId],
		references: [skill.id],
		relationName: "parent_skill_hierarchy",
	}),
	childSkills: many(skill, {
		relationName: "childS_sills_hierarchy",
	}),
	appliedByOrg: one(org, {
		fields: [skill.appliedByOrgId],
		references: [org.id],
		relationName: "skill_applied_by_org",
	}),

	createdByOrg: one(org, {
		fields: [skill.createdByOrgId],
		references: [org.id],
		relationName: "skill_created_by_org",
	}),
	productsCourseType: many(orgProductCourseSkill),
	translations: many(skillI18n),
	jobProfileSkills: many(userJobProfileSkill),
}));
export const skillI18nRelations = relations(skillI18n, ({ many, one }) => ({
	skill: one(skill, {
		fields: [skillI18n.skillId],
		references: [skill.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [skillI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [skillI18n.localeKey],
		references: [locale.key],
	}),
}));
