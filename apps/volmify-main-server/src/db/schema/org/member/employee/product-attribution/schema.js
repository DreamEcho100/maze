import { sql } from "drizzle-orm";
import { check, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { numericCols } from "#db/schema/_utils/cols/numeric.js";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { currencyCodeFkCol } from "#db/schema/general/locale-and-currency/schema.js";
import { orgIdFkCol } from "#db/schema/org/schema.js";
import { table } from "../../../../_utils/tables.js";
import { orgMemberOrderItem } from "../../../product/orders/schema.js";
import { orgProduct } from "../../../product/schema.js";
import { orgEmployeeIdFkCol } from "../_utils/fk.js";
import { orgEmployeeTableName } from "../_utils/index.js";

// -------------------------------------
// PROFESSIONAL ATTRIBUTION (CREATOR ECONOMY)
// -------------------------------------

// Member places order → Employee gets attributed revenue (different people!)
// Customer (member) → Product → Creator (employee with job profile) → Revenue

// TODO: can be manged through the org employee
// export const jobOrgAffiliationStatusEnum = pgEnum("job_org_affiliation_status", [
// 	"pending",
// 	"active",
// 	"suspended",
// 	"terminated",
// ]);

const orgEmployeeProductAttributionTableName = `${orgEmployeeTableName}_attribution`;
// TODO: Compensation in a CTI way to handle different compensation models
export const orgEmployeeProductAttributionCompensationTypeEnum = pgEnum(
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
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id),
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

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgEmployeeProductAttributionTableName}`).on(t.employeeId, t.productId),
		// Revenue share validation
		check(
			`ck_${orgEmployeeProductAttributionTableName}_valid_revenue_share`,
			sql`${t.revenueSharePercentage} IS NULL OR (${t.revenueSharePercentage} >= 0 AND ${t.revenueSharePercentage} <= 100)`,
		),
		// Compensation type consistency
		check(
			`ck_${orgEmployeeProductAttributionTableName}_compensation_consistency`,
			sql`
        (${t.compensationType} = 'revenue_share' AND ${t.revenueSharePercentage} IS NOT NULL) OR
        (${t.compensationType} != 'revenue_share' AND ${t.compensationAmount} IS NOT NULL)
      `,
		),
		index(`idx_${orgEmployeeProductAttributionTableName}_employee_id`).on(t.employeeId),
		index(`idx_${orgEmployeeProductAttributionTableName}_product_id`).on(t.productId),
		index(`idx_${orgEmployeeProductAttributionTableName}_org_id`).on(t.orgId),
		// index(
		// 	`idx_${orgEmployeeProductAttributionTableName}_order_id`,
		// ).on(t.orderId),
		index(`idx_${orgEmployeeProductAttributionTableName}_compensation_type`).on(t.compensationType),
		index(`idx_${orgEmployeeProductAttributionTableName}_compensation_amount`).on(
			t.compensationAmount,
		),
		index(`idx_${orgEmployeeProductAttributionTableName}_revenue_share_percentage`).on(
			t.revenueSharePercentage,
		),
		index(`idx_${orgEmployeeProductAttributionTableName}_revenue_amount`).on(t.revenueAmount),
		index(`idx_${orgEmployeeProductAttributionTableName}_share_percentage`).on(t.sharePercentage),
		index(`idx_${orgEmployeeProductAttributionTableName}_last_paid_at`).on(t.lastPaidAt),
		index(`idx_${orgEmployeeProductAttributionTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgEmployeeProductAttributionTableName}_last_updated_at`).on(t.lastUpdatedAt),

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
	],
);

const orgEmployeeProductAttributionRevenueTableName = `${orgEmployeeProductAttributionTableName}_revenue`;
export const orgEmployeeProductAttributionRevenueRecipientTypeEnum = pgEnum(
	`${orgEmployeeProductAttributionRevenueTableName}_recipient_type`,
	[
		"organization", // Org receives revenue
		"job", // Creator/job receives revenue
		"platform", // Platform fee
		"payment_processor", // Gateway processing fee
		"tax_authority", // Tax amount
	],
);

export const orgEmployeeProductAttributionRevenueBasisEnum = pgEnum(
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

		orderItemId: textCols
			.idFk("order_item_id")
			.notNull()
			.references(() => orgMemberOrderItem.id, { onDelete: "cascade" }),

		/**
		 * @revenueRecipient Who receives this revenue portion
		 */
		recipientType:
			orgEmployeeProductAttributionRevenueRecipientTypeEnum("recipient_type").notNull(), // TODO: Needs another way for flexible recipient identification, for example could user profile be changed a profile table and in CTI way define if it's for an org or a user _(it seems to be over-engineering though)_? or maybe just make a separate table for org attribution _(maybe also change how the product connect to the orgs or have secondary/affiliated orgs)_?
		// orgId: textCols.idFk("org_id").references(() => org.id),
		attributedEmployeeId: textCols
			.idFk("attributed_employee_id")
			.references(() => orgEmployeeProductAttribution.id)
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

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${orgEmployeeProductAttributionRevenueTableName}_order_item_id`).on(t.orderItemId),
		index(`idx_${orgEmployeeProductAttributionRevenueTableName}_recipient_type`).on(
			t.recipientType,
		),
		// index(
		// 	`idx_${orgEmployeeProductAttributionRevenueTableName}_org_id`,
		// ).on(t.orgId),
		index(`idx_${orgEmployeeProductAttributionRevenueTableName}_attributed_employee_id`).on(
			t.attributedEmployeeId,
		),

		// Business constraints
		check(
			`ck_${orgEmployeeProductAttributionRevenueTableName}_positive_revenue`,
			sql`${t.revenueAmount} >= 0`,
		),
		check(
			`ck_${orgEmployeeProductAttributionRevenueTableName}_valid_percentage`,
			sql`${t.revenuePercentage} IS NULL OR (${t.revenuePercentage} >= 0 AND ${t.revenuePercentage} <= 100)`,
		),
		// check(
		// 	`ck_${orgEmployeeProductAttributionRevenueTableName}_single_recipient`,
		// 	sql`(${t.orgId} IS NOT NULL)::int + (${t.attributedEmployeeId} IS NOT NULL)::int + (${t.platformRecipient} IS NOT NULL)::int = 1`,
		// ),
	],
);
