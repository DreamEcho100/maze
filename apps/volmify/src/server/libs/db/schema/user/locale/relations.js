import { relations } from "drizzle-orm";
import { currency } from "../../general/locale-currency-market/schema";
import { seoMetadata } from "../../general/seo/schema";
import { orgFunnelI18n } from "../funnel/schema";
import { orgLessonI18n } from "../lesson/schema";
import { orgDepartmentI18n } from "../member/department/schema";
import { orgTeamI18n } from "../member/team/schema";
import {
	orgProductCourseI18n,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLessonI18n,
} from "../product/by-type/course/schema";
import {
	orgCouponI18n,
	orgDiscountI18n,
	orgGiftCardI18n,
	orgPromotionI18n,
} from "../product/offers/schema";
import {
	orgProductVariantPaymentPlanI18n,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "../product/payment/schema";
import { org } from "../schema";
import { orgTaxRateI18n } from "../tax/schema";
import { orgLocale, orgRegion, orgRegionI18n } from "./schema";

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
	orgsTaxCategoriesI18n: many(orgRegionI18n),
	orgsFunnelsI18n: many(orgFunnelI18n),
	orgsTaxRatesI18n: many(orgTaxRateI18n),
	orgsProductsVariantsPaymentPlansI18n: many(orgProductVariantPaymentPlanI18n),
	// productVariantPaymentPlanOneTimeTypeI18n: many(orgProductVariantPaymentPlanOneTimeTypeI18n),
	orgsProductsVariantsPaymentPlansSubscriptionTypeI18n: many(
		orgProductVariantPaymentPlanSubscriptionTypeI18n,
	),
	orgsDiscountsI18n: many(orgDiscountI18n),
	orgsCouponsI18n: many(orgCouponI18n),
	orgsGiftCardsI18n: many(orgGiftCardI18n),
	orgsPromotionsI18n: many(orgPromotionI18n),
	orgsLessonsI18n: many(orgLessonI18n),
	orgsProductsCoursesI18n: many(orgProductCourseI18n),
	orgsProductsCoursesModulesI18n: many(orgProductCourseModuleI18n),
	orgsProductsCoursesModulesSectionsI18n: many(orgProductCourseModuleSectionI18n),
	orgsProductsCoursesModulesSectionsLessonsI18n: many(orgProductCourseModuleSectionLessonI18n),
	orgsDepartmentsI18n: many(orgDepartmentI18n),
	orgsTeamsI18n: many(orgTeamI18n),
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
	// TODO: countries
}));
export const orgRegionI18nRelations = relations(orgRegionI18n, ({ one }) => ({
	region: one(orgRegion, {
		fields: [orgRegionI18n.regionId],
		references: [orgRegion.id],
	}),
	orgLocale: one(orgLocale, {
		fields: [orgRegionI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgRegionI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
