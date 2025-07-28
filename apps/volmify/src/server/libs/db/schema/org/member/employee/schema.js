import { sql } from "drizzle-orm";
import { boolean, check, date, foreignKey, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { numericCols, sharedCols, table, temporalCols, textCols } from "../../../_utils/helpers";
import { userJobProfile } from "../../../user/profile/job/schema";
import { orgTableName } from "../../_utils/helpers";
import { orgMemberOrderItem } from "../../product/orders/schema";
import { orgProduct } from "../../product/schema";
import { orgMember } from "../schema";

// - **`orgEmployee`** = Staff/professional role (creates content, gets revenue attribution)
// - Departments/teams are work structure for staff only
// **Every employee is also a member** (they can still enroll in courses, place orders), but **not every member is an employee**. This creates a clear hierarchy:
// ```
// User → Member (customer/learner) → [Optional] Employee (staff/creator)
// ```
// - **Members** place orders and enroll in courses
// - **Employees** create content and receive revenue attribution through their job profiles

const orgEmployeeTableName = `${orgTableName}_employee`;
export const orgEmployeeRoleEnum = pgEnum(`${orgEmployeeTableName}_base_role`, [
	"admin", // Org admin with full permissions
	// "manager", // Org manager with elevated permissions
	// "employee", // Regular employee with standard permissions
	// "contractor", // External contractor with limited permissions
	// "intern", // Intern with limited permissions
	// "volunteer", // Volunteer with minimal permissions
	// "guest", // Guest with very limited permissions
	// "creator", // Content creator with permissions to create and manage content
	// "instructor", // Content creator
	// "content_creator", // Digital content specialist
	// "support", // Customer support
	// "marketing", // Marketing team
	// "sales", // Sales team
	// "finance", // Finance/accounting
	// "hr", // Human resources
	// Q: What're the posable roles for an employee on an org by this project structure? _(keep in mind that it will be used for basic auth)_
]);
export const orgEmployeeStatusEnum = pgEnum(`${orgEmployeeTableName}_status`, [
	"active", // Currently employed
	"terminated", // Employment ended
	"leave", // On leave of absence
	"resigned", // Resigned from the position
	"fired", // Terminated by the organization
	"retired", // Retired from the position
	"invited", // Awaiting acceptance of invitation
	"suspended", // Temporarily suspended; cannot access org resources
	"removed", // Member removed by admin; cannot rejoin without new invite
	"pending_application", // Pending approval by org admin or who have the permission to approve employees
]);
/**
 * @module Employee
 * @description Represents an employee record for an org member. Optional, but needed for salary, HR, and certain permissions.
 */
export const orgEmployee = table(
	orgEmployeeTableName,
	{
		id: textCols.id().notNull(),

		orgId: textCols.idFk().notNull(),
		// This will be gated and validated on the API level to ensure only org employees can be employees
		// For example
		// - The user must be a member of the org.
		// - The user must have the necessary permissions to be an employee.
		// - The user must not already be an employee. _(Q: should this be enforced?)_
		// - The user must not be suspended or removed from the org.
		// - The user must not have an existing employee record.
		memberId: textCols
			.idFk()
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		// - The job profile connection/join will be validated to ensure it's from the employee user job profiles.

		jobProfileId: textCols.idFk("job_profile").references(() => userJobProfile.userProfileId, {
			onDelete: "set null",
		}),

		// Q: displayName vs professionalDisplayName
		displayName: textCols.displayName().notNull(),
		role: orgEmployeeRoleEnum("role").notNull(),

		hiredAt: temporalCols.business.hiredAt(),
		terminatedAt: temporalCols.business.terminatedAt(),
		leaveOfAbsenceAt: temporalCols.business.leaveOfAbsenceAt(),
		resignedAt: temporalCols.business.terminatedAt("resigned_at"), // Reusing terminatedAt for resigned
		firedAt: temporalCols.business.terminatedAt("fired_at"), // Reusing terminatedAt for fired
		retiredAt: temporalCols.business.terminatedAt("retired_at"), // Reusing terminatedAt for retired

		appliedAt: temporalCols.business.appliedAt(),
		approvedAt: temporalCols.business.approvedAt(),
		approvedByEmployeeId: textCols.idFk("approved_by_employee_id"),
		invitedAt: temporalCols.activity.invitedAt(),
		// .references(() => orgEmployee.id, { onDelete: "set null" }),
		// Q: inveted vs hired
		invitedById: textCols.idFk("invited_by_id"),
		// .references(() => userProfile.id),

		status: orgEmployeeStatusEnum("status").notNull().default("active"),

		isSalaried: boolean("is_salaried").default(false),
	},
	(t) => [
		foreignKey({
			columns: [t.invitedById],
			foreignColumns: [t.id],
			name: `fk_${orgEmployeeTableName}_approved_by_id`,
		}),
		uniqueIndex(`${orgEmployeeTableName}_unique`).on(t.orgId, t.memberId),
		uniqueIndex(`${orgEmployeeTableName}_job_profile_unique`).on(t.orgId, t.jobProfileId),
	],
);

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
		id: textCols.id().notNull(),
		// ✅ BENEFIT: Clear professional context for attribution
		// "This course revenue goes to John's job profile"
		// NOTE: The relationship between org, employee, and product will be enforced at the API level
		// Q: connect with `employeeId` field or with a compound primary key of `userProfileId` and `orgEmployeeId`?
		employeeId: sharedCols.orgEmployeeIdFk().notNull(),
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id),
		orgId: sharedCols.orgIdFk().notNull(),
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
			"valid_revenue_share",
			sql`${t.revenueSharePercentage} IS NULL OR (${t.revenueSharePercentage} >= 0 AND ${t.revenueSharePercentage} <= 100)`,
		),
		// Compensation type consistency
		check(
			"compensation_consistency",
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
		// check("employee_product_org_consistency",
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
		// check("active_employee_required",
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
		id: textCols.id().notNull(),

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
		currencyCode: sharedCols.currencyCodeFk().notNull(),

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
		check("positive_revenue", sql`${t.revenueAmount} >= 0`),
		check(
			"valid_percentage",
			sql`${t.revenuePercentage} IS NULL OR (${t.revenuePercentage} >= 0 AND ${t.revenuePercentage} <= 100)`,
		),
		// check(
		// 	"single_recipient",
		// 	sql`(${t.orgId} IS NOT NULL)::int + (${t.attributedEmployeeId} IS NOT NULL)::int + (${t.platformRecipient} IS NOT NULL)::int = 1`,
		// ),
	],
);

export const orgEmployeeInvitationStatusEnum = pgEnum(`${orgEmployeeTableName}_invitation_status`, [
	"pending", // Awaiting response
	"under_review",
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
	// Q: What does it mean for an invitation to be approved or accepted?
	"approved", //
	"accepted", // Employee joined org
]);

export const orgEmployeeInvitation = table("org_employee_invitation", {
	id: textCols.id().notNull(),
	orgId: sharedCols.orgIdFk().notNull(),
	email: textCols.emailAddress("email").notNull(),

	// Professional invitation context
	// TODO
	// proposedRole: orgEmployeeRoleEnum("proposed_role").notNull(), // "instructor", "admin", "manager"
	jobProfileId: textCols.idFk("job_profile_id").references(() => userJobProfile.userProfileId),

	// Employment details
	// TODO:
	// proposedSalary: decimal("proposed_salary", { precision: 12, scale: 2 }),
	startDate: date("proposed_start_date"),
	// departments, status in department
	// departmentId: textCols.idFk("department_id").references(() => orgDepartment.id),
	// teams, status in team
	// teamId: textCols.idFk("team_id").references(() => orgTeam.id),

	// Administrative approval
	invitedBy: sharedCols.orgEmployeeIdFk().notNull(), // Only employees can invite employees
	approvedBy: sharedCols.orgEmployeeIdFk(), // Requires approval for staff roles

	status: orgEmployeeInvitationStatusEnum("status").default("pending"),
	welcomeMessage: textCols.shortDescription("welcome_message"),

	expiresAt: temporalCols.business.expiresAt().notNull(),
	createdAt: temporalCols.audit.createdAt(),
});
