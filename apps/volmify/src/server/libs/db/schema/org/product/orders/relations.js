import { relations } from "drizzle-orm";
import { userProfileOrgMembershipProductAttributionRevenue } from "../../../user/profile/schema.js";
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
	 * @orderDetails Line items and discount applications
	 */
	items: many(orgMemberProductOrderItem),
	discountApplications: many(orgMemberProductOrderDiscount),

	taxCalculations: many(orgMemberProductOrderTaxCalculation),
	paymentDetails: many(orgMemberProductOrderPayment),
}));

export const orgMemberProductOrderItemRelations = relations(
	orgMemberProductOrderItem,
	({ many, one }) => ({
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
		/**
		 * @paymentStrategy Payment plan/tier used for purchase
		 */
		paymentPlan: one(orgProductVariantPaymentPlan, {
			fields: [orgMemberProductOrderItem.paymentPlanId],
			references: [orgProductVariantPaymentPlan.id],
		}),
		revenueAttributions: many(userProfileOrgMembershipProductAttributionRevenue),
	}),
);

export const orgMemberProductOrderDiscountRelations = relations(
	orgMemberProductOrderDiscount,
	({ one }) => ({
		order: one(orgMemberProductOrderItem, {
			fields: [orgMemberProductOrderDiscount.orderId],
			references: [orgMemberProductOrderItem.id],
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
		// order: one(orgMemberProductOrder		, {
		// 	fields: [orgMemberProductOrderDiscount.orderId],
		// 	references: [orgMemberProductOrder.id],
		// }),
	}),
);

export const orgMemberProductOrderTaxCalculationRelations = relations(
	orgMemberProductOrderTaxCalculation,
	({ one }) => ({
		order: one(orgMemberProductOrder, {
			fields: [orgMemberProductOrderTaxCalculation.orderId],
			references: [orgMemberProductOrder.id],
		}),
		taxRate: one(orgMemberProductOrderTaxCalculation, {
			fields: [orgMemberProductOrderTaxCalculation.taxRateId],
			references: [orgMemberProductOrderTaxCalculation.taxRateId],
		}),
	}),
);
export const orgMemberProductOrderPaymentRelations = relations(
	orgMemberProductOrderPayment,
	({ one }) => ({
		order: one(orgMemberProductOrder, {
			fields: [orgMemberProductOrderPayment.orderId],
			references: [orgMemberProductOrder.id],
		}),
	}),
);
