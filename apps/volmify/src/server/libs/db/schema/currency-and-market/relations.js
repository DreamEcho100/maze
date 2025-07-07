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

/**
 * @fileoverview Currency and Market Relations - Global Commerce Integration
 *
 * @integrationPattern Hub-and-Spoke with Cross-Domain References
 * Currency and market data serves as foundational reference data that integrates
 * across organization, product, and financial domains to enable global commerce.
 *
 * @businessContext
 * These relations enable multi-currency pricing, international market expansion,
 * regulatory compliance, and localized user experiences across the platform.
 */

/**
 * Currency Relations (Financial Foundation)
 *
 * @integrationRole Central reference for all monetary operations
 * Currency serves as the foundation for pricing, billing, accounting, and
 * financial reporting throughout the platform ecosystem.
 *
 * @crossDomainIntegration
 * Referenced by organization settings, product pricing, promotional systems,
 * and billing modules to ensure consistent currency handling.
 */
export const currencyRelations = relations(currency, ({ many }) => ({
	/**
	 * @geographicContext Countries using this currency as their primary currency
	 */
	countries: many(country),

	/**
	 * @templateConfiguration Market templates configured with this currency
	 */
	marketTemplates: many(marketTemplate),

	/**
	 * @organizationIntegration Organization-specific currency preferences
	 */
	organizationMarkets: many(organizationMarket),

	/**
	 * @financialSystem Exchange rate relationships for currency conversion
	 * @performanceCritical High-frequency access during pricing calculations
	 */
	exchangeRatesBase: many(exchangeRate, {
		relationName: "base_currency_rates",
	}),
	exchangeRatesTarget: many(exchangeRate, {
		relationName: "target_currency_rates",
	}),

	organizationSettings: many(organizationCurrencySettings),

	/**
	 * @pricingSystem Product pricing in this currency
	 * @businessCritical Core pricing system integration
	 */
	productPrices: many(productPrice),
	productZonePrices: many(productZonePrice),

	/**
	 * @promotionalSystem Discounts and gift cards with currency context
	 */
	discounts: many(discount),
	giftCards: many(giftCard),

	pricingZones: many(pricingZone),
}));

/**
 * Country Relations (Geographic and Regulatory Context)
 *
 * @integrationRole Geographic foundation for localization and compliance
 * Countries provide regulatory, tax, and localization context for
 * international business operations and user experience customization.
 *
 * @localizationFoundation
 * Enables location-based content delivery, pricing strategies, and
 * regulatory compliance across different jurisdictions.
 */
export const countryRelations = relations(country, ({ one, many }) => ({
	/**
	 * @monetaryContext Primary currency for this country's economy
	 * @taxationBase Used for default pricing and tax calculations
	 */
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),

	/**
	 * @templateSystem Template-based market configurations including this country
	 */
	marketTemplateCountries: many(marketTemplateCountry),

	/**
	 * @organizationMarkets Organization-specific market configurations
	 */
	organizationMarketCountries: many(organizationMarketCountry),

	/**
	 * @pricingStrategy Geographic pricing zone assignments
	 */
	pricingZoneCountries: many(pricingZoneCountry),
}));

/**
 * Exchange Rate Relations (Financial Conversion System)
 *
 * @integrationRole Currency conversion foundation for multi-currency operations
 * Enables accurate financial calculations, reporting, and pricing across
 * different currencies with historical accuracy and audit compliance.
 */
export const exchangeRateRelations = relations(exchangeRate, ({ one }) => ({
	/**
	 * @conversionSystem Base and target currencies for rate calculations
	 * @financialAccuracy Enables precise multi-currency financial operations
	 */
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

/**
 * Market Template Relations (Configuration Blueprint System)
 *
 * @integrationRole Template foundation for organization market setup
 * Market templates provide pre-configured market settings that organizations
 * can adopt for rapid international expansion with proven configurations.
 *
 * @templateInheritance
 * Organizations reference templates to inherit currency, locale, and
 * geographic configurations while maintaining customization flexibility.
 */
export const marketTemplateRelations = relations(marketTemplate, ({ one, many }) => ({
	/**
	 * @monetaryFoundation Primary currency for template-based pricing
	 */
	currency: one(currency, {
		fields: [marketTemplate.currencyCode],
		references: [currency.code],
	}),

	/**
	 * @geographicCoverage Countries included in this market template
	 */
	countries: many(marketTemplateCountry),

	/**
	 * @localizationSupport Multi-language template content
	 */
	translations: many(marketTemplateTranslation),

	/**
	 * @organizationAdoption Organizations using this template configuration
	 * @businessValue Enables rapid international expansion for organizations
	 */
	organizationMarkets: many(organizationMarket), // Organizations using this template
}));

/**
 * Market Template-Country Relations
 *
 * @integrationRole Geographic scope definition for market templates
 * Defines which countries are covered by each market template configuration.
 */
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

/**
 * Market Template Translation Relations
 *
 * @integrationRole Localized template content for international markets
 * Enables market templates to have localized names and descriptions
 * while maintaining consistent underlying market configurations.
 */
export const marketTemplateTranslationRelations = relations(
	marketTemplateTranslation,
	({ one }) => ({
		marketTemplate: one(marketTemplate, {
			fields: [marketTemplateTranslation.marketTemplateId],
			references: [marketTemplate.id],
		}),
		/**
		 * @seoIntegration Optional SEO optimization for market-specific content
		 * @marketingContext Enables region-specific search optimization
		 */
		seoMetadata: one(seoMetadata, {
			fields: [marketTemplateTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);
