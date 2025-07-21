import { relations } from "drizzle-orm";
import { orgRegion } from "../../org/locale-region/schema.js";
import { orgDiscount, orgGiftCard } from "../../org/product/offers/schema.js";
import {
	orgProductVariantPaymentPlan,
	orgProductVariantPaymentPlanOneTimeType,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionType,
} from "../../org/product/payment/schema.js";
import {
	orgCurrencySettings,
	// orgMarket,
	// orgMarketCountry,
	// orgMarketTranslation,
	// orgPricingZone,
	// orgPricingZoneCountry,
} from "../../org/schema.js";
import { orgTaxRate } from "../../org/tax/schema.js";
import { userInstructorProfileI18n } from "../../user/profile/instructor/schema.js";
import { seoAlternateUrl } from "../seo/schema.js";
import { skillI18n } from "../skill/schema.js";
import { country, currency, exchangeRate, locale } from "./schema.js";

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

export const countryRelations = relations(country, ({ one, many }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	// orgMarketCountries: many(orgMarketCountry),
	// pricingZoneCountries: many(orgPricingZoneCountry),
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

export const localeRelations = relations(locale, ({ many }) => ({
	// marketsTemplatesTranslations: many(marketTemplateTranslation),

	// productsCoursesTranslations: many(orgProductCourseI18n),
	// skillsTranslations: many(skillI18n),
	// productsCoursesModulesTranslations: many(orgProductCourseModuleI18n),
	// productsCoursesModulesSectionsTranslations: many(
	// 	orgProductCourseModuleSectionI18n,
	// ),
	// productsCoursesModulesSectionsLessonsTranslations: many(
	// 	orgProductCourseModuleSectionLessonI18n,
	// ),
	// lessonsTranslations: many(orgLessonI18n),
	// orgsBrandsTranslations: many(orgBrandTranslation),
	// // orgMarketsTranslations: many(orgMarketTranslation),
	// productsTranslations: many(orgProductI18n),
	// productsVariantsTranslations: many(orgProductVariantI18n),

	// usersInstructorProfilesTranslations: many(userInstructorProfileTranslation),
	// discountsTranslation: many(orgDiscountI18n),
	// couponsTranslation: many(orgCouponI18n),
	// giftCardsTranslation: many(orgGiftCardI18n),
	// promotionsTranslation: many(orgPromotionI18n),
	// productsVariantsPaymentPlansTranslations: many(
	// 	orgProductVariantPaymentPlanI18n,
	// ),

	// // The following is not shared with the SEO table
	// // oneTimePaymentPlansTranslations: many(orgProductVariantPaymentPlanOneTimeTypeI18n),
	// subscriptionPaymentPlansTranslations: many(
	// 	orgProductVariantPaymentPlanSubscriptionTypeI18n,
	// ),
	// usageBasedPaymentPlansTranslations: many(orgUsageBasedPaymentPlanI18n),
	seoAlternateUrls: many(seoAlternateUrl),
	skillsI18n: many(skillI18n),
	usersInstructorsProfilesI18n: many(userInstructorProfileI18n),
}));
