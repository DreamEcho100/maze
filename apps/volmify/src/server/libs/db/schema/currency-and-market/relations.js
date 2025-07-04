import { relations } from "drizzle-orm";

import {
	organizationCurrencySettings,
	organizationMarket,
	organizationMarketCountry,
	pricingZone,
	pricingZoneCountry,
} from "../organization/schema.js";
import { discount, giftCard } from "../product/offers/schema.js";
import { productPrice, productZonePrice } from "../product/schema.js";
import { seoMetadata } from "../seo/schema.js";
import {
	country,
	currency,
	exchangeRate,
	marketTemplate,
	marketTemplateCountry,
	marketTemplateTranslation,
} from "./schema.js";

export const currencyRelations = relations(currency, ({ many }) => ({
	countries: many(country),
	marketTemplates: many(marketTemplate),
	organizationMarkets: many(organizationMarket),
	exchangeRatesBase: many(exchangeRate, {
		relationName: "base_currency_rates",
	}),
	exchangeRatesTarget: many(exchangeRate, {
		relationName: "target_currency_rates",
	}),
	organizationSettings: many(organizationCurrencySettings),
	productPrices: many(productPrice),
	productZonePrices: many(productZonePrice),
	discounts: many(discount),
	giftCards: many(giftCard),
	pricingZones: many(pricingZone),
}));

export const countryRelations = relations(country, ({ one, many }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	marketTemplateCountries: many(marketTemplateCountry),
	organizationMarketCountries: many(organizationMarketCountry),
	pricingZoneCountries: many(pricingZoneCountry),
}));

export const exchangeRateRelations = relations(exchangeRate, ({ one }) => ({
	baseCurrency: one(currency, {
		fields: [exchangeRate.baseCurrency],
		references: [currency.code],
		relationName: "base_currency_rates",
	}),
	targetCurrency: one(currency, {
		fields: [exchangeRate.targetCurrency],
		references: [currency.code],
		relationName: "target_currency_rates",
	}),
}));

// Market Template Relations
export const marketTemplateRelations = relations(marketTemplate, ({ one, many }) => ({
	currency: one(currency, {
		fields: [marketTemplate.currencyCode],
		references: [currency.code],
	}),
	countries: many(marketTemplateCountry),
	translations: many(marketTemplateTranslation),
	organizationMarkets: many(organizationMarket), // Organizations using this template
}));

export const marketTemplateCountryRelations = relations(marketTemplateCountry, ({ one }) => ({
	marketTemplate: one(marketTemplate, {
		fields: [marketTemplateCountry.marketTemplateId],
		references: [marketTemplate.id],
	}),
	country: one(country, {
		fields: [marketTemplateCountry.countryId],
		references: [country.id],
	}),
}));

export const marketTemplateTranslationRelations = relations(
	marketTemplateTranslation,
	({ one }) => ({
		marketTemplate: one(marketTemplate, {
			fields: [marketTemplateTranslation.marketTemplateId],
			references: [marketTemplate.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [marketTemplateTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);
