// ## org -> product -> order

import { relations } from "drizzle-orm";
import { accountTransaction, orgProductVariantPaymentPlan } from "../../schema.js";
import { orgMember } from "../1-member-and-employee/00-schema.js";
import { orgTaxRateSnapshot } from "../3-tax/schema.js";
import { orgProduct, orgProductVariant } from "../4-product/00-schema.js";
import { orgCoupon, orgDiscount, orgGiftCard } from "../5-offers/schema.js";
import { org } from "../00-schema.js";
import {
	orgMemberOrder,
	orgMemberOrderDiscount,
	orgMemberOrderItem,
	orgMemberOrderPayment,
	orgMemberOrderTaxCalculation,
} from "./schema.js";

/**
 * Order Relations - E-commerce Transaction Relationships
 *
 * @businessContext Complete order relationship mapping for e-commerce workflows
 * enabling customer service, financial reporting, and creator economy revenue tracking
 */
export const orgMemberProductOrderRelations = relations(orgMemberOrder, ({ one, many }) => ({
	/**
	 * @multiTenant Organization context for order processing
	 */
	org: one(org, {
		fields: [orgMemberOrder.orgId],
		references: [org.id],
	}),

	/**
	 * @customerIdentity Member who placed the order
	 */
	member: one(orgMember, {
		fields: [orgMemberOrder.memberId],
		references: [orgMember.id],
	}),

	/**
	 * @orderDetails Line items and discount applications
	 */
	items: many(orgMemberOrderItem),
	discountApplications: many(orgMemberOrderDiscount),

	taxCalculations: many(orgMemberOrderTaxCalculation),
	paymentDetails: many(orgMemberOrderPayment),
	accountTransactions: many(accountTransaction),
}));

export const orgMemberProductOrderItemRelations = relations(
	orgMemberOrderItem,
	({ many, one }) => ({
		order: one(orgMemberOrder, {
			fields: [orgMemberOrderItem.orderId],
			references: [orgMemberOrder.id],
		}),
		product: one(orgProduct, {
			fields: [orgMemberOrderItem.productId],
			references: [orgProduct.id],
		}),
		variant: one(orgProductVariant, {
			fields: [orgMemberOrderItem.variantId],
			references: [orgProductVariant.id],
		}),
		/**
		 * @paymentStrategy Payment plan/tier used for purchase
		 */
		paymentPlan: one(orgProductVariantPaymentPlan, {
			fields: [orgMemberOrderItem.paymentPlanId],
			references: [orgProductVariantPaymentPlan.id],
		}),
	}),
);

export const orgMemberProductOrderDiscountRelations = relations(
	orgMemberOrderDiscount,
	({ one }) => ({
		order: one(orgMemberOrderItem, {
			fields: [orgMemberOrderDiscount.orderId],
			references: [orgMemberOrderItem.id],
		}),
		discount: one(orgDiscount, {
			fields: [orgMemberOrderDiscount.discountId],
			references: [orgDiscount.id],
		}),
		coupon: one(orgCoupon, {
			fields: [orgMemberOrderDiscount.couponId],
			references: [orgCoupon.id],
		}),
		giftCard: one(orgGiftCard, {
			fields: [orgMemberOrderDiscount.giftCardId],
			references: [orgGiftCard.id],
		}),
		// order: one(orgMemberProductOrder		, {
		// 	fields: [orgMemberProductOrderDiscount.orderId],
		// 	references: [orgMemberProductOrder.id],
		// }),
	}),
);

export const orgMemberProductOrderTaxCalculationRelations = relations(
	orgMemberOrderTaxCalculation,
	({ one }) => ({
		order: one(orgMemberOrder, {
			fields: [orgMemberOrderTaxCalculation.orderId],
			references: [orgMemberOrder.id],
		}),
		taxRate: one(orgTaxRateSnapshot, {
			fields: [orgMemberOrderTaxCalculation.taxRateSnapshotId],
			references: [orgTaxRateSnapshot.id],
		}),
	}),
);
export const orgMemberProductOrderPaymentRelations = relations(
	orgMemberOrderPayment,
	({ one }) => ({
		order: one(orgMemberOrder, {
			fields: [orgMemberOrderPayment.orderId],
			references: [orgMemberOrder.id],
		}),
	}),
);
// -- org -> product -> order
