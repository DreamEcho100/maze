import { relations } from "drizzle-orm";
import { currency, locale } from "../../../system/locale-currency-market/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { user } from "../../../user/schema.js";
import { org } from "../../schema.js";
import { discountCollection } from "../collection/schema.js";
import { discountProduct, discountVariant } from "../schema.js";
import {
	coupon,
	couponTranslation,
	discount,
	discountTranslation,
	discountUsage,
	giftCard,
	giftCardTranslation,
	giftCardUsage,
	promotion,
	promotionDiscount,
	promotionTranslation,
} from "./schema.js";

/**
 * @relationModel discountRelations
 * @domainModel Discount
 * @abacRole marketing_admin
 * @permissionContext organization_id
 * @lifecycleWindow startsAt–endsAt, isActive
 * @auditTrail track:coupon, promotion, usage, collection, product, variant
 */
export const discountRelations = relations(discount, ({ one, many }) => ({
	org: one(org, {
		fields: [discount.organizationId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [discount.currencyCode],
		references: [currency.code],
	}),
	translations: many(discountTranslation),
	coupons: many(coupon),
	usages: many(discountUsage),
	products: many(discountProduct),
	variants: many(discountVariant),
	collections: many(discountCollection),
	promotions: many(promotionDiscount),
}));

/**
 * @relationModel discountTranslationRelations
 * @i18nSupport true
 * @seoSupport true
 * @abacRole content_localizer
 */
export const discountTranslationRelations = relations(discountTranslation, ({ one }) => ({
	discount: one(discount, {
		fields: [discountTranslation.discountId],
		references: [discount.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [discountTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [discountTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * @relationModel couponRelations
 * @domainModel Coupon
 * @abacRole marketing_admin
 * @permissionContext organization_id
 */
export const couponRelations = relations(coupon, ({ one, many }) => ({
	org: one(org, {
		fields: [coupon.organizationId],
		references: [org.id],
	}),
	discount: one(discount, {
		fields: [coupon.discountId],
		references: [discount.id],
	}),
	translations: many(couponTranslation),
}));

/**
 * @relationModel couponTranslationRelations
 * @i18nSupport true
 * @seoSupport true
 * @abacRole content_localizer
 */
export const couponTranslationRelations = relations(couponTranslation, ({ one }) => ({
	coupon: one(coupon, {
		fields: [couponTranslation.couponId],
		references: [coupon.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [couponTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [couponTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * @relationModel discountUsageRelations
 * @auditTrail true
 * @contentAttribution discount
 * @abacRole end_user
 */
export const discountUsageRelations = relations(discountUsage, ({ one }) => ({
	user: one(user, {
		fields: [discountUsage.userId],
		references: [user.id],
	}),
	discount: one(discount, {
		fields: [discountUsage.discountId],
		references: [discount.id],
	}),
}));

/**
 * @relationModel giftCardRelations
 * @domainModel GiftCard
 * @abacRole finance_admin
 * @permissionContext organization_id
 * @auditTrail true
 * @compensationModel prepaid_balance
 */
export const giftCardRelations = relations(giftCard, ({ one, many }) => ({
	org: one(org, {
		fields: [giftCard.organizationId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [giftCard.currencyCode],
		references: [currency.code],
	}),
	issuedToUser: one(user, {
		fields: [giftCard.issuedToUserId],
		references: [user.id],
	}),
	translations: many(giftCardTranslation),
	usages: many(giftCardUsage),
}));

/**
 * @relationModel giftCardTranslationRelations
 * @i18nSupport true
 * @seoSupport true
 * @abacRole content_localizer
 */
export const giftCardTranslationRelations = relations(giftCardTranslation, ({ one }) => ({
	giftCard: one(giftCard, {
		fields: [giftCardTranslation.giftCardId],
		references: [giftCard.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [giftCardTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [giftCardTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * @relationModel giftCardUsageRelations
 * @auditTrail true
 * @abacRole end_user
 * @contentAttribution gift_card
 */
export const giftCardUsageRelations = relations(giftCardUsage, ({ one }) => ({
	user: one(user, {
		fields: [giftCardUsage.userId],
		references: [user.id],
	}),
	giftCard: one(giftCard, {
		fields: [giftCardUsage.giftCardId],
		references: [giftCard.id],
	}),
}));

/**
 * @relationModel promotionRelations
 * @domainModel Promotion
 * @abacRole marketing_admin
 * @permissionContext organization_id
 * @lifecycleWindow startsAt–endsAt, isActive
 */
export const promotionRelations = relations(promotion, ({ one, many }) => ({
	org: one(org, {
		fields: [promotion.organizationId],
		references: [org.id],
	}),
	translations: many(promotionTranslation),
	discounts: many(promotionDiscount),
}));

/**
 * @relationModel promotionTranslationRelations
 * @i18nSupport true
 * @seoSupport true
 * @abacRole content_localizer
 */
export const promotionTranslationRelations = relations(promotionTranslation, ({ one }) => ({
	promotion: one(promotion, {
		fields: [promotionTranslation.promotionId],
		references: [promotion.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [promotionTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [promotionTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * @relationModel promotionDiscountRelations
 * @businessLogic Links promotions to applied discounts
 * @abacRole marketing_admin
 * @auditTrail true
 */
export const promotionDiscountRelations = relations(promotionDiscount, ({ one }) => ({
	promotion: one(promotion, {
		fields: [promotionDiscount.promotionId],
		references: [promotion.id],
	}),
	discount: one(discount, {
		fields: [promotionDiscount.discountId],
		references: [discount.id],
	}),
}));
