import { date, pgEnum } from "drizzle-orm/pg-core";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	userJobProfileIdFkCol,
	userJobProfileIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { multiIndexes } from "#db/schema/_utils/helpers.js";
import { table } from "../../../../_utils/tables.js";
import { orgEmployeeTableName } from "../_utils/index.js";

const orgEmployeeInvitationTableName = `${orgEmployeeTableName}_invitation`;
export const orgEmployeeInvitationStatusEnum = pgEnum(`${orgEmployeeInvitationTableName}_status`, [
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
		createdAt: temporalCols.audit.createdAt(),
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
