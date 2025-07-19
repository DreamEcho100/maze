/** @import { UserAgent } from "@de100/auth/types" */

import { index, jsonb, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { bytea } from "../_utils/bytea.js";
import { createdAt, deletedAt, id, name, table, updatedAt } from "../_utils/helpers.js";
import { userTableName } from "./_utils/helpers.js";

export const user = table(
	userTableName,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		lastLoginAt: timestamp("last_login_at", { precision: 3 }),
		name: name.notNull().unique("uq_user_name"),
		displayName: varchar("display_name", { length: 100 }),
		email: varchar("email", { length: 256 }).notNull().unique("uq_user_email"),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		image: varchar("image", { length: 2096 }),

		passwordHash: varchar("password_hash", { length: 512 }),
		twoFactorEnabledAt: timestamp("two_factor_enabled_at", { precision: 3 }),
		totpKey: bytea("totp_key"),
		recoveryCode: bytea("recovery_code"),
		twoFactorRegisteredAt: timestamp("two_factor_registered_at", { precision: 3 }),
	},
	(table) => [
		index(`idx_${userTableName}_created_at`).on(table.createdAt),
		index(`idx_${userTableName}_updated_at`).on(table.updatedAt),
		index(`idx_${userTableName}_last_login_at`).on(table.lastLoginAt),
		index(`idx_${userTableName}_display_name`).on(table.displayName),
	],
);
const sessionMetadataJsonb = jsonb("metadata");
const userAgentJsonb = jsonb("user_agent_metadata");

const userSessionTableName = `${userTableName}_session`;
export const userSession = table(
	userSessionTableName,
	{
		id: id.notNull(),
		tokenHash: bytea("token_hash").notNull(), // ✅ Uint8Array storage
		createdAt,
		updatedAt,
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		lastVerifiedAt: timestamp("last_verified_at", { precision: 3 }).notNull(),
		lastExtendedAt: timestamp("last_extended_at", { precision: 3 }),
		ipAddress: varchar("ip_address", { length: 45 }),
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
		index(`idx_${userSessionTableName}_created_at`).on(table.createdAt),
		index(`idx_${userSessionTableName}_updated_at`).on(table.updatedAt),
		index(`idx_${userSessionTableName}_expires_at`).on(table.expiresAt),
		index(`idx_${userSessionTableName}_user_id`).on(table.userId),
		index(`idx_${userSessionTableName}_session_type`).on(table.authStrategy),
		index(`idx_${userSessionTableName}_revoked_at`).on(table.revokedAt),
		index(`idx_${userSessionTableName}_last_used_at`).on(table.lastUsedAt),
		index(`idx_${userSessionTableName}_user_id_expires_at`).on(table.userId, table.expiresAt),
		index(`idx_${userSessionTableName}_expires_at_created_at`).on(table.expiresAt, table.createdAt),
		index(`idx_${userSessionTableName}_expires_at_revoked_at`).on(table.expiresAt, table.revokedAt),
	],
);
const userEmailVerificationTableName = `${userTableName}_email_verification`;
export const userEmailVerificationRequest = table(
	userEmailVerificationTableName,
	{
		id: id.notNull(),
		createdAt,
		code: varchar("code", { length: 256 }).notNull(),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex(`uq_${userEmailVerificationTableName}_code`).on(table.code),
		index(`idx_${userEmailVerificationTableName}_created_at`).on(table.createdAt),
		index(`idx_${userEmailVerificationTableName}_expires_at`).on(table.expiresAt),
		index(`idx_${userEmailVerificationTableName}_user_id`).on(table.userId),
	],
);
const userPasswordResetTableName = `${userTableName}_password_reset`;
export const userPasswordResetSession = table(
	userPasswordResetTableName,
	{
		id: text("id").primaryKey().notNull(),
		createdAt,
		code: varchar("code", { length: 256 }).notNull(),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
	},
	(table) => {
		const base = `${userTableName}_password_reset_session`;
		return [
			uniqueIndex(`uq_${base}_code`).on(table.code),
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_expires_at`).on(table.expiresAt),
			index(`idx_${base}_email`).on(table.email),
			index(`idx_${base}_user_id`).on(table.userId),
			index(`idx_${base}_code`).on(table.code),
			index(`idx_${base}_email_verified_at`).on(table.emailVerifiedAt),
			index(`idx_${base}_two_factor_verified_at`).on(table.twoFactorVerifiedAt),
		];
	},
);
