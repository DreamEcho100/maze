import { relations } from "drizzle-orm";
import { currency, locale } from "../../../system/locale-currency-market/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { user } from "../../../user/schema.js";
import { org } from "../../schema.js";
import { discountCollection } from "../collection/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";
import {
	coupon,
	couponTranslation,
	discount,
	discountProduct,
	discountTranslation,
	discountUsage,
	discountVariant,
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
 * @permissionContext org_id
 * @lifecycleWindow startsAt–endsAt, isActive
 * @auditTrail track:coupon, promotion, usage, collection, product, variant
 */
export const discountRelations = relations(discount, ({ one, many }) => ({
	org: one(org, {
		fields: [discount.orgId],
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
 * @permissionContext org_id
 */
export const couponRelations = relations(coupon, ({ one, many }) => ({
	org: one(org, {
		fields: [coupon.orgId],
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
 * @permissionContext org_id
 * @auditTrail true
 * @compensationModel prepaid_balance
 */
export const giftCardRelations = relations(giftCard, ({ one, many }) => ({
	org: one(org, {
		fields: [giftCard.orgId],
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
 * @permissionContext org_id
 * @lifecycleWindow startsAt–endsAt, isActive
 */
export const promotionRelations = relations(promotion, ({ one, many }) => ({
	org: one(org, {
		fields: [promotion.orgId],
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

/**
 * Discount Product Relations (Promotional Integration)
 *
 * @integrationRole Product-level discount campaign relationships
 * Connects discount campaigns to products enabling targeted promotional strategies
 * while maintaining compatibility with payment plan pricing and e-commerce workflows.
 *
 * @promotionalStrategy Enables product-specific promotional campaigns for revenue
 * optimization and customer acquisition while integrating with payment plan pricing
 * for comprehensive promotional campaign management.
 */
export const discountProductRelations = relations(discountProduct, ({ one }) => ({
	/**
	 * @promotionalCampaign Discount campaign this product application belongs to
	 * @businessContext Links product to specific promotional strategy and revenue optimization
	 * @marketingStrategy Enables targeted promotional campaigns for customer acquisition
	 */
	discount: one(discount, {
		fields: [discountProduct.discountId],
		references: [discount.id],
	}),

	/**
	 * @productTarget Product this discount campaign applies to
	 * @businessContext Links promotional strategy to specific product for targeted marketing
	 * @revenueStrategy Enables product-specific promotional pricing and conversion optimization
	 */
	product: one(orgProduct, {
		fields: [discountProduct.productId],
		references: [orgProduct.id],
	}),
}));

/**
 * Discount Variant Relations (Granular Promotional Integration)
 *
 * @integrationRole Variant-level discount campaign relationships
 * Connects discount campaigns to specific product variants enabling granular promotional
 * strategies for different pricing tiers and access levels while maintaining payment
 * plan pricing compatibility.
 *
 * @promotionalStrategy Enables variant-specific promotional campaigns for precise revenue
 * optimization and customer conversion strategies while integrating with payment plan
 * pricing for sophisticated promotional campaign workflows.
 */
export const discountVariantRelations = relations(discountVariant, ({ one }) => ({
	/**
	 * @promotionalCampaign Discount campaign this variant application belongs to
	 * @businessContext Links variant to specific promotional strategy for granular pricing control
	 * @conversionStrategy Enables targeted promotional campaigns for specific access levels
	 */
	discount: one(discount, {
		fields: [discountVariant.discountId],
		references: [discount.id],
	}),

	/**
	 * @variantTarget Product variant this discount campaign applies to
	 * @businessContext Links promotional strategy to specific variant for granular marketing
	 * @revenueOptimization Enables variant-specific promotional pricing and conversion strategies
	 */
	variant: one(orgProductVariant, {
		fields: [discountVariant.variantId],
		references: [orgProductVariant.id],
	}),
}));
