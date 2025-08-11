import { sql } from "drizzle-orm";
import { check, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "#schema/_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol } from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import { temporalCols } from "#schema/_utils/cols/temporal.js";
import { textCols } from "#schema/_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#schema/_utils/helpers.js";
import { table } from "../../../../_utils/tables.js";
import { orgMemberOrderItem } from "../../../product/orders/schema.js";
import { orgProduct } from "../../../product/schema.js";
import { orgEmployeeTableName } from "../_utils/index.js";
import { orgEmployee } from "../schema.js";

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
		check(
			`ck_${orgEmployeeProductAttributionTableName}_valid_revenue_share`,
			sql`${cols.revenueSharePercentage} IS NULL OR (${cols.revenueSharePercentage} >= 0 AND ${cols.revenueSharePercentage} <= 100)`,
		),
		// Compensation type consistency
		check(
			`ck_${orgEmployeeProductAttributionTableName}_compensation_consistency`,
			sql`
        (${cols.compensationType} = 'revenue_share' AND ${cols.revenueSharePercentage} IS NOT NULL) OR
        (${cols.compensationType} != 'revenue_share' AND ${cols.compensationAmount} IS NOT NULL)
				`,
		),

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
		check(
			`ck_${orgEmployeeProductAttributionRevenueTableName}_positive_revenue`,
			sql`${cols.revenueAmount} >= 0`,
		),
		check(
			`ck_${orgEmployeeProductAttributionRevenueTableName}_valid_percentage`,
			sql`${cols.revenuePercentage} IS NULL OR (${cols.revenuePercentage} >= 0 AND ${cols.revenuePercentage} <= 100)`,
		),
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
