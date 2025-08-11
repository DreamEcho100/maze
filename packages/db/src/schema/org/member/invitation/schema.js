import { pgEnum, varchar } from "drizzle-orm/pg-core";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import { multiIndexes, uniqueIndex } from "#schema/_utils/helpers.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
import { orgMemberTableName } from "../_utils/index.js";
import { orgMemberBaseRoleEnum } from "../schema.js";

const orgMemberInvitationTableName = `${orgMemberTableName}_invitation`;
export const orgMemberInvitationStatusEnum = pgEnum(`${orgMemberInvitationTableName}_status`, [
	"pending", // Awaiting response
	"accepted", // Member joined org
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
]);

export const invitationTypeEnum = pgEnum(`${orgMemberInvitationTableName}_type`, [
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
	orgMemberInvitationTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		email: varchar("email", { length: 256 }).notNull(),

		// Customer invitation context
		invitationType: invitationTypeEnum("type").default("learner"),
		welcomeMessage: textCols.shortDescription("welcome_message"),

		// TODO:
		// // Course/product access (optional)
		// grantedCourseAccess: text("granted_course_access").array(),

		invitedByMemberId: orgMemberIdFkCol({ name: "invited_by_member_id" }).notNull(), // Any member can invite customers
		status: orgMemberInvitationStatusEnum("status").default("pending"),
		expiresAt: temporalCols.business.expiresAt().notNull(),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		role: orgMemberBaseRoleEnum("role").notNull().default("member"),
		acceptedAt: temporalCols.activity.acceptedAt(),
		declinedAt: temporalCols.activity.declinedAt(),
		memberId: orgMemberIdFkCol(),
		// TODO: is this needed
		// userId: textCols.idFk("user_id").references(() => user.id),
		// invitedByEmployeeId: orgEmployeeIdFkCol("invited_by_employee_id")
	},
	(cols) => [
		// index(`idx_${orgMemberInvitationTableName}_created_at`).on(t.createdAt),
		// index(`idx_${orgMemberInvitationTableName}_last_updated_at`).on(t.lastUpdatedAt),
		// index(`idx_${orgMemberInvitationTableName}_status`).on(t.status),
		// index(`idx_${orgMemberInvitationTableName}_expires_at`).on(t.expiresAt),
		// index(`idx_${orgMemberInvitationTableName}_email`).on(t.email),
		// index(`idx_${orgMemberInvitationTableName}_invited_by_member_id`).on(t.invitedByMemberId),
		// index(`idx_${orgMemberInvitationTableName}_org_id`).on(t.orgId),
		// uniqueIndex(`uq_${orgMemberInvitationTableName}_email_org`).on(t.email, t.orgId),
		uniqueIndex({
			tName: orgMemberInvitationTableName,
			cols: [cols.email, cols.orgId],
		}),
		...orgIdFkExtraConfig({
			tName: orgMemberInvitationTableName,
			cols,
		}),
		...orgMemberIdFkExtraConfig({
			tName: orgMemberInvitationTableName,
			cols,
			colFkKey: "invitedByMemberId",
		}),
		...multiIndexes({
			tName: orgMemberInvitationTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.email] },
				{ cols: [cols.orgId, cols.status] },
				{ cols: [cols.orgId, cols.role] },
				{ cols: [cols.orgId, cols.invitationType] },
				{ cols: [cols.orgId, cols.createdAt] },
				{ cols: [cols.orgId, cols.lastUpdatedAt] },
				{ cols: [cols.orgId, cols.expiresAt] },
				{ cols: [cols.orgId, cols.acceptedAt] },
				{ cols: [cols.orgId, cols.declinedAt] },
			],
		}),
	],
);
