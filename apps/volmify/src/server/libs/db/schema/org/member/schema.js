import { index, pgEnum, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers.js";
import { userProfile } from "../../user/profile/schema.js";
import { orgTableName } from "../_utils/helpers.js";

export const orgMemberBaseRoleEnum = pgEnum("org_member_base_role", [
	"admin", // Full org privileges; manage members, teams, configs
	"member", // Standard member role; actual permissions governed by group mappings
	"owner", // Full control over the org; can manage settings, members, and resources
]);

export const orgMemberStatusEnum = pgEnum("org_member_status", [
	"active", // Currently active member
	"invited", // Awaiting acceptance of invitation
	"suspended", // Temporarily suspended; cannot access org resources
	"left", // Member has left the org
	"removed", // Member removed by admin; cannot rejoin without new invite
]);

/**
 * Org Member (ABAC Subject)
 *
 * @abacRole Subject (User-Org Contextualized Identity)
 * Represents the user within a specific org and acts as the subject
 * in ABAC evaluations. Connects the global user identity to tenant-specific roles.
 */
export const orgMember = table(
	`${orgTableName}_member`,
	{
		id: textCols.id().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		orgId: sharedCols.orgIdFk().notNull(),

		// userId: sharedCols.userIdFk().notNull(),
		userProfileId: sharedCols.userProfileIdFk().notNull(),
		/**
		 * Determines baseline org access. Most logic uses permission groups for actual decisions.
		 */
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),

		/**
		 * Status can be: invited, active, suspended, left
		 */
		status: orgMemberStatusEnum("status").notNull().default("invited"),

		displayName: textCols.displayName().notNull(),

		invitedAt: temporalCols.activity.invitedAt().defaultNow(),
		invitedById: textCols.idFk("invited_by_id").references(() => userProfile.id),
		joinedAt: temporalCols.activity.joinedAt(),
	},
	(table) => {
		const base = `${orgTableName}_member`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			uniqueIndex(`uq_${base}_user_profile_org`).on(table.userProfileId, table.orgId),
		];
	},
);

export const orgMemberInvitationStatusEnum = pgEnum(`${orgTableName}_member_invitation_status`, [
	"pending", // Awaiting response
	"accepted", // Member joined org
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
]);

/**
 * Member Invitation Table
 *
 * @abacRole Pre-Membership Identity Provisioning
 * Handles invitation issuance and acceptance into the ABAC org model.
 */
export const orgMemberInvitation = table(
	`${orgTableName}_member_invitation`,
	{
		id: textCols.id().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		orgId: sharedCols.orgIdFk().notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		invitedByMemberId: textCols
			.idFk("invited_by_member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		approvedByMemberId: textCols.idFk("approved_by_member_id").references(() => orgMember.id),

		expiresAt: temporalCols.business.expiresAt().notNull(),
		status: orgMemberInvitationStatusEnum("status").notNull().default("pending"),
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"),
		acceptedAt: temporalCols.activity.acceptedAt(),
		declinedAt: temporalCols.activity.declinedAt(),
		memberId: textCols.idFk("member_id").references(() => orgMember.id),
	},
	(t) => {
		const base = `${orgTableName}_member_invitation`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_expires_at`).on(t.expiresAt),
			index(`idx_${base}_email`).on(t.email),
			index(`idx_${base}_invited_by_user_id`).on(t.invitedByMemberId),
			index(`idx_${base}_org_id`).on(t.orgId),
			uniqueIndex(`uq_${base}_email_org`).on(t.email, t.orgId),
		];
	},
);
