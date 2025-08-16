import { relations } from "drizzle-orm";
import { orgCategory } from "#schema/general/category/schema.js";
import { currency } from "../../general/locale-and-currency/schema.js";
import { seoMetadata } from "../../general/seo/schema.js";
import { orgLocale, orgRegion } from "../locale-region/schema.js";
import { orgEmployee } from "../member/employee/schema.js";
import {
	orgTaxRate,
	orgTaxRateCategory,
	orgTaxRateI18n,
	orgTaxRateSnapshot,
} from "./schema.js";

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

export const orgTaxRateTaxCategoryRelations = relations(
	orgTaxRateCategory,
	({ one }) => ({
		taxRate: one(orgTaxRate, {
			fields: [orgTaxRateCategory.rateId],
			references: [orgTaxRate.id],
		}),
		category: one(orgCategory, {
			fields: [orgTaxRateCategory.categoryId],
			references: [orgCategory.id],
		}),
	}),
);

export const orgTaxRateSnapshotRelations = relations(
	orgTaxRateSnapshot,
	({ one }) => ({
		taxRate: one(orgTaxRate, {
			fields: [orgTaxRateSnapshot.rateId],
			references: [orgTaxRate.id],
		}),
		createdByEmployee: one(orgEmployee, {
			fields: [orgTaxRateSnapshot.byEmployeeId], // Updated field name
			references: [orgEmployee.id],
		}),
	}),
);
