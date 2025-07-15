import {
	index,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

import {
	createdAt,
	deletedAt,
	id,
	table,
	updatedAt,
} from "../../_utils/helpers.js";
import { user } from "../../user/schema.js";
import { orgTableName } from "../_utils/helpers.js";
import { org } from "../schema.js";

export const orgMemberBaseRoleEnum = pgEnum("org_member_base_role", [
	"admin", // Full orgal privileges; manage members, teams, configs
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
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		/**
		 * Determines baseline org access. Most logic uses permission groups for actual decisions.
		 */
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),

		/**
		 * Status can be: invited, active, suspended, left
		 */
		status: orgMemberStatusEnum("status").notNull().default("invited"),

		displayName: varchar("display_name", { length: 128 }),

		invitedAt: timestamp("invited_at", { precision: 3 }),
		invitedBy: text("invited_by").references(() => user.id),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(table) => {
		const base = `${orgTableName}_member`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			uniqueIndex(`uq_${base}_user_org`).on(table.userId, table.orgId),
		];
	},
);

export const orgMemberInvitationStatusEnum = pgEnum(
	`${orgTableName}_member_invitation_status`,
	[
		"pending", // Awaiting response
		"accepted", // Member joined org
		"declined", // Invitee declined
		"cancelled", // Invite cancelled by sender
		"revoked", // Revoked access before action
	],
);

/**
 * Member Invitation Table
 *
 * @abacRole Pre-Membership Identity Provisioning
 * Handles invitation issuance and acceptance into the ABAC org model.
 */
export const orgMemberInvitation = table(
	`${orgTableName}_member_invitation`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		email: varchar("email", { length: 256 }).notNull(),
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		status: orgMemberInvitationStatusEnum("status")
			.notNull()
			.default("pending"),
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"),
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
		memberId: text("member_id").references(() => orgMember.id),
	},
	(t) => {
		const base = `${orgTableName}_member_invitation`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_expires_at`).on(t.expiresAt),
			index(`idx_${base}_email`).on(t.email),
			index(`idx_${base}_invited_by_user_id`).on(t.invitedByUserId),
			index(`idx_${base}_org_id`).on(t.orgId),
			uniqueIndex(`uq_${base}_email_org`).on(t.email, t.orgId),
		];
	},
);
