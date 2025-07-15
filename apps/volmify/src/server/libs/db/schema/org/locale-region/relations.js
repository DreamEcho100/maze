import { relations } from "drizzle-orm";
import { currency } from "../../system/locale-currency-market/schema";
import { orgFunnelI18n } from "../funnel/schema";
import { org } from "../schema";
import { orgTaxRateI18n } from "../tax/schema";
import { orgLocale, orgRegion, orgTaxCategoryI18n } from "./schema";

export const orgLocaleRelations = relations(orgLocale, ({ many, one }) => ({
	org: one(org, {
		fields: [orgLocale.orgId],
		references: [org.id],
	}),
	orgLocale: one(orgLocale, {
		fields: [orgLocale.localeKey],
		references: [orgLocale.localeKey],
	}),

	//
	orgsTaxCategoriesI18n: many(orgTaxCategoryI18n),
	orgsFunnelsI18n: many(orgFunnelI18n),
	orgsTaxRatesI18n: many(orgTaxRateI18n),
}));

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
}));
export const orgTaxCategoryI18nRelations = relations(
	orgTaxCategoryI18n,
	({ one }) => ({
		region: one(orgRegion, {
			fields: [orgTaxCategoryI18n.regionId],
			references: [orgRegion.id],
		}),
		orgLocale: one(orgLocale, {
			fields: [orgTaxCategoryI18n.orgLocaleKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
