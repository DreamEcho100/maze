import { boolean, pgEnum } from "drizzle-orm/pg-core";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import { userJobProfileIdFkCol } from "#schema/_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import { temporalCols } from "#schema/_utils/cols/temporal.js";
import { textCols } from "#schema/_utils/cols/text.js";
import { multiForeignKeys, uniqueIndex } from "#schema/_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { orgEmployeeTableName } from "./_utils/index.js";

// - **`orgEmployee`** = Staff/professional role (creates content, gets revenue attribution)
// - Departments/teams are work structure for staff only
// **Every employee is also a member** (they can still enroll in courses, place orders), but **not every member is an employee**. This creates a clear hierarchy:
// ```
// User → Member (customer/learner) → [Optional] Employee (staff/creator)
// ```
// - **Members** place orders and enroll in courses
// - **Employees** create content and receive revenue attribution through their job profiles

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
		id: textCols.idPk().notNull(),

		orgId: orgIdFkCol().notNull(),
		// This will be gated and validated on the API level to ensure only org employees can be employees
		// For example
		// - The user must be a member of the org.
		// - The user must have the necessary permissions to be an employee.
		// - The user must not already be an employee. _(Q: should this be enforced?)_
		// - The user must not be suspended or removed from the org.
		// - The user must not have an existing employee record.
		memberId: orgMemberIdFkCol().notNull(),
		// - The job profile connection/join will be validated to ensure it's from the employee user job profiles.
		jobProfileId: userJobProfileIdFkCol(),

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
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgEmployeeTableName,
			cols,
		}),
		...orgMemberIdFkExtraConfig({
			tName: orgEmployeeTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgEmployeeTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [cols.invitedById],
					foreignColumns: [cols.id],
					afterBuild: (fk) => fk.onDelete("set null"),
				},
			],
		}),
		uniqueIndex({
			tName: orgEmployeeTableName,
			cols: [cols.orgId, cols.memberId],
		}),
		uniqueIndex({
			tName: orgEmployeeTableName,
			cols: [cols.orgId, cols.jobProfileId],
		}),
	],
);
