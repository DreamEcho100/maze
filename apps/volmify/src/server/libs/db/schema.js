/** @import { UserAgent } from "@de100/auth/types" */

import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { ulid } from "ulid";

import { bytea } from "./bytea";

const createId = ulid;

export const systemPermissionCategory = pgTable(
	"system_permission_category",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		name: varchar("name", { length: 100 }).notNull().unique("uq_system_permission_category_name"),
		description: varchar("description", { length: 256 }),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
	},
	(table) => [
		index("idx_system_permission_category_created_at").on(table.createdAt),
		index("idx_system_permission_category_name").on(table.name),
	],
);
export const systemPermission = pgTable(
	"system_permission",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		name: varchar("name", { length: 100 }).notNull().unique("uq_system_permission_name"),
		description: varchar("description", { length: 256 }),
		categoryId: text("category_id")
			.notNull()
			.references(() => systemPermissionCategory.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
	},
	(table) => [
		index("idx_system_permission_created_at").on(table.createdAt),
		index("idx_system_permission_name").on(table.name),
	],
);

export const systemPermissionCategoryRelations = relations(
	systemPermissionCategory,
	({ many }) => ({
		permissions: many(systemPermission),
	}),
);
export const systemPermissionRelations = relations(systemPermission, ({ one, many }) => ({
	category: one(systemPermissionCategory, {
		fields: [systemPermission.categoryId],
		references: [systemPermissionCategory.id],
	}),
	groupPermissions: many(organizationPermissionsGroupPermission),
}));

export const memberBaseRoleEnum = pgEnum("member_base_role", [
	"admin", // Admins have full access to the organization, can manage members, teams, and settings
	"member", // Organization members have access to the organization's resources, and it will be based on the permissions group they belong to
]);
const organizationMetadataJsonb = jsonb("metadata");
export const organization = pgTable(
	"organization",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull().unique("uq_organization_name"),
		slug: varchar("slug", { length: 100 }).notNull().unique("uq_organization_slug"),
		logo: varchar("logo", { length: 2096 }),
		metadata:
			/** @type {ReturnType<typeof organizationMetadataJsonb.$type<Record<string, any>>>} */ (
				organizationMetadataJsonb
			),
		// The following fields are commented because they are not used right now, but can be added later if needed
		// status: varchar("status", { length: 20 }).default("active"), // 'active', 'suspended', 'closed'
		// organizationType: varchar("type", { length: 50 }).default("company"), // 'company', 'agency', 'freelancer'
		// billingEmail: varchar("billing_email", { length: 256 }),
		// website: varchar("website", { length: 512 }),
		// industry: varchar("industry", { length: 100 })
	},
	(table) => [
		index("idx_organization_created_at").on(table.createdAt),
		index("idx_organization_updated_at").on(table.updatedAt),
		index("idx_organization_name").on(table.name),
		index("idx_organization_slug").on(table.slug),
	],
);
export const organizationTeam = pgTable(
	"organization_team",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_team_created_at").on(table.createdAt),
		index("idx_organization_team_updated_at").on(table.updatedAt),
		index("idx_organization_team_name").on(table.name),
		uniqueIndex("uq_organization_team_name_org").on(table.name, table.organizationId),
	],
);
export const organizationMember = pgTable(
	"organization_member",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: memberBaseRoleEnum("role").notNull().default("member"),
		status: varchar("status", { length: 20 }).default("active"),
		invitedAt: timestamp("invited_at", { precision: 3 }),
		invitedBy: text("invited_by").references(() => user.id),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(table) => [
		index("idx_organization_member_created_at").on(table.createdAt),
		uniqueIndex("uq_organization_member_user_org").on(table.userId, table.organizationId),
	],
);
export const organizationMemberTeamRoleEnum = pgEnum("organization_member_team_role", [
	"admin", // Admins have full access to the team, can manage members and settings
	"member", // Members have access to the team's resources, and it will be based on the permissions group they belong to
]);
export const organizationMemberTeam = pgTable(
	"organization_member_team",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => organizationTeam.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).default("active"), // 'pending', 'active', 'suspended', 'left'
		role: organizationMemberTeamRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }), // When they accepted invitation
	},
	(table) => [
		index("idx_organization_member_team_created_at").on(table.createdAt),
		index("idx_organization_member_team_status").on(table.status),
		index("idx_organization_member_team_role").on(table.role),
		index("idx_organization_member_team_joined_at").on(table.joinedAt),
		uniqueIndex("uq_member_team").on(table.memberId, table.teamId),
	],
);
export const organizationMemberPermissionsGroup = pgTable(
	"organization_member_permissions_group",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		createdBy: text("created_by").references(() => user.id),
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("uq_member_permission_group").on(table.memberId, table.permissionsGroupId),
		index("idx_member_permission_group_member_id").on(table.memberId),
		index("idx_member_permission_group_group_id").on(table.permissionsGroupId),
	],
);
export const organizationPermissionsGroup = pgTable(
	"organization_permissions_group",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		createdBy: text("created_by").references(() => user.id), // It's nullable since it's seeded at first
		name: varchar("name", { length: 100 }).notNull(),
		description: varchar("description", { length: 256 }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		isSystem: boolean("is_system").default(false), // True if this is a system-defined group, false if it's user-defined
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_permissions_group_created_at").on(table.createdAt),
		index("idx_organization_permissions_group_updated_at").on(table.updatedAt),
		index("idx_organization_permissions_group_is_system").on(table.isSystem),
		uniqueIndex("uq_organization_permissions_group_name").on(table.name, table.organizationId),
	],
);
export const organizationPermissionsGroupPermission = pgTable(
	"organization_permissions_group_permission",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
		assignedBy: text("assigned_by").references(() => user.id),
	},
	(table) => [
		uniqueIndex("uq_group_permission").on(table.permissionsGroupId, table.systemPermissionId),
		index("idx_group_permission_group_id").on(table.permissionsGroupId),
		index("idx_group_permission_permission_id").on(table.systemPermissionId),
	],
);
export const organizationMemberInvitationStatusEnum = pgEnum(
	"organization_member_invitation_status",
	[
		"pending", // Invitation is pending
		"accepted", // Invitation has been accepted
		"declined", // Invitation has been declined
		// No need as it can be inferred from `expiresAt` field
		// "expired", // Invitation has expired
		"cancelled", // Invitation has been cancelled
		"revoked", // Invitation has been revoked by the inviter
	],
);
export const organizationMemberInvitation = pgTable(
	"organization_member_invitation",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		email: varchar("email", { length: 256 }).notNull(),
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		status: organizationMemberInvitationStatusEnum("status").notNull().default("pending"),

		role: memberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"), // Personal invitation message
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
		memberId: text("member_id").references(() => organizationMember.id),
	},
	(table) => [
		index("idx_organization_member_invitation_created_at").on(table.createdAt),
		index("idx_organization_member_invitation_updated_at").on(table.updatedAt),
		index("idx_organization_member_invitation_status").on(table.status),
		index("idx_organization_member_invitation_expires_at").on(table.expiresAt),
		index("idx_organization_member_invitation_email").on(table.email),
		index("idx_organization_member_invitation_invited_by_user_id").on(table.invitedByUserId),
		index("idx_organization_member_invitation_organization_id").on(table.organizationId),
		uniqueIndex("uq_organization_member_invitation_email_org").on(
			table.email,
			table.organizationId,
		),
	],
);

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(organizationMember),
	teams: many(organizationTeam),
	permissionGroups: many(organizationPermissionsGroup),
}));
export const organizationMemberRelations = relations(organizationMember, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationMember.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [organizationMember.userId],
		references: [user.id],
	}),
	// ✅ New: Multiple teams via junction table
	memberTeams: many(organizationMemberTeam),
	memberGroups: many(organizationMemberPermissionsGroup),
	memberInvitations: many(organizationMemberInvitation, {
		relationName: "member_invitation",
	}),
}));
export const organizationTeamRelations = relations(organizationTeam, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationTeam.organizationId],
		references: [organization.id],
	}),
	memberTeams: many(organizationMemberTeam), // Via junction table
}));
export const organizationMemberTeamRelations = relations(organizationMemberTeam, ({ one }) => ({
	member: one(organizationMember, {
		fields: [organizationMemberTeam.memberId],
		references: [organizationMember.id],
	}),
	team: one(organizationTeam, {
		fields: [organizationMemberTeam.teamId],
		references: [organizationTeam.id],
	}),
}));
export const organizationMemberPermissionsGroupRelations = relations(
	organizationMemberPermissionsGroup,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberPermissionsGroup.memberId],
			references: [organizationMember.id],
		}),
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationMemberPermissionsGroup.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
	}),
);
export const organizationPermissionsGroupRelations = relations(
	organizationPermissionsGroup,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationPermissionsGroup.organizationId],
			references: [organization.id],
		}),
		groupPermissions: many(organizationPermissionsGroupPermission),
		memberGroups: many(organizationMemberPermissionsGroup),
	}),
);
export const organizationPermissionsGroupPermissionRelations = relations(
	organizationPermissionsGroupPermission,
	({ one }) => ({
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationPermissionsGroupPermission.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
		systemPermission: one(systemPermission, {
			fields: [organizationPermissionsGroupPermission.systemPermissionId],
			references: [systemPermission.id],
		}),
	}),
);
export const organizationMemberInvitationRelations = relations(
	organizationMemberInvitation,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationMemberInvitation.organizationId],
			references: [organization.id],
		}),
		invitedByUser: one(user, {
			fields: [organizationMemberInvitation.invitedByUserId],
			references: [user.id],
		}),
		member: one(organizationMember, {
			fields: [organizationMemberInvitation.memberId],
			references: [organizationMember.id],
			relationName: "member_invitation",
		}),
	}),
);

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		lastLoginAt: timestamp("last_login_at", { precision: 3 }),
		name: varchar("name", { length: 100 }).notNull().unique("uq_user_name"),
		displayName: varchar("display_name", { length: 100 }),
		email: varchar("email", { length: 256 }).notNull().unique("uq_user_email"),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		image: varchar("image", { length: 2096 }),

		passwordHash: varchar("password_hash", { length: 512 }),
		twoFactorEnabledAt: timestamp("two_factor_enabled_at", { precision: 3 }),
		totpKey: bytea("totp_key"),
		recoveryCode: bytea("recovery_code"),
		twoFactorRegisteredAt: timestamp("two_factor_registered_at", { precision: 3 }),
		// twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
		// recoveryCodeUsedAt: timestamp("recovery_code_used_at", { precision: 3 }),
		// recoveryCodeExpiresAt: timestamp("recovery_code_expires_at", { precision: 3 }),
	},
	(table) => [
		index("idx_user_created_at").on(table.createdAt),
		index("idx_user_updated_at").on(table.updatedAt),
		index("idx_user_last_login_at").on(table.lastLoginAt),
		index("idx_user_display_name").on(table.displayName),
	],
);
const sessionMetadataJsonb = jsonb("metadata");
const userAgentJsonb = jsonb("user_agent_metadata");

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey().notNull().$default(createId), // The hashed session ID or the hashed JWT refresh token
		// id: text("id").primaryKey(), // ✅ sess_abc123 format
		tokenHash: bytea("token_hash").notNull(), // ✅ Uint8Array storage
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		lastVerifiedAt: timestamp("last_verified_at", { precision: 3 }).notNull(),
		lastExtendedAt: timestamp("last_extended_at", { precision: 3 }),
		ipAddress: varchar("ip_address", { length: 45 }),
		// userAgent: varchar("user_agent", { length: 512 }),
		userAgent: /** @type {ReturnType<typeof userAgentJsonb.$type<UserAgent>>} */ (userAgentJsonb),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),

		//
		authStrategy: varchar("auth_strategy", { length: 50 }).notNull().default("jwt"), // 'session' | 'refresh_token'
		revokedAt: timestamp("revoked_at", { withTimezone: true }), // For token revocation
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // For refresh token tracking
		metadata: /** @type {ReturnType<typeof sessionMetadataJsonb.$type<Record<string, any>>>} */ (
			sessionMetadataJsonb
		),
	},
	(table) => [
		index("idx_session_created_at").on(table.createdAt),
		index("idx_session_updated_at").on(table.updatedAt),
		index("idx_session_expires_at").on(table.expiresAt),
		index("idx_session_user_id").on(table.userId),
		index("idx_session_session_type").on(table.authStrategy),
		index("idx_session_revoked_at").on(table.revokedAt),
		index("idx_session_last_used_at").on(table.lastUsedAt),
		index("idx_session_user_id_expires_at").on(table.userId, table.expiresAt),
		index("idx_session_expires_at_created_at").on(table.expiresAt, table.createdAt),
		index("idx_session_expires_at_revoked_at").on(table.expiresAt, table.revokedAt),
	],
);
export const userEmailVerificationRequests = pgTable(
	"email_verification_request",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		code: varchar("code", { length: 256 }).notNull().unique("uq_email_verification_request_code"),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("idx_email_verification_request_created_at").on(table.createdAt),
		index("idx_email_verification_request_expires_at").on(table.expiresAt),
		index("idx_email_verification_request_user_id").on(table.userId),
	],
);
export const passwordResetSession = pgTable(
	"password_reset_session",
	{
		id: text("id").primaryKey().notNull(), // .$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		code: varchar("code", { length: 256 }).notNull().unique("uq_password_reset_session_code"),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// isEmailVerified: boolean("is_email_verified").default(false),
		// isTwoFactorVerified: boolean("is_two_factor_verified").default(false),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
	},
	(table) => [
		index("idx_password_reset_session_created_at").on(table.createdAt),
		index("idx_password_reset_session_expires_at").on(table.expiresAt),
		index("idx_password_reset_session_email").on(table.email),
		index("idx_password_reset_session_user_id").on(table.userId),
		index("idx_password_reset_session_code").on(table.code),
		index("idx_password_reset_session_email_verified_at").on(table.emailVerifiedAt),
		index("idx_password_reset_session_two_factor_verified_at").on(table.twoFactorVerifiedAt),
	],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	userEmailVerificationRequests: many(userEmailVerificationRequests),
	passwordResetSessions: many(passwordResetSession),
	organizationMemberships: many(organizationMember),
	invitationsSent: many(organizationMemberInvitation),
}));
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));
export const emailVerificationRequestRelations = relations(
	userEmailVerificationRequests,
	({ one }) => ({
		user: one(user, {
			fields: [userEmailVerificationRequests.userId],
			references: [user.id],
		}),
	}),
);
export const passwordResetSessionRelations = relations(passwordResetSession, ({ one }) => ({
	user: one(user, {
		fields: [passwordResetSession.userId],
		references: [user.id],
	}),
}));
