import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { idsProvider } from "@de100/auth/providers";

import { bytea } from "./bytea";

const createId = idsProvider.createOneSync;

const organizationMetadataJsonb = jsonb("metadata");

export const organization = pgTable(
	"organization",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		name: varchar("name", { length: 100 }).notNull().unique("uq_organization_name"),
		slug: varchar("slug", { length: 100 }).notNull().unique("uq_organization_slug"),
		logo: varchar("logo", { length: 2096 }),
		metadata:
			/** @type {ReturnType<typeof organizationMetadataJsonb.$type<Record<string, any>>>} */ (
				organizationMetadataJsonb
			),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
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
		name: varchar("name", { length: 100 }).notNull().unique("uq_organization_team_name"),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_team_created_at").on(table.createdAt),
		index("idx_organization_team_updated_at").on(table.updatedAt),
		index("idx_organization_team_name").on(table.name),
	],
);
export const organizationMember = pgTable(
	"organization_member",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// role: varchar("role", { length: 50 }).notNull().default("organization_member"), // 'admin' | 'organization_member' | 'viewer'
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		deletedAt: timestamp("deleted_at", { precision: 3 }),
		teamId: text("team_id").references(() => organizationTeam.id, { onDelete: "set null" }),
	},
	(table) => [
		index("idx_organization_member_created_at").on(table.createdAt),
		// index("idx_organization_member_role").on(table.role),
	],
);

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey().notNull().$default(createId),
		name: varchar("name", { length: 100 }).notNull().unique("uq_user_name"),
		displayName: varchar("display_name", { length: 100 }),
		email: varchar("email", { length: 256 }).notNull().unique("uq_user_email"),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		image: varchar("image", { length: 2096 }),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),

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
		index("idx_user_display_name").on(table.displayName),
	],
);

const sessionMetadataJsonb = jsonb("metadata");

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey().notNull().$default(createId), // The hashed session ID or the hashed JWT refresh token
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: varchar("user_agent", { length: 512 }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),

		//
		sessionType: varchar("session_type", { length: 50 }).notNull().default("session"), // 'session' | 'refresh_token'
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
	],
);

export const emailVerificationRequest = pgTable(
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
	emailVerificationRequests: many(emailVerificationRequest),
	passwordResetSessions: many(passwordResetSession),
	organizations: many(organizationMember),
	organizationTeams: many(organizationTeam),
	organizationMembers: many(organizationMember),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));
export const emailVerificationRequestRelations = relations(emailVerificationRequest, ({ one }) => ({
	user: one(user, {
		fields: [emailVerificationRequest.userId],
		references: [user.id],
	}),
}));
export const passwordResetSessionRelations = relations(passwordResetSession, ({ one }) => ({
	user: one(user, {
		fields: [passwordResetSession.userId],
		references: [user.id],
	}),
}));
