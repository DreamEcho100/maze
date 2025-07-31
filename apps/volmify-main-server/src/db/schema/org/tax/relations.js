import { relations } from "drizzle-orm";
import { currency } from "../../general/locale-and-currency/schema";
import { seoMetadata } from "../../general/seo/schema";
import { orgLocale, orgRegion } from "../locale-region/schema";
import { orgEmployee } from "../member/employee/schema";
import { orgProductVariantPaymentPlan } from "../product/payment/schema";
import { orgProductVariant } from "../product/schema";
import {
	orgTaxCategory,
	orgTaxCategoryI18n,
	orgTaxRate,
	orgTaxRateI18n,
	orgTaxRateSnapshot,
	orgTaxRateTaxCategory,
} from "./schema";

export const orgTaxCategoryRelations = relations(orgTaxCategory, ({ many }) => ({
	translations: many(orgTaxCategoryI18n),
	productsVariants: many(orgProductVariant),
	productsVariantsPaymentPlans: many(orgProductVariantPaymentPlan),
}));
export const orgTaxCategoryI18nRelations = relations(orgTaxCategoryI18n, ({ one }) => ({
	category: one(orgTaxCategory, {
		fields: [orgTaxCategoryI18n.categoryId],
		references: [orgTaxCategory.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgTaxCategoryI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

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

export const orgTaxRateTaxCategoryRelations = relations(orgTaxRateTaxCategory, ({ one }) => ({
	taxRate: one(orgTaxRate, {
		fields: [orgTaxRateTaxCategory.rateId],
		references: [orgTaxRate.id],
	}),
	category: one(orgTaxCategory, {
		fields: [orgTaxRateTaxCategory.categoryId],
		references: [orgTaxCategory.id],
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
