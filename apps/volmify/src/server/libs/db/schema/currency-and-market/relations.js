import { relations } from "drizzle-orm";

import {
	organization,
	organizationCurrencySettings,
	organizationMarket,
	pricingZone,
	pricingZoneCountry,
} from "../organization/schema.js";
import { discount, giftCard } from "../product/offers/schema.js";
import { productPrice, productZonePrice } from "../product/schema.js";
import {
	country,
	currency,
	exchangeRate,
	market,
	marketCountry,
	marketTranslation,
} from "./schema.js";

export const currencyRelations = relations(currency, ({ many }) => ({
	countries: many(country),
	markets: many(market),
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

export const marketRelations = relations(market, ({ one, many }) => ({
	organization: one(organization, {
		fields: [market.organizationId],
		references: [organization.id],
	}),
	currency: one(currency, {
		fields: [market.currencyCode],
		references: [currency.code],
	}),
	marketCountries: many(marketCountry),
	translations: many(marketTranslation),
	organizationMarkets: many(organizationMarket),
	productPrices: many(productPrice),
}));

export const marketCountryRelations = relations(marketCountry, ({ one }) => ({
	market: one(market, {
		fields: [marketCountry.marketId],
		references: [market.id],
	}),
	country: one(country, {
		fields: [marketCountry.countryId],
		references: [country.id],
	}),
}));

export const marketTranslationRelations = relations(marketTranslation, ({ one }) => ({
	market: one(market, {
		fields: [marketTranslation.marketId],
		references: [market.id],
	}),
	organization: one(organization, {
		fields: [marketTranslation.organizationId],
		references: [organization.id],
	}),
}));

export const countryRelations = relations(country, ({ one, many }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	marketCountries: many(marketCountry),
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
