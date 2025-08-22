import { relations } from "drizzle-orm";
import { currency } from "../../../0-local/00-schema.js";
import { seoMetadata } from "../../../0-seo/00-schema.js";
import { user } from "../../../2-user/00-schema.js";
import { orgLocale } from "../../0-locale/00-schema.js";
import { orgCategory } from "../../1-category/schema.js";
import { orgMember } from "../../1-member-and-employee/00-schema.js";
import { org } from "../../00-schema.js";
import { orgProductVariant } from "../00-schema.js";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
	orgProductVariantPaymentPlanI18n,
	orgProductVariantPaymentPlanOneTimeType,
	orgProductVariantPaymentPlanSubscriptionType,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "./schema.js";

// ## org -> product -> payment
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
		taxCategory: one(orgCategory, {
			fields: [orgProductVariantPaymentPlan.taxCategoryId],
			references: [orgCategory.id],
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
		currency: one(currency, {
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
		currency: one(currency, {
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
// -- org -> product -> payment
