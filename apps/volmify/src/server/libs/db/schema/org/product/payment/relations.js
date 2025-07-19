/**
 * @fileoverview Product Payment Relations - Variant-Level Payment Integration
 *
 * @integrationPattern Variant-Based Payment Relations + CTI + Creator Economy Integration
 * Enables comprehensive payment plan relationships with product variants, org
 * boundaries, and customer subscriptions while maintaining optimal query performance through
 * CTI pattern and specialized relation definitions for e-commerce monetization workflows.
 *
 * @businessContext
 * Payment relations support variant-level e-commerce monetization workflows including
 * org pricing strategies, creator economy revenue attribution, multi-currency
 * international expansion, and customer subscription lifecycle management for sophisticated
 * product monetization and comprehensive business analytics.
 *
 * @scalabilityContext
 * CTI relations pattern enables adding new payment types (freemium, corporate, enterprise)
 * without affecting existing payment workflows or requiring relation migrations, supporting
 * platform growth and new monetization strategies while maintaining creator attribution.
 *
 * @creatorEconomyIntegration
 * Payment relations integrate with instructor attribution systems enabling revenue sharing
 * calculations and creator compensation workflows within org boundaries while
 * supporting cross-org professional collaboration patterns.
 *
 * @variantIntegration
 * Deep integration with productVariant system maintains consistency with established
 * e-commerce patterns while adding sophisticated payment plan capabilities for modern
 * subscription economy and usage-based business models.
 */

import { relations } from "drizzle-orm";
import { currency } from "../../../general/locale-currency-market/schema.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { user } from "../../../user/schema.js";
import { orgLocale } from "../../locale-region/schema.js";
import { orgMember } from "../../member/schema.js";
import { org } from "../../schema.js";
import { orgTaxCategory } from "../../tax/schema.js";
import { orgProductVariant } from "../schema.js";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
	orgProductVariantPaymentPlanI18n,
	orgProductVariantPaymentPlanOneTimeType,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionType,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "./schema.js";

export const orgProductVariantPaymentPlanRelations = relations(
	orgProductVariantPaymentPlan,
	({ one, many }) => ({
		variant: one(orgProductVariant, {
			fields: [orgProductVariantPaymentPlan.variantId],
			references: [orgProductVariant.id],
		}),
		org: one(org, {
			fields: [orgProductVariantPaymentPlan.orgId],
			references: [org.id],
		}),
		taxCategory: one(orgTaxCategory, {
			fields: [orgProductVariantPaymentPlan.taxCategoryId],
			references: [orgTaxCategory.id],
		}),
		translations: many(orgProductVariantPaymentPlanI18n),
		subscriptions: many(orgMemberProductVariantPaymentPlanSubscription),
	}),
);
export const orgProductVariantPaymentPlanI18nRelations = relations(
	orgProductVariantPaymentPlanI18n,
	({ one }) => ({
		planId: one(orgProductVariantPaymentPlan, {
			fields: [orgProductVariantPaymentPlanI18n.planId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		seoMetadataId: one(seoMetadata, {
			fields: [orgProductVariantPaymentPlanI18n.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(orgLocale, {
			fields: [orgProductVariantPaymentPlanI18n.localeKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
export const orgProductVariantPaymentPlanOneTimeTypeRelations = relations(
	orgProductVariantPaymentPlanOneTimeType,
	({ one, many }) => ({
		planId: one(orgProductVariantPaymentPlan, {
			fields: [orgProductVariantPaymentPlanOneTimeType.planId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		currencyCode: one(currency, {
			fields: [orgProductVariantPaymentPlanOneTimeType.currencyCode],
			references: [currency.code],
		}),
		// translations: many(orgProductVariantPaymentPlanOneTimeTypeI18n),
	}),
);
// export const orgProductVariantPaymentPlanOneTimeTypeI18nRelations = relations(
// 	orgProductVariantPaymentPlanOneTimeTypeI18n,
// 	({ one }) => ({
// 		planId: one(orgProductVariantPaymentPlan, {
// 			fields: [orgProductVariantPaymentPlanOneTimeTypeI18n.planId],
// 			references: [orgProductVariantPaymentPlan.id],
// 		}),
// 		locale: one(orgLocale, {
// 			fields: [orgProductVariantPaymentPlanOneTimeTypeI18n.localeKey],
// 			references: [orgLocale.localeKey],
// 		}),
// 	}),
// );
export const orgProductVariantPaymentPlanSubscriptionTypeRelations = relations(
	orgProductVariantPaymentPlanSubscriptionType,
	({ one, many }) => ({
		planId: one(orgProductVariantPaymentPlan, {
			fields: [orgProductVariantPaymentPlanSubscriptionType.planId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		currencyCode: one(currency, {
			fields: [orgProductVariantPaymentPlanSubscriptionType.currencyCode],
			references: [currency.code],
		}),
		translations: many(orgProductVariantPaymentPlanSubscriptionTypeI18n),
	}),
);
export const orgProductVariantPaymentPlanSubscriptionTypeI18nRelations = relations(
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
	({ one }) => ({
		planId: one(orgProductVariantPaymentPlan, {
			fields: [orgProductVariantPaymentPlanSubscriptionTypeI18n.planId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		locale: one(orgLocale, {
			fields: [orgProductVariantPaymentPlanSubscriptionTypeI18n.localeKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
export const orgMemberProductVariantPaymentPlanSubscriptionRelations = relations(
	orgMemberProductVariantPaymentPlanSubscription,
	({ one }) => ({
		// userId
		user: one(user, {
			fields: [orgMemberProductVariantPaymentPlanSubscription.userId],
			references: [user.id],
		}),
		// planId
		paymentPlan: one(orgProductVariantPaymentPlan, {
			fields: [orgMemberProductVariantPaymentPlanSubscription.planId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		// orgId
		org: one(org, {
			fields: [orgMemberProductVariantPaymentPlanSubscription.orgId],
			references: [org.id],
		}),
		// orgMemberId
		orgMember: one(orgMember, {
			fields: [orgMemberProductVariantPaymentPlanSubscription.orgMemberId],
			references: [orgMember.id],
		}),
	}),
);
