import { relations } from "drizzle-orm";
import { orgRegion } from "../../org/locale-region/schema.js";
import {
	orgLessonI18n,
	orgProductCourseI18n,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLessonI18n,
	skillI18n,
} from "../../org/product/by-type/course/schema.js";
import {
	orgCouponI18n,
	orgDiscount,
	orgDiscountI18n,
	orgGiftCard,
	orgGiftCardI18n,
	orgPromotionI18n,
} from "../../org/product/offers/schema.js";
import {
	orgProductVariantPaymentPlan,
	// orgUsageBasedPaymentPlanI18n,
	orgProductVariantPaymentPlanI18n,
	orgProductVariantPaymentPlanOneTimeType,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionType,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "../../org/product/payment/schema.js";
import {
	orgProductI18n,
	orgProductVariantI18n,
} from "../../org/product/schema.js";
import {
	orgBrandTranslation,
	orgCurrencySettings,
	// orgMarket,
	// orgMarketCountry,
	// orgMarketTranslation,
	// orgPricingZone,
	// orgPricingZoneCountry,
} from "../../org/schema.js";
import { orgTaxRate } from "../../org/tax/schema.js";
import { userInstructorProfileTranslation } from "../../user/profile/instructor/schema.js";
import { seoAlternateUrl, seoMetadata } from "../seo/schema.js";
import {
	country,
	currency,
	exchangeRate,
	locale,
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
	orgsProductsVariantsPaymentPlansOneTimeType: many(
		orgProductVariantPaymentPlanOneTimeType,
	),
	orgsProductsVariantsPaymentPlansSubscriptionType: many(
		orgProductVariantPaymentPlanSubscriptionType,
	),
	orgDiscounts: many(orgDiscount),
	orgGiftCards: many(orgGiftCard),
}));

export const countryRelations = relations(country, ({ one, many }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	marketTemplateCountries: many(marketTemplateCountry),
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

export const marketTemplateRelations = relations(
	marketTemplate,
	({ one, many }) => ({
		currency: one(currency, {
			fields: [marketTemplate.currencyCode],
			references: [currency.code],
		}),
		countries: many(marketTemplateCountry),
		translations: many(marketTemplateTranslation),
		// orgMarkets: many(orgMarket),
	}),
);

export const marketTemplateCountryRelations = relations(
	marketTemplateCountry,
	({ one, many }) => ({
		marketTemplate: one(marketTemplate, {
			fields: [marketTemplateCountry.marketTemplateId],
			references: [marketTemplate.id],
		}),
		country: one(country, {
			fields: [marketTemplateCountry.countryId],
			references: [country.id],
		}),
		orgsRegions: many(orgRegion),
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
		locale: one(locale, {
			fields: [marketTemplateTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

export const localeRelations = relations(locale, ({ many }) => ({
	marketsTemplatesTranslations: many(marketTemplateTranslation),

	productsCoursesTranslations: many(orgProductCourseI18n),
	skillsTranslations: many(skillI18n),
	productsCoursesModulesTranslations: many(orgProductCourseModuleI18n),
	productsCoursesModulesSectionsTranslations: many(
		orgProductCourseModuleSectionI18n,
	),
	productsCoursesModulesSectionsLessonsTranslations: many(
		orgProductCourseModuleSectionLessonI18n,
	),
	lessonsTranslations: many(orgLessonI18n),
	orgsBrandsTranslations: many(orgBrandTranslation),
	// orgMarketsTranslations: many(orgMarketTranslation),
	productsTranslations: many(orgProductI18n),
	productsVariantsTranslations: many(orgProductVariantI18n),

	usersInstructorProfilesTranslations: many(userInstructorProfileTranslation),
	discountsTranslation: many(orgDiscountI18n),
	couponsTranslation: many(orgCouponI18n),
	giftCardsTranslation: many(orgGiftCardI18n),
	promotionsTranslation: many(orgPromotionI18n),
	productsVariantsPaymentPlansTranslations: many(
		orgProductVariantPaymentPlanI18n,
	),

	// The following is not shared with the SEO table
	// oneTimePaymentPlansTranslations: many(orgProductVariantPaymentPlanOneTimeTypeI18n),
	subscriptionPaymentPlansTranslations: many(
		orgProductVariantPaymentPlanSubscriptionTypeI18n,
	),
	// usageBasedPaymentPlansTranslations: many(orgUsageBasedPaymentPlanI18n),
	seoAlternateUrls: many(seoAlternateUrl),
}));
