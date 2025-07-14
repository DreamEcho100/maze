import { relations } from "drizzle-orm";
import {
	lessonTranslation,
	productCourseModuleSectionLessonTranslation,
	productCourseModuleSectionTranslation,
	productCourseModuleTranslation,
	productCourseTranslation,
	skillTranslation,
} from "../../org/product/by-type/course/schema.js";
import {
	couponTranslation,
	discount,
	discountTranslation,
	giftCard,
	giftCardTranslation,
	promotionTranslation,
} from "../../org/product/offers/schema.js";
import {
	oneTimePaymentPlanTranslation,
	productVariantPaymentPlan,
	productVariantPaymentPlanTranslation,
	subscriptionPaymentPlanTranslation,
	usageBasedPaymentPlanTranslation,
} from "../../org/product/payment/schema.js";
import { productTranslation, productVariantTranslation } from "../../org/product/schema.js";
import {
	orgBrandTranslation,
	orgCurrencySettings,
	orgMarket,
	orgMarketCountry,
	orgMarketTranslation,
	orgPricingZone,
	orgPricingZoneCountry,
} from "../../org/schema.js";
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

export const marketTemplateRelations = relations(marketTemplate, ({ one, many }) => ({
	currency: one(currency, {
		fields: [marketTemplate.currencyCode],
		references: [currency.code],
	}),
	countries: many(marketTemplateCountry),
	translations: many(marketTemplateTranslation),
	organizationMarkets: many(orgMarket),
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
		locale: one(locale, {
			fields: [marketTemplateTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

export const _localeRelations = relations(locale, ({ many }) => ({
	marketsTemplatesTranslations: many(marketTemplateTranslation),

	productsCoursesTranslations: many(productCourseTranslation),
	skillsTranslations: many(skillTranslation),
	productsCoursesModulesTranslations: many(productCourseModuleTranslation),
	productsCoursesModulesSectionsTranslations: many(productCourseModuleSectionTranslation),
	productsCoursesModulesSectionsLessonsTranslations: many(
		productCourseModuleSectionLessonTranslation,
	),
	lessonsTranslations: many(lessonTranslation),
	orgsBrandsTranslations: many(orgBrandTranslation),
	orgMarketsTranslations: many(orgMarketTranslation),
	productsTranslations: many(productTranslation),
	productsVariantsTranslations: many(productVariantTranslation),

	usersInstructorProfilesTranslations: many(userInstructorProfileTranslation),
	discountsTranslation: many(discountTranslation),
	couponsTranslation: many(couponTranslation),
	giftCardsTranslation: many(giftCardTranslation),
	promotionsTranslation: many(promotionTranslation),
	productsVariantsPaymentPlansTranslations: many(productVariantPaymentPlanTranslation),

	// The following is not shared with the SEO table
	oneTimePaymentPlansTranslations: many(oneTimePaymentPlanTranslation),
	subscriptionPaymentPlansTranslations: many(subscriptionPaymentPlanTranslation),
	usageBasedPaymentPlansTranslations: many(usageBasedPaymentPlanTranslation),
	seoAlternateUrls: many(seoAlternateUrl),
}));
