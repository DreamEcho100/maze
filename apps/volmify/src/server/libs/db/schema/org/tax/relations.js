import { relations } from "drizzle-orm";
import { currency } from "../../system/locale-currency-market/schema";
import { orgLocale, orgRegion } from "../locale-region/schema";
import {
	orgTaxCategory,
	orgTaxCategoryI18n,
	orgTaxRate,
	orgTaxRateI18n,
	orgTaxRateTaxCategory,
} from "./schema";

export const orgTaxCategoryRelations = relations(
	orgTaxCategory,
	({ many }) => ({
		translations: many(orgTaxCategoryI18n),
	}),
);
export const orgTaxCategoryI18nRelations = relations(
	orgTaxCategoryI18n,
	({ one }) => ({
		category: one(orgTaxCategory, {
			fields: [orgTaxCategoryI18n.categoryId],
			references: [orgTaxCategory.id],
		}),
	}),
);

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
		fields: [orgTaxRateI18n.orgLocaleKey],
		references: [orgLocale.localeKey],
	}),
}));

export const orgTaxRateTaxCategoryRelations = relations(
	orgTaxRateTaxCategory,
	({ one }) => ({
		taxRate: one(orgTaxRate, {
			fields: [orgTaxRateTaxCategory.rateId],
			references: [orgTaxRate.id],
		}),
		category: one(orgTaxCategory, {
			fields: [orgTaxRateTaxCategory.categoryId],
			references: [orgTaxCategory.id],
		}),
	}),
);
