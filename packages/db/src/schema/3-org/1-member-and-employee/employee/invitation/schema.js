import { date } from "drizzle-orm/pg-core";
import { temporalCols } from "../../../../_utils/cols/temporal.js";
import { textCols } from "../../../../_utils/cols/text.js";
import { multiIndexes } from "../../../../_utils/helpers.js";
import { table, tEnum } from "../../../../_utils/tables.js";
import { userJobProfileIdFkCol, userJobProfileIdFkExtraConfig } from "../../../../schema.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../0_utils/index.js";
import { orgEmployeeTableName } from "../_utils/index.js";
import { orgEmployeeIdFkCol, orgEmployeeIdFkExtraConfig } from "../0_utils/index.js";

// #### org -> member -> employee -> invitation
const orgEmployeeInvitationTableName = `${orgEmployeeTableName}_invitation`;
export const orgEmployeeInvitationStatusEnum = tEnum(`${orgEmployeeInvitationTableName}_status`, [
	"pending", // Awaiting response
	"under_review",
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
	// Q: What does it mean for an invitation to be approved or accepted?
	"approved", //
	"accepted", // Employee joined org
]);

export const orgEmployeeInvitation = table(
	orgEmployeeInvitationTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		email: textCols.emailAddress("email").notNull(),

		// Professional invitation context
		// TODO
		// proposedRole: orgEmployeeRoleEnum("proposed_role").notNull(), // "instructor", "admin", "manager"
		jobProfileId: userJobProfileIdFkCol(), // .references(() => userJobProfile.userProfileId),

		// Employment details
		// TODO:
		// proposedSalary: decimal("proposed_salary", { precision: 12, scale: 2 }),
		startDate: date("proposed_start_date"),
		// departments, status in department
		// departmentId: textCols.idFk("department_id").references(() => orgDepartment.id),
		// teams, status in team
		// teamId: textCols.idFk("team_id").references(() => orgTeam.id),

		// Administrative approval
		invitedBy: orgEmployeeIdFkCol({ name: "invited_by" }).notNull(), // Only employees can invite employees
		approvedBy: orgEmployeeIdFkCol({ name: "approved_by" }), // Requires approval for staff roles

		status: orgEmployeeInvitationStatusEnum("status").default("pending"),
		welcomeMessage: textCols.shortDescription("welcome_message"),

		expiresAt: temporalCols.business.expiresAt().notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgEmployeeInvitationTableName,
			cols,
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgEmployeeInvitationTableName,
			cols,
			colFkKey: "invitedBy",
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgEmployeeInvitationTableName,
			cols,
			colFkKey: "approvedBy",
		}),
		...userJobProfileIdFkExtraConfig({
			tName: orgEmployeeInvitationTableName,
			cols,
			colFkKey: "jobProfileId",
		}),
		...multiIndexes({
			tName: orgEmployeeInvitationTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.email] },
				{ cols: [cols.orgId, cols.status] },
				{ cols: [cols.orgId, cols.jobProfileId] },
				{ cols: [cols.orgId, cols.expiresAt] },
			],
		}),
	],
);
// ---- org -> member -> employee -> invitation

// --- org -> member -> employee
