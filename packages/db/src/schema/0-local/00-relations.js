// ## locale-and-currency

import { relations } from "drizzle-orm";
import { seoMetadataAlternateUrl } from "../0-seo/other/schema.js";
import { userLocale } from "../2-user/0-locale/00-schema.js";
import { userProfileI18n } from "../2-user/1-profile/schema.js";
import { orgRegion } from "../3-org/3-region/schema.js";
import { orgCurrencySettings } from "../3-org/3-settings/schema.js";
import { orgTaxRate } from "../3-org/3-tax/schema.js";
import {
	orgProductVariantPaymentPlan,
	orgProductVariantPaymentPlanOneTimeType,
	orgProductVariantPaymentPlanSubscriptionType,
} from "../3-org/4-product/payment/schema.js";
import { orgDiscount, orgGiftCard } from "../3-org/5-offers/schema.js";
import { account } from "../4-account/schema.js";
import { country } from "./1-country/schema.js";
import { exchangeRate } from "./1-exchange-rate/00-schema.js";
import { currency, locale } from "./00-schema.js";

/**
 * @fileoverview 🔁 Currency & Market Relations — Global Commerce Integration
 *
 * @overview
 * Defines polymorphic and hub-spoke-style relations between core currency/market
 * entities and their integrations with org settings, pricing, internationalization,
 * financial reporting, and localization.
 */

export const currencyRelations = relations(currency, ({ many }) => ({
	accounts: many(account),
	countries: many(country),
	// orgMarkets: many(orgMarket),
	exchangeRatesBase: many(exchangeRate, {
		relationName: "base_currency_rates",
	}),
	exchangeRatesTarget: many(exchangeRate, {
		relationName: "target_currency_rates",
	}),
	// pricingZones: many(orgPricingZone),

	//

	orgsTaxRates: many(orgTaxRate),
	orgsRegions: many(orgRegion),
	orgsCurrenciesSettings: many(orgCurrencySettings),
	orgsProductsVariantsPaymentPlans: many(orgProductVariantPaymentPlan),
	orgsProductsVariantsPaymentPlansOneTimeType: many(orgProductVariantPaymentPlanOneTimeType),
	orgsProductsVariantsPaymentPlansSubscriptionType: many(
		orgProductVariantPaymentPlanSubscriptionType,
	),
	orgsDiscounts: many(orgDiscount),
	orgsGiftCards: many(orgGiftCard),
}));

export const localeRelations = relations(locale, ({ many }) => ({
	seoAlternateUrls: many(seoMetadataAlternateUrl),
	usersProfilesI18n: many(userProfileI18n),
	usersLocales: many(userLocale),
	// usersJobProfilesI18n: many(userJobProfileI18n),
}));
// -- locale-and-currency
