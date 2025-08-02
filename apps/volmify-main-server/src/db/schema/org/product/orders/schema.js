import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { currencyCodeFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/member-id.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { numericCols } from "../../../_utils/cols/numeric.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
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
		id: textCols.idPk().notNull(),

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
		orgId: orgIdFkCol().notNull(),

		/**
		 * @customerIdentity Org member placing the order
		 * @accessControl Primary identity for content access after purchase
		 * @businessRule Orders can only be placed by active org members
		 */
		memberId: orgMemberIdFkCol().notNull(),

		// Q: Should it connect to the country table?
		/**
		 * @orderLifecycle Current order processing status
		 * @businessRule Determines order workflow and customer communication
		 * @accessControl Status affects content access permissions
		 */
		status: orgMemberOrderStatusEnum("status").notNull().default("pending"),

		// /**
		//  * @paymentTracking Financial transaction status for revenue management
		//  * @businessRule Independent of order status for financial clarity
		//  * @auditTrail Critical for financial reporting and dispute resolution
		//  */
		// paymentStatus: orgMemberOrderPaymentStatusEnum("payment_status").notNull().default("pending"),

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
		currencyCode: currencyCodeFkCol().notNull(),

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
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgMemberOrderTableName,
			cols,
		}),
		...orgMemberIdFkExtraConfig({
			tName: orgMemberOrderTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgMemberOrderTableName,
			cols: [cols.orgId, cols.displayId],
		}),
		...multiIndexes({
			tName: orgMemberOrderTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.status] },
				{ cols: [cols.memberId, cols.status] },
				{ cols: [cols.orgId, cols.totalAmount] },
				{ cols: [cols.orgId, cols.currencyCode] },
				{ cols: [cols.orgId, cols.orderedAt] },
				{ cols: [cols.orgId, cols.paidAt] },
				{ cols: [cols.orgId, cols.fulfilledAt] },
				{ cols: [cols.orgId, cols.externalPaymentId] },
				{ cols: [cols.orgId, cols.paymentMethod] },
				{ cols: [cols.orgId, cols.createdAt] },
				{ cols: [cols.orgId, cols.lastUpdatedAt] },
				{ cols: [cols.orgId, cols.deletedAt] },
			],
		}),

		check(
			`ck_${orgMemberOrderTableName}_total_amount_calculation`,
			sql`${cols.totalAmount} = ${cols.subtotalAmount} - ${cols.totalDiscountAmount} + ${cols.totalTaxAmount}`,
		),
		check(
			`ck_${orgMemberOrderTableName}_positive_amounts`,
			sql`${cols.subtotalAmount} >= 0 AND ${cols.totalDiscountAmount} >= 0 AND ${cols.totalTaxAmount} >= 0`,
		),
		check(
			`ck_${orgMemberOrderTableName}_valid_payment_timing`,
			sql`${cols.paidAt} IS NULL OR ${cols.paidAt} >= ${cols.orderedAt}`,
		),
		check(
			`ck_${orgMemberOrderTableName}_valid_fulfillment_timing`,
			sql`${cols.fulfilledAt} IS NULL OR ${cols.fulfilledAt} >= ${cols.orderedAt}`,
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
		id: textCols.idPk().notNull(),

		/**
		 * @orderRelation Parent order this item belongs to
		 */
		orderId: textCols.idFk("order_id").notNull(),
		// .references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		/**
		 * @productDetails Product and variant for this line item
		 */
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "restrict" }),
		variantId: textCols.idFk("variant_id").notNull(),
		// .references(() => orgProductVariant.id, { onDelete: "restrict" }),

		/**
		 * @paymentStrategy Payment plan selected for purchase
		 * @accessControl Payment plan determines content access level and billing
		 * @businessRule Payment plan must be available for the selected variant
		 */
		paymentPlanId: textCols.idFk("payment_plan_id").notNull(),
		// .references(() => orgProductVariantPaymentPlan.id, {
		// 	onDelete: "restrict",
		// }),
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
		...multiForeignKeys({
			tName: orgMemberOrderItemTableName,
			fkGroups: [
				{
					cols: [t.orderId],
					foreignColumns: [orgMemberOrder.id],
				},
				{
					cols: [t.productId],
					foreignColumns: [orgProduct.id],
				},
				{
					cols: [t.variantId],
					foreignColumns: [orgProductVariant.id],
				},
				{
					cols: [t.paymentPlanId],
					foreignColumns: [orgProductVariantPaymentPlan.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgMemberOrderItemTableName,
			colsGrps: [
				{ cols: [t.productId, t.variantId] },
				{ cols: [t.selectedAccessTier] },
				{ cols: [t.unitPrice] },
				{ cols: [t.quantity] },
				{ cols: [t.subtotal] },
				{ cols: [t.totalPrice] },
				{ cols: [t.createdAt] },
			],
		}),

		// Business constraints
		check(`ck_${orgMemberOrderItemTableName}_positive_quantity`, sql`${t.quantity} > 0`),
		check(
			`ck_${orgMemberOrderItemTableName}_total_price_calculation`,
			sql`${t.totalPrice} = ${t.unitPrice} * ${t.quantity}`,
		),
		check(`ck_${orgMemberOrderItemTableName}_valid_access_tier`, sql`${t.selectedAccessTier} >= 0`),
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
		id: textCols.idPk().notNull(),

		orderId: textCols.idFk("order_id").notNull(),
		// .references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		/**
		 * @discountSources Multiple discount types can be applied
		 */
		discountId: textCols.idFk("discount_id"),
		// .references(() => orgDiscount.id, { onDelete: "set null" }),
		couponId: textCols.idFk("coupon_id"), // .references(() => orgCoupon.id, { onDelete: "set null" }),
		giftCardId: textCols.idFk("gift_card_id"),
		// .references(() => orgGiftCard.id, { onDelete: "set null" }),

		/**
		 * @discountImpact Amount discounted by this application
		 */
		discountAmount: numericCols.currency.amount("discount_amount").notNull(),
		discountType: textCols.category("discount_type").notNull(), // "percentage", "fixed", "gift_card"

		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		...multiForeignKeys({
			tName: orgMemberOrderDiscountTableName,
			fkGroups: [
				{
					cols: [t.orderId],
					foreignColumns: [orgMemberOrder.id],
				},
				{
					cols: [t.discountId],
					foreignColumns: [orgDiscount.id],
				},
				{
					cols: [t.couponId],
					foreignColumns: [orgCoupon.id],
				},
				{
					cols: [t.giftCardId],
					foreignColumns: [orgGiftCard.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgMemberOrderDiscountTableName,
			colsGrps: [{ cols: [t.discountAmount] }, { cols: [t.discountType] }, { cols: [t.createdAt] }],
		}),

		// Business constraints
		check(`ck_${orgMemberOrderDiscountTableName}_positive_discount`, sql`${t.discountAmount} >= 0`),
		check(
			`ck_${orgMemberOrderDiscountTableName}_single_discount_source`,
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
		id: textCols.idPk().notNull(),

		/**
		 * @orderRelation Parent order this tax calculation belongs to
		 */
		orderId: textCols.idFk("order_id").notNull(),
		// .references(() => orgMemberOrder.id, { onDelete: "cascade" }),

		taxRateSnapshotId: textCols.idFk("tax_rate_snapshot_id"),
		// .references(() => orgTaxRateSnapshot.id, { onDelete: "set null" }),

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
		...multiForeignKeys({
			tName: orgMemberOrderTaxCalculationTableName,
			fkGroups: [
				{
					cols: [t.orderId],
					foreignColumns: [orgMemberOrder.id],
				},
				{
					cols: [t.taxRateSnapshotId],
					foreignColumns: [orgTaxRateSnapshot.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgMemberOrderTaxCalculationTableName,
			colsGrps: [
				{ cols: [t.taxableAmount] },
				{ cols: [t.calculatedTaxAmount] },
				{ cols: [t.calculationMethod] },
				{ cols: [t.appliedRate] },
				{ cols: [t.createdAt] },
			],
		}),

		// check("positive_amounts", sql`${t.taxableAmount} >= 0 AND ${t.calculatedTaxAmount} >= 0`),
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

// export const paymentTransactionStatusEnum = pgEnum("payment_transaction_status", [
// 	"pending",
// 	"authorized",
// 	"captured",
// 	"settled",
// 	"failed",
// 	"cancelled",
// 	"refunded",
// 	"disputed",
// 	"chargeback",
// ]);

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
		id: textCols.idPk().notNull(),

		orderId: textCols.idFk("order_id").notNull(),
		// .references(() => orgMemberOrder.id, { onDelete: "cascade" }),

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
		status: orgMemberOrderPaymentStatusEnum("status").notNull().default("pending"),

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
		...multiForeignKeys({
			tName: orgMemberOrderPaymentTableName,
			fkGroups: [
				{
					cols: [t.orderId],
					foreignColumns: [orgMemberOrder.id],
				},
			],
		}),
		uniqueIndex({
			tName: orgMemberOrderPaymentTableName,
			cols: [t.orderId, t.gatewayTransactionId],
		}),
		// Business constraints
		check(
			`ck_${orgMemberOrderPaymentTableName}_amount_calculation`,
			sql`${t.netAmount} = ${t.grossAmount} - ${t.processingFee}`,
		),
		check(
			`ck_${orgMemberOrderPaymentTableName}_positive_amounts`,
			sql`${t.grossAmount} >= 0 AND ${t.processingFee} >= 0`,
		),
		...multiIndexes({
			tName: orgMemberOrderPaymentTableName,
			colsGrps: [
				{ cols: [t.status] },
				{ cols: [t.paymentGateway] },
				{ cols: [t.paymentMethod] },
				{ cols: [t.authorizedAt] },
				{ cols: [t.capturedAt] },
				{ cols: [t.settledAt] },
				{ cols: [t.disputedAt] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
			],
		}),
	],
);

// TODO: add a log specific table for order payment
