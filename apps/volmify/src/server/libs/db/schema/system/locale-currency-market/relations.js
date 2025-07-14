import { relations } from "drizzle-orm";
import {
	orgCurrencySettings,
	orgMarket,
	orgMarketCountry,
	orgPricingZone,
	orgPricingZoneCountry,
} from "../../org/schema.js";
import { discount, giftCard } from "../../product/offers/schema.js";
import { productVariantPaymentPlan } from "../../product/payment/schema.js";
import { seoMetadata } from "../seo/schema.js";
import {
	country,
	currency,
	exchangeRate,
	marketTemplate,
	marketTemplateCountry,
	marketTemplateTranslation,
} from "./schema.js";

/**
 * @fileoverview 🔁 Currency & Market Relations — Global Commerce Integration
 *
 * @overview
 * Defines polymorphic and hub-spoke-style relations between core currency/market
 * entities and their integrations with org settings, pricing, internationalization,
 * financial reporting, and localization.
 */

export const currencyRelations = relations(currency, ({ many }) => ({
	countries: many(country),
	marketTemplates: many(marketTemplate),
	organizationMarkets: many(orgMarket),
	exchangeRatesBase: many(exchangeRate, {
		relationName: "base_currency_rates",
	}),
	exchangeRatesTarget: many(exchangeRate, {
		relationName: "target_currency_rates",
	}),
	organizationSettings: many(orgCurrencySettings),
	productVariantsPaymentPlans: many(productVariantPaymentPlan),
	discounts: many(discount),
	giftCards: many(giftCard),
	pricingZones: many(orgPricingZone),
}));

export const countryRelations = relations(country, ({ one, many }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	marketTemplateCountries: many(marketTemplateCountry),
	organizationMarketCountries: many(orgMarketCountry),
	pricingZoneCountries: many(orgPricingZoneCountry),
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

export const marketTemplateRelations = relations(
	marketTemplate,
	({ one, many }) => ({
		currency: one(currency, {
			fields: [marketTemplate.currencyCode],
			references: [currency.code],
		}),
		countries: many(marketTemplateCountry),
		translations: many(marketTemplateTranslation),
		organizationMarkets: many(orgMarket),
	}),
);

export const marketTemplateCountryRelations = relations(
	marketTemplateCountry,
	({ one }) => ({
		marketTemplate: one(marketTemplate, {
			fields: [marketTemplateCountry.marketTemplateId],
			references: [marketTemplate.id],
		}),
		country: one(country, {
			fields: [marketTemplateCountry.countryId],
			references: [country.id],
		}),
	}),
);

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
