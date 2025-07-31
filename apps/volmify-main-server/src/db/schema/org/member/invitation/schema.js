import { index, pgEnum, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { orgIdFkCol } from "#db/schema/org/schema.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
import { orgMemberIdFkCol } from "../_utils/fk.js";
import { orgMemberTableName } from "../_utils/index.js";
import { orgMemberBaseRoleEnum } from "../schema.js";

export const orgMemberInvitationStatusEnum = pgEnum(`${orgMemberTableName}_invitation_status`, [
	"pending", // Awaiting response
	"accepted", // Member joined org
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
]);

export const invitationTypeEnum = pgEnum("invitation_type", [
	"learner",
	"customer",
	"community_member",
]);

/**
 * Member Invitation Table
 *
 * @abacRole Pre-Membership Identity Provisioning
 * Handles invitation issuance and acceptance into the ABAC org model.
 */
export const orgMemberInvitation = table(
	`${orgMemberTableName}_invitation`,
	{
		id: textCols.id().notNull(),
		orgId: orgIdFkCol().notNull(),
		email: varchar("email", { length: 256 }).notNull(),

		// Customer invitation context
		invitationType: invitationTypeEnum("type").default("learner"),
		welcomeMessage: textCols.shortDescription("welcome_message"),

		// TODO:
		// // Course/product access (optional)
		// grantedCourseAccess: text("granted_course_access").array(),

		invitedByMemberId: orgMemberIdFkCol("invited_by_member_id").notNull(), // Any member can invite customers
		status: orgMemberInvitationStatusEnum("status").default("pending"),
		expiresAt: temporalCols.business.expiresAt().notNull(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		role: orgMemberBaseRoleEnum("role").notNull().default("member"),
		acceptedAt: temporalCols.activity.acceptedAt(),
		declinedAt: temporalCols.activity.declinedAt(),
		memberId: orgMemberIdFkCol(),
		// TODO: is this needed
		// userId: textCols.idFk("user_id").references(() => user.id),
		// invitedByEmployeeId: orgEmployeeIdFkCol("invited_by_employee_id")
	},
	(t) => {
		const base = `${orgMemberTableName}_invitation`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_expires_at`).on(t.expiresAt),
			index(`idx_${base}_email`).on(t.email),
			index(`idx_${base}_invited_by_member_id`).on(t.invitedByMemberId),
			index(`idx_${base}_org_id`).on(t.orgId),
			uniqueIndex(`uq_${base}_email_org`).on(t.email, t.orgId),
		];
	},
);
