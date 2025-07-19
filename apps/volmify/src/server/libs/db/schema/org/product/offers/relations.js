import { relations } from "drizzle-orm";
import { currency } from "../../../general/locale-currency-market/schema.js";
import { orgLocale } from "../../locale-region/schema.js";
import { orgMember } from "../../member/schema.js";
import { org } from "../../schema.js";
import { orgProductCollection } from "../collection/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";
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
}));
export const orgDiscountI18nRelations = relations(orgDiscountI18n, ({ one, many }) => ({
	discount: one(orgDiscount, {
		fields: [orgDiscountI18n.discountId],
		references: [orgDiscount.id],
	}),
	locale: one(orgLocale, {
		fields: [orgDiscountI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgDiscountProductRelations = relations(orgDiscountProduct, ({ one, many }) => ({
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
	({ one, many }) => ({
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
	({ one, many }) => ({
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
	({ one, many }) => ({
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
export const orgCouponRelations = relations(orgCoupon, ({ one, many }) => ({
	org: one(org, {
		fields: [orgCoupon.orgId],
		references: [org.id],
	}),
	discount: one(orgDiscount, {
		fields: [orgCoupon.discountId],
		references: [orgDiscount.id],
	}),
}));
export const orgCouponI18nRelations = relations(orgCouponI18n, ({ one, many }) => ({
	coupon: one(orgCoupon, {
		fields: [orgCouponI18n.couponId],
		references: [orgCoupon.id],
	}),
	locale: one(orgLocale, {
		fields: [orgCouponI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgGiftCardRelations = relations(orgGiftCard, ({ one, many }) => ({
	org: one(org, {
		fields: [orgGiftCard.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgGiftCard.currencyCode],
		references: [currency.code],
	}),
	memberIssuedTo: one(orgMember, {
		fields: [orgGiftCard.issuedToMemberId],
		references: [orgMember.id],
	}),
}));
export const orgGiftCardI18nRelations = relations(orgGiftCardI18n, ({ one, many }) => ({
	giftCard: one(orgGiftCard, {
		fields: [orgGiftCardI18n.giftCardId],
		references: [orgGiftCard.id],
	}),
	locale: one(orgLocale, {
		fields: [orgGiftCardI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgMemberGiftCardUsageRelations = relations(
	orgMemberGiftCardUsage,
	({ one, many }) => ({
		member: one(orgMember, {
			fields: [orgMemberGiftCardUsage.memberId],
			references: [orgMember.id],
		}),
		giftCard: one(orgGiftCard, {
			fields: [orgMemberGiftCardUsage.giftCardId],
			references: [orgGiftCard.id],
		}),
	}),
);
export const orgPromotionRelations = relations(orgPromotion, ({ one, many }) => ({
	org: one(org, {
		fields: [orgPromotion.orgId],
		references: [org.id],
	}),
}));
export const orgPromotionI18nRelations = relations(orgPromotionI18n, ({ one, many }) => ({
	promotion: one(orgPromotion, {
		fields: [orgPromotionI18n.promotionId],
		references: [orgPromotion.id],
	}),
	locale: one(orgLocale, {
		fields: [orgPromotionI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgPromotionDiscountRelations = relations(orgPromotionDiscount, ({ one, many }) => ({
	promotion: one(orgPromotion, {
		fields: [orgPromotionDiscount.promotionId],
		references: [orgPromotion.id],
	}),
	discount: one(orgDiscount, {
		fields: [orgPromotionDiscount.discountId],
		references: [orgDiscount.id],
	}),
}));
