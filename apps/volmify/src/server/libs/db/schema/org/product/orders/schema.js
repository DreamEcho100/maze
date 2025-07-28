import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

import { numericCols, sharedCols, table, temporalCols, textCols } from "../../../_utils/helpers.js";
import { orgTableName } from "../../_utils/helpers.js";
import { orgTaxRateSnapshot } from "../../tax/schema.js";
import { orgCoupon, orgDiscount, orgGiftCard } from "../offers/schema.js";
import { orgProductVariantPaymentPlan } from "../payment/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";

const orgMemberOrderTableName = `${orgTableName}_member_order`;

// ✅ ORDER STATUS: Complete e-commerce lifecycle
export const orgMemberOrderStatusEnum = pgEnum(`${orgMemberOrderTableName}_status`, [
	"pending", // Order created, awaiting payment
	"processing", // Payment received, processing order
	"confirmed", // Order confirmed, access granted
	"fulfilled", // Digital delivery completed
	"cancelled", // Order cancelled before payment
	"refunded", // Order refunded after payment
	"failed", // Payment or processing failed
	"expired", // Order expired without payment
]);

// ✅ PAYMENT STATUS: Financial transaction tracking
export const orgMemberOrderPaymentStatusEnum = pgEnum(`${orgMemberOrderTableName}_payment_status`, [
	"pending", // Payment not yet attempted
	"cancelled", // Payment cancelled by user
	"processing", // Payment in progress
	"paid", // Payment successful
	"failed", // Payment failed
	"refunded", // Payment refunded
	"partially_refunded", // Partial refund issued
	"disputed", // Payment disputed/chargeback
]);

/**
 * Organization Member Product Order - E-commerce Transaction Foundation
 *
 * @businessLogic Central order management for org product purchases enabling
 * complete e-commerce workflow from cart to fulfillment with multi-tenant isolation,
 * creator economy revenue tracking, and comprehensive audit trail.
 *
 * @ecommerceWorkflow Order lifecycle management from creation through fulfillment
 * supporting multiple payment methods, promotional campaigns, and subscription integration
 * while maintaining org boundaries and creator attribution workflows.
 *
 * @creatorEconomy Revenue attribution foundation enabling Org member compensation
 * calculations and org revenue sharing with detailed financial tracking for
 * creator economy monetization and transparent revenue distribution.
 *
 * @accessControl Orders determine product access permissions through payment plan
 * integration enabling tiered content access and subscription-based learning experiences
 * with org-scoped access management and member benefit administration.
 */
export const orgMemberOrder = table(
	orgMemberOrderTableName,
	{
		id: textCols.id().notNull(),

		/**
		 * @orderIdentification Human-readable order number for customer service
		 * @businessRule Unique within org for customer communication and support
		 * @auditTrail Used in emails, receipts, and customer service interactions
		 */
		displayId: textCols.code("display_id").notNull(),

		/**
		 * @multiTenant Org context for order processing and revenue attribution
		 * @businessRule All order operations respect org boundaries
		 * @revenueTracking Enables org-specific financial reporting and analytics
		 */
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @customerIdentity Org member placing the order
		 * @accessControl Primary identity for content access after purchase
		 * @businessRule Orders can only be placed by active org members
		 */
		memberId: sharedCols.orgMemberIdFk().notNull(),

		// Q: Should it connect to the country table?

		/**
		 * @orderLifecycle Current order processing status
		 * @businessRule Determines order workflow and customer communication
		 * @accessControl Status affects content access permissions
		 */
		status: orgMemberOrderStatusEnum("status").notNull().default("pending"),

		/**
		 * @paymentTracking Financial transaction status for revenue management
		 * @businessRule Independent of order status for financial clarity
		 * @auditTrail Critical for financial reporting and dispute resolution
		 */
		paymentStatus: orgMemberOrderPaymentStatusEnum("payment_status").notNull().default("pending"),

		/**
		 * @financialCalculation Total order amount before discounts
		 * @businessRule Must match variant payment plan base pricing
		 * @currencyConsistency Uses org default currency for consistent pricing
		 */
		subtotalAmount: numericCols.currency.amount("subtotal_amount").notNull(),

		/**
		 * @promotionalStrategy Total discount amount applied to order
		 * @businessRule Sum of all applied discounts (coupons, promotions, gift cards)
		 * @revenueImpact Reduces final order amount and affects revenue attribution
		 */
		totalDiscountAmount: numericCols.currency.amount("discount_amount").default("0.00"),

		/**
		 * @taxCompliance Tax amount calculated based on org tax policies
		 * @businessRule Tax calculation respects regional tax requirements
		 * @financialReporting Essential for tax reporting and compliance
		 */
		totalTaxAmount: numericCols.currency.amount("total_tax_amount").default("0.00"),

		/**
		 * @finalPricing Total amount charged to customer
		 * @businessRule subtotalAmount - discountAmount + taxAmount
		 * @paymentGateway Amount processed by payment gateway
		 */
		totalAmount: numericCols.currency.amount("total_amount").notNull(),

		/**
		 * @currencyStandard Currency for all order monetary values
		 * @businessRule Must match org default currency or member preference
		 * @internationalSupport Enables multi-currency order processing
		 */
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		/**
		 * @paymentGateway External payment processor transaction ID
		 * @integrationPoint Links internal order to external payment system
		 * @auditTrail Essential for payment reconciliation and dispute resolution
		 */
		externalPaymentId: textCols.code("external_payment_id"),

		/**
		 * @paymentMethod Payment method used for transaction
		 * @businessRule Informational for customer service and analytics
		 * @reportingData Enables payment method performance analysis
		 */
		paymentMethod: textCols.category("payment_method"), // "credit_card", "paypal", "stripe", etc.

		/**
		 * @orderTiming Critical timestamps for order lifecycle management
		 * @businessRule Order placement, payment, and fulfillment timing
		 * @customerExperience Used for order status communication
		 */
		orderedAt: temporalCols.business.startsAt("ordered_at").defaultNow(),
		paidAt: temporalCols.financial.paidAt(),
		fulfilledAt: temporalCols.business.endsAt("fulfilled_at"),

		/**
		 * @orderMetadata Additional order information and processing details
		 * @integrationData Customer notes, special instructions, gateway responses
		 * @analyticsData Order source, campaign attribution, A/B test data
		 */
		metadata: textCols.metadata(),

		/**
		 * @pricingSnapshot Price for selected tier (varies by tier within plan)
		 * @historicalAccuracy Preserves pricing at time of purchase
		 */
		tierPrice: numericCols.currency.amount("tier_price").notNull(),

		/**
		 * @auditTrail Standard lifecycle timestamps for compliance
		 */
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		// Business Constraints
		uniqueIndex(`uq_${orgMemberOrderTableName}_order_number_org`).on(t.orgId, t.displayId),

		// Performance Indexes - Multi-tenant queries
		index(`idx_${orgMemberOrderTableName}_org_status`).on(t.orgId, t.status),
		index(`idx_${orgMemberOrderTableName}_member_status`).on(t.memberId, t.status),

		// Financial reporting indexes
		index(`idx_${orgMemberOrderTableName}_payment_status`).on(t.paymentStatus),
		index(`idx_${orgMemberOrderTableName}_total_amount`).on(t.totalAmount),
		index(`idx_${orgMemberOrderTableName}_currency`).on(t.currencyCode),

		// Time-based analytics indexes
		index(`idx_${orgMemberOrderTableName}_ordered_at`).on(t.orderedAt),
		index(`idx_${orgMemberOrderTableName}_paid_at`).on(t.paidAt),
		index(`idx_${orgMemberOrderTableName}_fulfilled_at`).on(t.fulfilledAt),

		// Customer service indexes
		index(`idx_${orgMemberOrderTableName}_external_payment`).on(t.externalPaymentId),
		index(`idx_${orgMemberOrderTableName}_payment_method`).on(t.paymentMethod),

		// Audit indexes
		index(`idx_${orgMemberOrderTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberOrderTableName}_last_updated_at`).on(t.lastUpdatedAt),

		// Business logic constraints
		check(
			"total_amount_calculation",
			sql`${t.totalAmount} = ${t.subtotalAmount} - ${t.totalDiscountAmount} + ${t.totalTaxAmount}`,
		),
		check(
			"positive_amounts",
			sql`${t.subtotalAmount} >= 0 AND ${t.totalDiscountAmount} >= 0 AND ${t.totalTaxAmount} >= 0`,
		),
		check("valid_payment_timing", sql`${t.paidAt} IS NULL OR ${t.paidAt} >= ${t.orderedAt}`),
		check(
			"valid_fulfillment_timing",
			sql`${t.fulfilledAt} IS NULL OR ${t.fulfilledAt} >= ${t.orderedAt}`,
		),
	],
);

const orgMemberOrderItemTableName = `${orgMemberOrderTableName}_item`;
/**
 * Order Line Items - Detailed Order Breakdown
 *
 * @businessLogic Individual items within an order for detailed tracking
 * and future multi-item order support while maintaining current single-item
 * order compatibility for gradual feature expansion.
 */
export const orgMemberOrderItem = table(
	orgMemberOrderItemTableName,
	{
		id: textCols.id().notNull(),

		/**
		 * @orderRelation Parent order this item belongs to
		 */
		orderId: textCols
			.idFk("order_id")
			.notNull()
			.references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		/**
		 * @productDetails Product and variant for this line item
		 */
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "restrict" }),
		variantId: textCols
			.idFk("variant_id")
			.notNull()
			.references(() => orgProductVariant.id, { onDelete: "restrict" }),

		/**
		 * @paymentStrategy Payment plan selected for purchase
		 * @accessControl Payment plan determines content access level and billing
		 * @businessRule Payment plan must be available for the selected variant
		 */
		paymentPlanId: textCols
			.idFk("payment_plan_id")
			.notNull()
			.references(() => orgProductVariantPaymentPlan.id, {
				onDelete: "restrict",
			}),
		/**
		 * @tierSelection Customer-selected access tier provided by payment plan limits
		 * @contentGating Determines which content customer can access
		 */
		selectedAccessTier: integer("selected_access_tier").notNull(),

		/**
		 * @pricingSnapshot Pricing at time of order (for historical accuracy)
		 */
		unitPrice: numericCols.currency.amount("unit_price").notNull(),
		quantity: integer("quantity").notNull().default(1),
		subtotal: numericCols.currency.amount("subtotal").notNull(),
		totalPrice: numericCols.currency.amount("total_price").notNull(),

		// Storing the payment plan specific details in a `metadata` column
		// or using a separate relation table for complex plans in  a CTI way passed on the `orgProductVariantPaymentTypeEnum`?
		/**
		 * @orderMetadata Additional item-specific information
		 * @businessRule Used for customer service and order management
		 */
		metadata: textCols.metadata(),

		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		index(`idx_${orgMemberOrderItemTableName}_order_id`).on(t.orderId),
		index(`idx_${orgMemberOrderItemTableName}_product_id_variant_id`).on(t.productId, t.variantId),
		index(`idx_${orgMemberOrderItemTableName}_payment_plan_id`).on(t.paymentPlanId),

		// Business constraints
		check("positive_quantity", sql`${t.quantity} > 0`),
		check("total_price_calculation", sql`${t.totalPrice} = ${t.unitPrice} * ${t.quantity}`),
		check("valid_access_tier", sql`${t.selectedAccessTier} >= 0`),
	],
);

const orgMemberOrderDiscountTableName = `${orgMemberOrderTableName}_discount`;

// TODO: orgMemberOrderDiscount but for order item?
/**
 * Order Discount Applications - Promotional Campaign Tracking
 *
 * @businessLogic Links orders to applied discounts for audit trail
 * and revenue attribution while supporting multiple discount stacking.
 */
export const orgMemberOrderDiscount = table(
	orgMemberOrderDiscountTableName,
	{
		id: textCols.id().notNull(),

		orderId: textCols
			.idFk("order_id")
			.notNull()
			.references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		/**
		 * @discountSources Multiple discount types can be applied
		 */
		discountId: textCols
			.idFk("discount_id")
			.references(() => orgDiscount.id, { onDelete: "set null" }),
		couponId: textCols.idFk("coupon_id").references(() => orgCoupon.id, { onDelete: "set null" }),
		giftCardId: textCols
			.idFk("gift_card_id")
			.references(() => orgGiftCard.id, { onDelete: "set null" }),

		/**
		 * @discountImpact Amount discounted by this application
		 */
		discountAmount: numericCols.currency.amount("discount_amount").notNull(),
		discountType: textCols.category("discount_type").notNull(), // "percentage", "fixed", "gift_card"

		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		index(`idx_${orgMemberOrderDiscountTableName}_order_item_id`).on(t.orderId),
		index(`idx_${orgMemberOrderDiscountTableName}_discount_id`).on(t.discountId),
		index(`idx_${orgMemberOrderDiscountTableName}_coupon_id`).on(t.couponId),
		index(`idx_${orgMemberOrderDiscountTableName}_gift_card_id`).on(t.giftCardId),

		// Business constraints
		check("positive_discount", sql`${t.discountAmount} >= 0`),
		check(
			"single_discount_source",
			sql`(${t.discountId} IS NOT NULL)::int + (${t.couponId} IS NOT NULL)::int + (${t.giftCardId} IS NOT NULL)::int = 1`,
		),
	],
);

const orgMemberOrderTaxCalculationTableName = `${orgMemberOrderTableName}_tax_calculation`;

export const taxCalculationMethodEnum = pgEnum("tax_calculation_method", [
	"inclusive", // Tax included in displayed price (common in EU)
	"exclusive", // Tax added to displayed price (common in US)
	"exempt", // Tax exempt transaction
]);

// Q: Add a nullable productVariantId or a new table for variant-specific tax rates?
/**
 * Order Tax Calculation - Historical Tax Accuracy & Compliance
 *
 * @auditCompliance Preserves exact tax calculation for legal compliance
 * @historicalAccuracy Tax rates change over time, orders must maintain original calculation
 * @disputeResolution Enables recreation of tax calculation for customer service
 */
export const orgMemberOrderTaxCalculation = table(
	orgMemberOrderTaxCalculationTableName,
	{
		id: textCols.id().notNull(),

		/**
		 * @orderRelation Parent order this tax calculation belongs to
		 */
		orderId: textCols
			.idFk("order_id")
			.notNull()
			.references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		taxRateSnapshotId: textCols
			.idFk("tax_rate_snapshot_id")
			.references(() => orgTaxRateSnapshot.id, { onDelete: "set null" }),

		taxableAmount: numericCols.currency.amount("taxable_amount").notNull(), // Amount subject to tax (pre-tax)
		calculatedTaxAmount: numericCols.currency.amount("calculated_tax_amount").notNull(), // Actual tax calculated for this order

		// Calculation verification
		/**
		 * @calculationMethod How tax was calculated
		 * @businessLogic "inclusive" (price includes tax) vs "exclusive" (tax added to price)
		 */
		calculationMethod: taxCalculationMethodEnum("calculation_method").notNull(),
		appliedRate: numericCols.percentage.rate("applied_rate").notNull(), // Snapshot of rate used

		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		index(`idx_${orgMemberOrderTaxCalculationTableName}_order_id`).on(t.orderId),
		index(`idx_${orgMemberOrderTaxCalculationTableName}_tax_rate_snapshot_id`).on(
			t.taxRateSnapshotId,
		),
		// index(`idx_${orgMemberOrderTaxCalculationTableName}_rate`).on(t.taxRate),
		// index(`idx_${orgMemberOrderTaxCalculationTableName}_jurisdiction`).on(t.taxJurisdiction),

		// // Business constraints
		// // check("positive_amounts", sql`${t.taxableAmount} >= 0 AND ${t.calculatedTaxAmount} >= 0`),
	],
);

const orgMemberOrderPaymentTableName = `${orgMemberOrderTableName}_payment`;

export const paymentGatewayEnum = pgEnum("payment_gateway", [
	// "stripe",
	// "paypal",
	// "square",
	// "braintree",
	// "authorize_net",
	// "razorpay",
	// "mollie",
	"paymob",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
	"credit_card",
	"debit_card",
	"paypal",
	"apple_pay",
	"google_pay",
	"bank_transfer",
	"crypto",
	"gift_card",
	"store_credit",
]);

export const paymentTransactionStatusEnum = pgEnum("payment_transaction_status", [
	"pending",
	"authorized",
	"captured",
	"settled",
	"failed",
	"cancelled",
	"refunded",
	"disputed",
	"chargeback",
]);

/**
 * Order Payment Details - Complete Payment Transaction Record
 *
 * @paymentTracking Detailed payment information for reconciliation
 * @gatewayIntegration Links to external payment processors
 * @feeTracking Captures payment processing costs for accurate revenue calculation
 */
export const orgMemberOrderPayment = table(
	orgMemberOrderPaymentTableName,
	{
		id: textCols.id().notNull(),

		orderId: textCols
			.idFk("order_id")
			.notNull()
			.references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		/**
		 * @paymentGateway Payment processor used
		 */
		paymentGateway: paymentGatewayEnum("payment_gateway").notNull(),
		paymentMethod: paymentMethodEnum("payment_method").notNull(),

		/**
		 * @transactionTracking External payment processor IDs
		 */
		gatewayTransactionId: textCols.code("gateway_transaction_id").notNull(),
		gatewayPaymentIntentId: textCols.code("gateway_payment_intent_id"),

		/**
		 * @financialDetails Payment amounts and fees
		 */
		grossAmount: numericCols.currency.amount("gross_amount").notNull(), // What customer paid
		processingFee: numericCols.currency.amount("processing_fee").default("0.00"), // Gateway fee
		netAmount: numericCols.currency.amount("net_amount").notNull(), // What org receives

		/**
		 * @paymentTiming Critical payment timestamps
		 */
		authorizedAt: temporalCols.financial.paidAt("authorized_at"),
		capturedAt: temporalCols.financial.paidAt("captured_at"),
		settledAt: temporalCols.financial.paidAt("settled_at"),

		/**
		 * @paymentStatus Detailed payment state
		 */
		status: paymentTransactionStatusEnum("status").notNull().default("pending"),

		/**
		 * @disputeTracking Chargeback and dispute information
		 */
		disputedAt: temporalCols.financial.paidAt("disputed_at"),
		disputeReason: textCols.category("dispute_reason"),

		/**
		 * @gatewayResponse Raw payment gateway response for debugging
		 */
		gatewayResponse: jsonb("gateway_response"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${orgMemberOrderPaymentTableName}_order_id`).on(t.orderId),
		index(`idx_${orgMemberOrderPaymentTableName}_gateway_transaction`).on(t.gatewayTransactionId),
		index(`idx_${orgMemberOrderPaymentTableName}_status`).on(t.status),
		index(`idx_${orgMemberOrderPaymentTableName}_gateway`).on(t.paymentGateway),
		index(`idx_${orgMemberOrderPaymentTableName}_method`).on(t.paymentMethod),
		index(`idx_${orgMemberOrderPaymentTableName}_authorized_at`).on(t.authorizedAt),
		index(`idx_${orgMemberOrderPaymentTableName}_captured_at`).on(t.capturedAt),
		index(`idx_${orgMemberOrderPaymentTableName}_settled_at`).on(t.settledAt),
		index(`idx_${orgMemberOrderPaymentTableName}_disputed_at`).on(t.disputedAt),
		index(`idx_${orgMemberOrderPaymentTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberOrderPaymentTableName}_last_updated_at`).on(t.lastUpdatedAt),

		// Business constraints
		check("amount_calculation", sql`${t.netAmount} = ${t.grossAmount} - ${t.processingFee}`),
		check("positive_amounts", sql`${t.grossAmount} >= 0 AND ${t.processingFee} >= 0`),
	],
);

// TODO: add a log specific table for order payment
