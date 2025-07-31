import { relations } from "drizzle-orm";
import { seoMetadata } from "#db/schema/general/seo/schema.js";
import { orgBrand, orgBrandTranslation } from "../brand/schema.js";
import { orgLocale } from "../locale-region/schema.js";
import { orgProductBrandAttribution } from "../product/schema.js";
// import { orgLesson, skill } from "../product/by-type/course/schema.js";
import { org } from "../schema.js";

/**
 * @brandContext Org Brand
 * @contentAttribution Enables multiple brands per org for product identity
 */
export const orgBrandRelations = relations(orgBrand, ({ one, many }) => ({
	org: one(org, {
		fields: [orgBrand.orgId],
		references: [org.id],
	}),
	productAttributions: many(orgProductBrandAttribution),
	translations: many(orgBrandTranslation),
}));

/**
 * @localizationBridge Brand Translation
 * @seoIntegration SEO metadata per brand locale
 */
export const orgBrandTranslationRelations = relations(orgBrandTranslation, ({ one }) => ({
	brand: one(orgBrand, {
		fields: [orgBrandTranslation.brandId],
		references: [orgBrand.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgBrandTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(orgLocale, {
		fields: [orgBrandTranslation.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
