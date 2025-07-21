import { relations } from "drizzle-orm";

import { orgMember } from "../../member/schema.js";
import { org } from "../../schema.js";
import { orgCoupon, orgDiscount, orgGiftCard } from "../offers/schema.js";
import { orgProductVariantPaymentPlan } from "../payment/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";
import {
	orgMemberProductOrder,
	orgMemberProductOrderDiscount,
	orgMemberProductOrderItem,
	orgMemberProductOrderPayment,
	orgMemberProductOrderRevenueAttribution,
	orgMemberProductOrderTaxCalculation,
} from "./schema.js";

/**
 * Order Relations - E-commerce Transaction Relationships
 *
 * @businessContext Complete order relationship mapping for e-commerce workflows
 * enabling customer service, financial reporting, and creator economy revenue tracking
 */
export const orgMemberProductOrderRelations = relations(orgMemberProductOrder, ({ one, many }) => ({
	/**
	 * @multiTenant Organization context for order processing
	 */
	org: one(org, {
		fields: [orgMemberProductOrder.orgId],
		references: [org.id],
	}),

	/**
	 * @customerIdentity Member who placed the order
	 */
	member: one(orgMember, {
		fields: [orgMemberProductOrder.memberId],
		references: [orgMember.id],
	}),

	/**
	 * @productPurchase Product and variant details
	 */
	product: one(orgProduct, {
		fields: [orgMemberProductOrder.productId],
		references: [orgProduct.id],
	}),
	variant: one(orgProductVariant, {
		fields: [orgMemberProductOrder.variantId],
		references: [orgProductVariant.id],
	}),

	/**
	 * @paymentStrategy Payment plan used for purchase
	 */
	paymentPlan: one(orgProductVariantPaymentPlan, {
		fields: [orgMemberProductOrder.paymentPlanId],
		references: [orgProductVariantPaymentPlan.id],
	}),

	/**
	 * @orderDetails Line items and discount applications
	 */
	items: many(orgMemberProductOrderItem),
	discountApplications: many(orgMemberProductOrderDiscount),

	taxCalculations: many(orgMemberProductOrderTaxCalculation),
	paymentDetails: many(orgMemberProductOrderPayment),
	revenueAttributions: many(orgMemberProductOrderRevenueAttribution),

	// ✅ NEW: Payment plan tier relation
	selectedTier: one(orgProductVariantPaymentPlan, {
		fields: [orgMemberProductOrder.paymentPlanId, orgMemberProductOrder.selectedAccessTier],
		references: [orgProductVariantPaymentPlan.id, orgProductVariantPaymentPlan.accessTier],
	}),
}));

export const orgMemberProductOrderItemRelations = relations(
	orgMemberProductOrderItem,
	({ one }) => ({
		order: one(orgMemberProductOrder, {
			fields: [orgMemberProductOrderItem.orderId],
			references: [orgMemberProductOrder.id],
		}),
		product: one(orgProduct, {
			fields: [orgMemberProductOrderItem.productId],
			references: [orgProduct.id],
		}),
		variant: one(orgProductVariant, {
			fields: [orgMemberProductOrderItem.variantId],
			references: [orgProductVariant.id],
		}),
	}),
);

export const orgMemberProductOrderDiscountRelations = relations(
	orgMemberProductOrderDiscount,
	({ one }) => ({
		order: one(orgMemberProductOrder, {
			fields: [orgMemberProductOrderDiscount.orderId],
			references: [orgMemberProductOrder.id],
		}),
		discount: one(orgDiscount, {
			fields: [orgMemberProductOrderDiscount.discountId],
			references: [orgDiscount.id],
		}),
		coupon: one(orgCoupon, {
			fields: [orgMemberProductOrderDiscount.couponId],
			references: [orgCoupon.id],
		}),
		giftCard: one(orgGiftCard, {
			fields: [orgMemberProductOrderDiscount.giftCardId],
			references: [orgGiftCard.id],
		}),
	}),
);
