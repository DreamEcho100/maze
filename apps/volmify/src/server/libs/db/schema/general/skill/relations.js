import { relations } from "drizzle-orm";
import { orgProductCourseSkill } from "../../org/product/by-type/course/schema";
import { org } from "../../org/schema";
import { locale } from "../locale-currency-market/schema";
import { seoMetadata } from "../seo/schema";
import { skill, skillI18n } from "./schema";

export const skillRelations = relations(skill, ({ many, one }) => ({
	parentSkill: one(skill, {
		fields: [skill.parentSkillId],
		references: [skill.id],
		relationName: "skillHierarchy",
	}),
	childSkills: many(skill, {
		relationName: "skillHierarchy",
	}),
	createdByOrganization: one(org, {
		fields: [skill.createdByOrganizationId],
		references: [org.id],
	}),
	productsCourseType: many(orgProductCourseSkill),
	translations: many(skillI18n),
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
