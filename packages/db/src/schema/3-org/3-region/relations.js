import { relations } from "drizzle-orm";
import { currency } from "../../0-local/00-schema.js";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgTaxRateI18n } from "../3-tax/schema.js";
import { org } from "../00-schema.js";
import { orgRegion, orgRegionI18n } from "./schema.js";

// ## org -> region
export const orgRegionRelations = relations(orgRegion, ({ many, one }) => ({
	org: one(org, {
		fields: [orgRegion.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgRegion.currencyCode],
		references: [currency.code],
	}),

	//
	orgsTaxRates: many(orgTaxRateI18n),
	// TODO: countries
}));
export const orgRegionI18nRelations = relations(orgRegionI18n, ({ one }) => ({
	region: one(orgRegion, {
		fields: [orgRegionI18n.regionId],
		references: [orgRegion.id],
	}),
	orgLocale: one(orgLocale, {
		fields: [orgRegionI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgRegionI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
// -- org -> region
