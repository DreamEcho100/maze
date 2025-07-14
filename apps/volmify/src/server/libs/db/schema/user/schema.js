/** @import { UserAgent } from "@de100/auth/types" */

import { index, jsonb, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { bytea } from "../_utils/bytea.js";
import {
	createdAt,
	deletedAt,
	id,
	name,
	table,
	updatedAt,
	userTableName,
} from "../_utils/helpers.js";

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
	(table) => {
		const base = userTableName;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_updated_at`).on(table.updatedAt),
			index(`idx_${base}_last_login_at`).on(table.lastLoginAt),
			index(`idx_${base}_display_name`).on(table.displayName),
		];
	},
);
const sessionMetadataJsonb = jsonb("metadata");
const userAgentJsonb = jsonb("user_agent_metadata");

export const userSession = table(
	`${userTableName}_session`,
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
	(table) => {
		const base = `${userTableName}_session`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_updated_at`).on(table.updatedAt),
			index(`idx_${base}_expires_at`).on(table.expiresAt),
			index(`idx_${base}_user_id`).on(table.userId),
			index(`idx_${base}_session_type`).on(table.authStrategy),
			index(`idx_${base}_revoked_at`).on(table.revokedAt),
			index(`idx_${base}_last_used_at`).on(table.lastUsedAt),
			index(`idx_${base}_user_id_expires_at`).on(table.userId, table.expiresAt),
			index(`idx_${base}_expires_at_created_at`).on(table.expiresAt, table.createdAt),
			index(`idx_${base}_expires_at_revoked_at`).on(table.expiresAt, table.revokedAt),
		];
	},
);
export const userEmailVerificationRequest = table(
	`${userTableName}_email_verification_request`,
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
	(table) => {
		const base = `${userTableName}_email_verification_request`;
		return [
			uniqueIndex(`uq_${base}_code`).on(table.code),
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_expires_at`).on(table.expiresAt),
			index(`idx_${base}_user_id`).on(table.userId),
		];
	},
);
export const userPasswordResetSession = table(
	`${userTableName}_password_reset_session`,
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
