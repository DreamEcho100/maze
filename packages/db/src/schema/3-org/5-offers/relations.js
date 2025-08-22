import { relations } from "drizzle-orm";
import { currency } from "../../0-local/00-schema.js";
import { orgEmployee } from "../../schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgMember } from "../1-member-and-employee/00-schema.js";
import { orgProductCollection } from "../4-product/1-collection/schema.js";
import { orgProduct, orgProductVariant } from "../4-product/00-schema.js";
import { orgMemberOrder } from "../6-orders/schema.js";
import { org } from "../00-schema.js";
import {
	orgCoupon,
	orgCouponI18n,
	orgDiscount,
	orgDiscountI18n,
	orgDiscountProduct,
	orgDiscountProductCollection,
	orgDiscountProductVariant,
	orgGiftCard,
	orgGiftCardI18n,
	orgMemberGiftCardUsage,
	orgMemberOrderDiscountUsage,
	orgPromotion,
	orgPromotionDiscount,
	orgPromotionI18n,
} from "./schema.js";

// ## org -> product -> offers
export const orgDiscountRelations = relations(orgDiscount, ({ one, many }) => ({
	org: one(org, {
		fields: [orgDiscount.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgDiscount.currencyCode],
		references: [currency.code],
	}),
	products: many(orgDiscountProduct),
	productsVariants: many(orgDiscountProductVariant),
	productsCollections: many(orgDiscountProductCollection),
	memberOrderDiscountUsage: many(orgMemberOrderDiscountUsage),
	coupons: many(orgCoupon),
	orders: many(orgMemberOrder),
}));
export const orgDiscountI18nRelations = relations(orgDiscountI18n, ({ one }) => ({
	discount: one(orgDiscount, {
		fields: [orgDiscountI18n.discountId],
		references: [orgDiscount.id],
	}),
	locale: one(orgLocale, {
		fields: [orgDiscountI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgDiscountProductRelations = relations(orgDiscountProduct, ({ one }) => ({
	discount: one(orgDiscount, {
		fields: [orgDiscountProduct.discountId],
		references: [orgDiscount.id],
	}),
	product: one(orgProduct, {
		fields: [orgDiscountProduct.productId],
		references: [orgProduct.id],
	}),
}));
export const orgDiscountProductVariantRelations = relations(
	orgDiscountProductVariant,
	({ one }) => ({
		discount: one(orgDiscount, {
			fields: [orgDiscountProductVariant.discountId],
			references: [orgDiscount.id],
		}),
		product: one(orgProductVariant, {
			fields: [orgDiscountProductVariant.variantId],
			references: [orgProductVariant.id],
		}),
	}),
);
export const orgDiscountCollectionRelations = relations(
	orgDiscountProductCollection,
	({ one }) => ({
		discount: one(orgDiscount, {
			fields: [orgDiscountProductCollection.discountId],
			references: [orgDiscount.id],
		}),
		product: one(orgProductCollection, {
			fields: [orgDiscountProductCollection.collectionId],
			references: [orgProductCollection.id],
		}),
	}),
);
export const orgMemberDiscountUsageRelations = relations(
	orgMemberOrderDiscountUsage,
	({ one }) => ({
		member: one(orgMember, {
			fields: [orgMemberOrderDiscountUsage.memberId],
			references: [orgMember.id],
		}),
		discount: one(orgDiscount, {
			fields: [orgMemberOrderDiscountUsage.discountId],
			references: [orgDiscount.id],
		}),
		order: one(orgMemberOrder, {
			fields: [orgMemberOrderDiscountUsage.orderId],
			references: [orgMemberOrder.id],
		}),
	}),
);
export const orgCouponRelations = relations(orgCoupon, ({ one }) => ({
	org: one(org, {
		fields: [orgCoupon.orgId],
		references: [org.id],
	}),
	discount: one(orgDiscount, {
		fields: [orgCoupon.discountId],
		references: [orgDiscount.id],
	}),
}));
export const orgCouponI18nRelations = relations(orgCouponI18n, ({ one }) => ({
	coupon: one(orgCoupon, {
		fields: [orgCouponI18n.couponId],
		references: [orgCoupon.id],
	}),
	locale: one(orgLocale, {
		fields: [orgCouponI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgGiftCardRelations = relations(orgGiftCard, ({ one }) => ({
	org: one(org, {
		fields: [orgGiftCard.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgGiftCard.currencyCode],
		references: [currency.code],
	}),
	issuedByEmployee: one(orgEmployee, {
		fields: [orgGiftCard.issuedByEmployeeId],
		references: [orgEmployee.id],
	}),
	issuedToMember: one(orgMember, {
		fields: [orgGiftCard.issuedToMemberId],
		references: [orgMember.id],
	}),
}));
export const orgGiftCardI18nRelations = relations(orgGiftCardI18n, ({ one }) => ({
	giftCard: one(orgGiftCard, {
		fields: [orgGiftCardI18n.giftCardId],
		references: [orgGiftCard.id],
	}),
	locale: one(orgLocale, {
		fields: [orgGiftCardI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgMemberGiftCardUsageRelations = relations(orgMemberGiftCardUsage, ({ one }) => ({
	member: one(orgMember, {
		fields: [orgMemberGiftCardUsage.memberId],
		references: [orgMember.id],
	}),
	giftCard: one(orgGiftCard, {
		fields: [orgMemberGiftCardUsage.giftCardId],
		references: [orgGiftCard.id],
	}),
}));
export const orgPromotionRelations = relations(orgPromotion, ({ one }) => ({
	org: one(org, {
		fields: [orgPromotion.orgId],
		references: [org.id],
	}),
}));
export const orgPromotionI18nRelations = relations(orgPromotionI18n, ({ one }) => ({
	promotion: one(orgPromotion, {
		fields: [orgPromotionI18n.promotionId],
		references: [orgPromotion.id],
	}),
	locale: one(orgLocale, {
		fields: [orgPromotionI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgPromotionDiscountRelations = relations(orgPromotionDiscount, ({ one }) => ({
	promotion: one(orgPromotion, {
		fields: [orgPromotionDiscount.promotionId],
		references: [orgPromotion.id],
	}),
	discount: one(orgDiscount, {
		fields: [orgPromotionDiscount.discountId],
		references: [orgDiscount.id],
	}),
}));
// -- org -> product -> offers
