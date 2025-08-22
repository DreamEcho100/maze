// ## org -> product -> approval-revenue-and-attribution

import { sql } from "drizzle-orm";
import { decimal, jsonb } from "drizzle-orm/pg-core";
import { numericCols } from "../../../_utils/cols/numeric.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import {
	check,
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../../_utils/helpers.js";
import { table, tEnum } from "../../../_utils/tables.js";
import { currencyCodeFkCol, currencyCodeFkExtraConfig } from "../../../0-local/0_utils/index.js";
import { orgEmployee } from "../../../schema.js";
import { orgIdFkCol } from "../../0_utils/index.js";
import { orgEmployeeTableName } from "../../1-member-and-employee/employee/_utils/index.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../1-member-and-employee/employee/0_utils/index.js";
import { orgBrand } from "../../3-brand/schema.js";
import { orgMemberOrderItem } from "../../6-orders/schema.js";
import { orgProductTableName } from "../_utils/index.js";
import { orgProduct } from "../00-schema.js";

// ### org -> product -> approval-revenue-and-attribution -> employee attribution
const orgEmployeeProductAttributionTableName = `${orgEmployeeTableName}_attribution`;
// TODO: Compensation in a CTI way to handle different compensation models
export const orgEmployeeProductAttributionCompensationTypeEnum = tEnum(
	`${orgEmployeeProductAttributionTableName}_compensation_type`,
	["revenue_share", "flat_fee", "hourly", "salary", "per_course", "none"],
);
/**
 *  Attribution Tracking
 *
 * @businessLogic Attribution attribution for  course creators
 */
export const orgEmployeeProductAttribution = table(
	orgEmployeeProductAttributionTableName,
	{
		id: textCols.idPk().notNull(),
		// ✅ BENEFIT: Clear professional context for attribution
		// "This course revenue goes to John's job profile"
		// NOTE: The relationship between org, employee, and product will be enforced at the API level
		// Q: connect with `employeeId` field or with a compound primary key of `userProfileId` and `orgEmployeeId`?
		employeeId: orgEmployeeIdFkCol().notNull(),
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id),
		orgId: orgIdFkCol().notNull(),
		// // Connect to order/transaction tables when implemented
		// orderId: textCols
		// 	.idFk("order_id")
		// 	.references(() => orgEmployeeProductOrder.id),

		compensationType:
			orgEmployeeProductAttributionCompensationTypeEnum("compensation_type").default(
				"revenue_share",
			),
		/**
		 * compensationAmount: The fixed amount paid to the employee for their contribution, regardless of product revenue.
		 * Used for "flat_fee", "hourly", "salary", "per_course" compensation types.
		 */
		compensationAmount: numericCols.currency.amount("compensation_amount"),
		// Q: is having both `revenueSharePercentage` and `sharePercentage` fields redundant?
		/**
		 * revenueSharePercentage: The percentage of the product's revenue that the employee is entitled to.
		 * Used for "revenue_share" compensation type.
		 */
		revenueSharePercentage: numericCols.percentage.revenueShare("revenue_share_percentage"),
		// Q: is `revenueAmount` the actual revenue amount attributed to the employee for a given period or payout?
		// And is it needed if we have `revenueSharePercentage` or `sharePercentage`?
		/**
		 * revenueAmount: The actual revenue amount attributed to the employee for a given period or payout.
		 * This is a calculated value, not a configuration.
		 */
		revenueAmount: numericCols.currency.amount("revenue_amount"),
		/**
		 * sharePercentage: The employee's share of the attribution pool for the product (may differ from revenueSharePercentage if multiple attribution rules apply).
		 * Used for splitting attribution among multiple employees.
		 */
		sharePercentage: numericCols.percentage.revenueShare("share_percentage"),
		lastPaidAt: temporalCols.financial.paidAt(),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// Revenue share validation
		check({
			tName: orgEmployeeProductAttributionTableName,
			postfix: "valid_revenue_share",
			condition: sql`${cols.revenueSharePercentage} IS NULL OR (${cols.revenueSharePercentage} >= 0 AND ${cols.revenueSharePercentage} <= 100)`,
		}),
		// Compensation type consistency
		check({
			tName: orgEmployeeProductAttributionTableName,
			postfix: "compensation_consistency",
			condition: sql`
				(${cols.compensationType} = 'revenue_share' AND ${cols.revenueSharePercentage} IS NOT NULL) OR
				(${cols.compensationType} != 'revenue_share' AND ${cols.compensationAmount} IS NOT NULL)
				`,
		}),

		// NOTE: The relationship between org, employee, and product will be enforced at the API level
		// // ✅ CONSTRAINT: Ensure employee and product belong to same org
		// check(`ck_${orgEmployeeProductAttributionTableName}_employee_product_org_consistency`,
		//   sql`EXISTS(
		//     SELECT 1 FROM ${orgEmployeeTableName} m
		//     JOIN ${orgEmployeeTableName} om ON m.org_employee_id = om.id
		//     WHERE m.id = ${t.employeeId}
		//     AND om.org_id = ${t.orgId}
		//   ) AND EXISTS(
		//     SELECT 1 FROM ${orgProductTableName} p
		//     WHERE p.id = ${t.productId}
		//     AND p.org_id = ${t.orgId}
		//   )`
		// ),
		// // ✅ CONSTRAINT: Ensure active employee
		// check(`ck_${orgEmployeeProductAttributionTableName}_active_employee_required`,
		//   sql`EXISTS(
		//     SELECT 1 FROM ${orgEmployeeTableName} m
		//     WHERE m.id = ${t.employeeId}
		//     AND m.approved_at IS NOT NULL
		//     AND m.left_at IS NULL
		//   )`
		// ),
		...orgEmployeeIdFkExtraConfig({
			tName: orgEmployeeProductAttributionTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgEmployeeProductAttributionTableName,
			fkGroups: [
				{
					cols: [cols.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgEmployeeProductAttributionTableName,
			cols: [cols.employeeId, cols.productId],
		}),
		...multiIndexes({
			tName: orgEmployeeProductAttributionTableName,
			colsGrps: [
				{ cols: [cols.compensationType] },
				{ cols: [cols.revenueSharePercentage] },
				{ cols: [cols.sharePercentage] },
			],
		}),
	],
);

const orgEmployeeProductAttributionRevenueTableName = `${orgEmployeeProductAttributionTableName}_revenue`;
export const orgEmployeeProductAttributionRevenueRecipientTypeEnum = tEnum(
	`${orgEmployeeProductAttributionRevenueTableName}_recipient_type`,
	[
		"organization", // Org receives revenue
		"job", // Creator/job receives revenue
		"platform", // Platform fee
		"payment_processor", // Gateway processing fee
		"tax_authority", // Tax amount
	],
);

export const orgEmployeeProductAttributionRevenueBasisEnum = tEnum(
	`${orgEmployeeProductAttributionRevenueTableName}_basis`,
	[
		"product_ownership", // Product creator
		"job_attribution", // Course job
		"org_commission", // Organization commission
		"platform_fee", // Platform service fee
		"processing_fee", // Payment processing
		"referral_commission", // Referral program
	],
);
export const orgEmployeeProductAttributionRevenue = table(
	orgEmployeeProductAttributionRevenueTableName,
	{
		id: textCols.idPk().notNull(),

		orderItemId: textCols.idFk("order_item_id").notNull(),
		// .references(() => orgMemberOrderItem.id, { onDelete: "cascade" }),

		/**
		 * @revenueRecipient Who receives this revenue portion
		 */
		recipientType:
			orgEmployeeProductAttributionRevenueRecipientTypeEnum("recipient_type").notNull(), // TODO: Needs another way for flexible recipient identification, for example could user profile be changed a profile table and in CTI way define if it's for an org or a user _(it seems to be over-engineering though)_? or maybe just make a separate table for org attribution _(maybe also change how the product connect to the orgs or have secondary/affiliated orgs)_?
		// orgId: textCols.idFk("org_id").references(() => org.id),
		attributedEmployeeId: textCols
			.idFk("attributed_employee_id")
			// .references(() => orgEmployeeProductAttribution.id)
			.notNull(),
		platformRecipient: textCols.category("platform_recipient"), // "platform_fee", "processing_fee"

		/**
		 * @revenueCalculation Revenue amount and calculation details
		 */
		revenueAmount: numericCols.currency.amount("revenue_amount").notNull(),
		revenuePercentage: numericCols.percentage.revenueShare(),

		/**
		 * @attributionBasis How this revenue share was calculated
		 */
		attributionBasis: orgEmployeeProductAttributionRevenueBasisEnum("attribution_basis").notNull(),

		/**
		 * @currencyConsistency Revenue currency
		 */
		currencyCode: currencyCodeFkCol().notNull(),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...currencyCodeFkExtraConfig({
			tName: orgEmployeeProductAttributionRevenueTableName,
			cols: cols,
		}),
		...multiForeignKeys({
			tName: orgEmployeeProductAttributionRevenueTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [cols.orderItemId],
					foreignColumns: [orgMemberOrderItem.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.attributedEmployeeId],
					foreignColumns: [orgEmployee.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		check({
			tName: orgEmployeeProductAttributionRevenueTableName,
			postfix: "positive_revenue",
			condition: sql`${cols.revenueAmount} >= 0`,
		}),
		check({
			tName: orgEmployeeProductAttributionRevenueTableName,
			postfix: "valid_percentage",
			condition: sql`${cols.revenuePercentage} IS NULL OR (${cols.revenuePercentage} >= 0 AND ${cols.revenuePercentage} <= 100)`,
		}),
		// check(
		// 	`ck_${orgEmployeeProductAttributionRevenueTableName}_single_recipient`,
		// 	sql`(${t.orgId} IS NOT NULL)::int + (${t.attributedEmployeeId} IS NOT NULL)::int + (${t.platformRecipient} IS NOT NULL)::int = 1`,
		// ),
		...multiIndexes({
			tName: orgEmployeeProductAttributionRevenueTableName,
			colsGrps: [
				{ cols: [cols.recipientType] },
				{ cols: [cols.platformRecipient] },
				{ cols: [cols.revenueAmount] },
				{ cols: [cols.revenuePercentage] },
				{ cols: [cols.attributionBasis] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
// --- org -> product -> approval-revenue-and-attribution -> employee attribution

// ### org -> product -> approval-revenue-and-attribution -> brand attribution
const orgProductBrandTableName = `${orgProductTableName}_brand_attribution`;
/**
 * Product Brand Attribution - Org Brand Identity Integration
 *
 * @businessLogic Links products to org brand identity for consistent marketing
 * and brand presentation across product catalogs. Supports orgs with multiple
 * brands or white-label scenarios where products need clear brand attribution for
 * customer recognition and marketing consistency.
 *
 * @brandStrategy Enables orgs to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing campaigns, customer communication,
 * and brand identity consistency across diverse product catalogs.
 *
 * @orgScope Brand attribution operates within org boundaries enabling
 * sophisticated brand management strategies while maintaining multi-tenant isolation and
 * org control over brand identity and product presentation.
 *
 * @marketingIntegration Brand attribution integrates with product marketing, promotional
 * campaigns, and customer communication to ensure consistent brand presentation and
 * customer experience across all product touchpoints and marketing channels.
 */
export const orgProductBrandAttribution = table(
	orgProductBrandTableName,
	{
		/**
		 * @brandIdentity Org brand this product is attributed to
		 * @businessRule Links product presentation to specific org brand identity
		 * @marketingStrategy Enables consistent brand presentation across product catalog
		 */
		brandId: textCols.idFk("brand_id").notNull(),
		// .references(() => orgBrand.id),

		/**
		 * @productAttribution Product this brand attribution applies to
		 * @businessRule Links brand identity to specific product for marketing consistency
		 * @customerExperience Ensures consistent brand presentation in product discovery
		 */
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "cascade" }),

		// /**
		//  * @brandHierarchy Primary brand attribution for main brand presentation
		//  * @businessRule One primary brand per product for clear customer brand recognition
		//  * @marketingStrategy Primary brand used in product marketing and customer communication
		//  */
		// isPrimary: boolean("is_primary").default(true),

		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgProductBrandTableName,
			cols: [cols.brandId, cols.productId],
		}),
		...multiForeignKeys({
			tName: orgProductBrandTableName,
			fkGroups: [
				{
					cols: [cols.brandId],
					foreignColumns: [orgBrand.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgProductBrandTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
	],
);
// --- org -> product -> approval-revenue-and-attribution -> brand attribution

// ### org -> product -> approval-revenue-and-attribution -> revenue pool
// Q: The revenue pool for products or for product variants or for the products variants payment plans?
const orgProductRevenuePoolTableName = `${orgProductTableName}_revenue_pool`;
export const orgProductRevenuePool = table(
	orgProductRevenuePoolTableName,
	{
		// id: textCols.idPk().notNull(),
		productId: textCols
			.idFk("product_id")
			.primaryKey()
			// .references(() => orgProduct.id)
			.notNull(),
		totalAllocatedPercentage: decimal("total_allocated_percentage", {
			precision: 5,
			scale: 2,
		}).default("0.00"),
		remainingPercentage: decimal("remaining_percentage", {
			precision: 5,
			scale: 2,
		}).default("100.00"),

		// Revenue allocation tracking
		allocationHistory: jsonb("allocation_history"), // Track changes for audit
		lastAllocationByEmployeeId: orgEmployeeIdFkCol({
			name: "last_allocation_by_employee_id",
		}),
		lastAllocationAt: temporalCols.audit.lastUpdatedAt("last_allocation_at"),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		...orgEmployeeIdFkExtraConfig({
			tName: orgProductRevenuePoolTableName,
			cols: t,
			colFkKey: "lastAllocationByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgProductRevenuePoolTableName,
			fkGroups: [
				{
					cols: [t.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		check({
			tName: orgProductRevenuePoolTableName,
			postfix: "valid_percentages",
			condition: sql`${t.totalAllocatedPercentage} + ${t.remainingPercentage} = 100`,
		}),
		check({
			tName: orgProductRevenuePoolTableName,
			postfix: "non_negative_remaining",
			condition: sql`${t.remainingPercentage} >= 0`,
		}),
		check({
			tName: orgProductRevenuePoolTableName,
			postfix: "valid_allocated_range",
			condition: sql`${t.totalAllocatedPercentage} >= 0 AND ${t.totalAllocatedPercentage} <= 100`,
		}),
		...multiIndexes({
			tName: orgProductRevenuePoolTableName,
			colsGrps: [
				{ cols: [t.totalAllocatedPercentage] },
				{ cols: [t.remainingPercentage] },
				{ cols: [t.lastAllocationAt] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
			],
		}),
	],
);
// --- org -> product -> approval-revenue-and-attribution -> revenue pool

// ### org -> product -> approval-revenue-and-attribution -> approval
const orgProductApprovalTableName = `${orgProductTableName}_approval`;
export const orgProductApprovalStatusEnum = tEnum(`${orgProductApprovalTableName}_status`, [
	"pending", // Awaiting review
	"approved", // Approved by reviewer
	"rejected", // Rejected with comments
]);
/**
 * @module ProductApproval
 * @domain Human-based review and compliance enforcement for user-created content
 *
 * @description Supports course drafts, rejection comments, and admin flow.
 */
export const orgProductApproval = table(
	orgProductApprovalTableName,
	{
		id: textCols.idPk().notNull(),

		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id),
		submittedByEmployeeId: orgEmployeeIdFkCol({
			name: "submitted_by_employee_id",
		}).notNull(),
		reviewedByEmployeeId: orgEmployeeIdFkCol({
			name: "reviewed_by_employee_id",
		}),

		status: orgProductApprovalStatusEnum("status").default("pending"),

		notes: textCols.description("notes"), // Reviewer comments or feedback
		reviewedAt: temporalCols.business.reviewedAt("reviewed_at").notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...orgEmployeeIdFkExtraConfig({
			tName: orgProductApprovalTableName,
			cols,
			colFkKey: "submittedByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgProductApprovalTableName,
			fkGroups: [
				{
					cols: [cols.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgProductApprovalTableName,
			colsGrps: [
				{ cols: [cols.productId, cols.status] },
				{ cols: [cols.submittedByEmployeeId, cols.status] },
				{ cols: [cols.reviewedByEmployeeId, cols.status] },
				{ cols: [cols.reviewedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
// --- org -> product -> approval-revenue-and-attribution -> approval

// -- org -> product -> approval-revenue-and-attribution
