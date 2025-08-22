// ## org -> brand

import { relations } from "drizzle-orm";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgCategory } from "../1-category/schema.js";
import { orgProductBrandAttribution } from "../4-product/1-approval-revenue-and-attribution/schema.js";
import { org } from "../00-schema.js";
import { orgBrand, orgBrandTranslation } from "./schema.js";

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
	category: one(orgCategory, {
		fields: [orgBrand.categoryId],
		references: [orgCategory.id],
	}),
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
// -- org -> brand
