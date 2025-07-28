import { index, pgEnum, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers.js";
import { user } from "../../user/schema.js";
import { orgTableName } from "../_utils/helpers.js";

// - **`orgMember`** = Customer/user presence in org (enrolls in courses, places orders)

const orgMemberTableName = `${orgTableName}_member`;

export const orgMemberBaseRoleEnum = pgEnum(`${orgMemberTableName}_base_role`, [
	"owner", // Full control over the org; can manage settings, members, and resources
	"member", // Standard member role; actual permissions governed by group mappings
	// "admin", // Full org privileges; manage members, teams, configs
	"employee",
]);

export const orgMemberStatusEnum = pgEnum(`${orgMemberTableName}_status`, [
	"active",
	// Q: What're the possible statuses of a member/user of an org?
	"banned",
	"pending",
	"none_but_invited_as_employee",
]);

/**
 * Org Member (ABAC Subject)
 *
 * @abacRole Subject (User-Org Contextualized Identity)
 * Represents the user within a specific org and acts as the subject
 * in ABAC evaluations. Connects the global user identity to tenant-specific roles.
 */
export const orgMember = table(
	orgMemberTableName,
	{
		id: textCols.id().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		orgId: sharedCols.orgIdFk().notNull(),

		// userId: sharedCols.userIdFk().notNull(),
		userProfileId: sharedCols.userProfileIdFk().notNull(),

		// Q: displayName vs customerDisplayName/memberDisplayName
		displayName: textCols.displayName(),
		/**
		 * Determines baseline org access. Most logic uses permission groups for actual decisions.
		 */
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),

		/**
		 * Status can be:
		 */
		status: orgMemberStatusEnum("status").notNull().default("active"),

		joinedAt: temporalCols.activity.joinedAt(),
		lastActiveAt: temporalCols.activity.lastActiveAt(),
	},
	(table) => [
		index(`idx_${orgMemberTableName}_created_at`).on(table.createdAt),
		uniqueIndex(`uq_${orgMemberTableName}_user_profile_org`).on(table.userProfileId, table.orgId),
	],
);

export const orgMemberInvitationStatusEnum = pgEnum(`${orgMemberTableName}_invitation_status`, [
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
	`${orgMemberTableName}_invitation`,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),
		email: varchar("email", { length: 256 }).notNull(),

		// Customer invitation context
		invitationType: pgEnum("invitation_type", ["customer", "learner", "community"])("type").default(
			"learner",
		),
		welcomeMessage: textCols.shortDescription("welcome_message"),

		// TODO:
		// // Course/product access (optional)
		// grantedCourseAccess: text("granted_course_access").array(),

		invitedByMemberId: sharedCols.orgMemberIdFk("invited_by_member_id").notNull(), // Any member can invite customers
		status: orgMemberInvitationStatusEnum("status").default("pending"),
		expiresAt: temporalCols.business.expiresAt().notNull(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		role: orgMemberBaseRoleEnum("role").notNull().default("member"),
		acceptedAt: temporalCols.activity.acceptedAt(),
		declinedAt: temporalCols.activity.declinedAt(),
		memberId: textCols.idFk("member_id").references(() => orgMember.id),
		userId: textCols.idFk("user_id").references(() => user.id),
		// invitedByEmployeeId: sharedCols
		// 	.orgEmployeeIdFk("invited_by_employee_id")
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
