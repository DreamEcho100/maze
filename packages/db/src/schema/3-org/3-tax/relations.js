import { relations } from "drizzle-orm";
import { currency, orgEmployee, seoMetadata } from "../../schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgCategory } from "../1-category/schema.js";
import { orgRegion } from "../3-region/schema.js";
import { orgTaxRate, orgTaxRateCategory, orgTaxRateI18n, orgTaxRateSnapshot } from "./schema.js";

// ## org -> tax
export const orgTaxRateRelations = relations(orgTaxRate, ({ many, one }) => ({
	region: one(orgRegion, {
		fields: [orgTaxRate.regionId],
		references: [orgRegion.id],
	}),
	currency: one(currency, {
		fields: [orgTaxRate.currencyCode],
		references: [currency.code],
	}),
	translations: many(orgTaxRateI18n),
}));
export const orgTaxRateI18nRelations = relations(orgTaxRateI18n, ({ one }) => ({
	taxRate: one(orgTaxRate, {
		fields: [orgTaxRateI18n.rateId],
		references: [orgTaxRate.id],
	}),
	orgLocale: one(orgLocale, {
		fields: [orgTaxRateI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgTaxRateI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

export const orgTaxRateTaxCategoryRelations = relations(orgTaxRateCategory, ({ one }) => ({
	taxRate: one(orgTaxRate, {
		fields: [orgTaxRateCategory.rateId],
		references: [orgTaxRate.id],
	}),
	category: one(orgCategory, {
		fields: [orgTaxRateCategory.categoryId],
		references: [orgCategory.id],
	}),
}));

export const orgTaxRateSnapshotRelations = relations(orgTaxRateSnapshot, ({ one }) => ({
	taxRate: one(orgTaxRate, {
		fields: [orgTaxRateSnapshot.rateId],
		references: [orgTaxRate.id],
	}),
	createdByEmployee: one(orgEmployee, {
		fields: [orgTaxRateSnapshot.byEmployeeId], // Updated field name
		references: [orgEmployee.id],
	}),
}));
// -- org -> tax
