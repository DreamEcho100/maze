/** @import { UserAgent } from "@de100/auth/types" */

import { index, jsonb, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { bytea } from "../_utils/bytea.js";
import { createdAt, deletedAt, id, table, updatedAt } from "../_utils/helpers.js";

export const user = table(
	"user",
	{
		id,
		createdAt,
		updatedAt,
		deletedAt,
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

export const session = table(
	"session",
	{
		id, // The hashed session ID or the hashed JWT refresh token
		// id: text("id").primaryKey(), // ✅ sess_abc123 format
		tokenHash: bytea("token_hash").notNull(), // ✅ Uint8Array storage
		createdAt,
		updatedAt,
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
export const userEmailVerificationRequests = table(
	"email_verification_request",
	{
		id,
		createdAt,
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
export const passwordResetSession = table(
	"password_reset_session",
	{
		id: text("id").primaryKey().notNull(), // .$default(createId),
		createdAt,
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
