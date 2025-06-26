import { relations } from "drizzle-orm";

import { user } from "../../auth/schema.js";
import { currency } from "../../currency-and-market/schema.js";
import { organization } from "../../organization/schema.js";
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

export const discountRelations = relations(discount, ({ one, many }) => ({
	organization: one(organization, {
		fields: [discount.organizationId],
		references: [organization.id],
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

export const discountTranslationRelations = relations(discountTranslation, ({ one }) => ({
	discount: one(discount, {
		fields: [discountTranslation.discountId],
		references: [discount.id],
	}),
}));

export const couponRelations = relations(coupon, ({ one, many }) => ({
	organization: one(organization, {
		fields: [coupon.organizationId],
		references: [organization.id],
	}),
	discount: one(discount, {
		fields: [coupon.discountId],
		references: [discount.id],
	}),
	translations: many(couponTranslation),
}));

export const couponTranslationRelations = relations(couponTranslation, ({ one }) => ({
	coupon: one(coupon, {
		fields: [couponTranslation.couponId],
		references: [coupon.id],
	}),
}));

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

export const giftCardRelations = relations(giftCard, ({ one, many }) => ({
	organization: one(organization, {
		fields: [giftCard.organizationId],
		references: [organization.id],
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

export const giftCardTranslationRelations = relations(giftCardTranslation, ({ one }) => ({
	giftCard: one(giftCard, {
		fields: [giftCardTranslation.giftCardId],
		references: [giftCard.id],
	}),
}));

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

export const promotionRelations = relations(promotion, ({ one, many }) => ({
	organization: one(organization, {
		fields: [promotion.organizationId],
		references: [organization.id],
	}),
	translations: many(promotionTranslation),
	discounts: many(promotionDiscount),
}));

export const promotionTranslationRelations = relations(promotionTranslation, ({ one }) => ({
	promotion: one(promotion, {
		fields: [promotionTranslation.promotionId],
		references: [promotion.id],
	}),
}));

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
