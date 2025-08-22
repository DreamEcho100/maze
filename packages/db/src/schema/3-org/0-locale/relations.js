import { relations } from "drizzle-orm";
import {
	orgProductCourseI18n,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLessonI18n,
	orgProductVariantPaymentPlanI18n,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "../../schema.js";
import { orgCategoryI18n } from "../1-category/schema.js";
import { orgDepartmentI18n, orgTeamI18n } from "../2-team-and-department/schema.js";
import { orgFunnelI18n } from "../3-funnel/schema.js";
import { orgLessonI18n } from "../3-lesson/schema.js";
import { orgRegionI18n } from "../3-region/schema.js";
import { orgTaxRateI18n } from "../3-tax/schema.js";
import {
	orgCouponI18n,
	orgDiscountI18n,
	orgGiftCardI18n,
	orgPromotionI18n,
} from "../5-offers/schema.js";
import { org } from "../00-schema.js";
import { orgLocale } from "./00-schema.js";

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
	orgsCategoriesI18n: many(orgCategoryI18n),
}));
