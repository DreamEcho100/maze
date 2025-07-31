import { date, pgEnum } from "drizzle-orm/pg-core";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { orgIdFkCol } from "#db/schema/org/schema.js";
import { table } from "../../../../_utils/tables.js";
import { userJobProfile } from "../../../../user/profile/job/schema";
import { orgEmployeeIdFkCol } from "../_utils/fk.js";
import { orgEmployeeTableName } from "../_utils/index.js";

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
	id: textCols.idPk().notNull(),
	orgId: orgIdFkCol().notNull(),
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
	invitedBy: orgEmployeeIdFkCol().notNull(), // Only employees can invite employees
	approvedBy: orgEmployeeIdFkCol(), // Requires approval for staff roles

	status: orgEmployeeInvitationStatusEnum("status").default("pending"),
	welcomeMessage: textCols.shortDescription("welcome_message"),

	expiresAt: temporalCols.business.expiresAt().notNull(),
	createdAt: temporalCols.audit.createdAt(),
});
