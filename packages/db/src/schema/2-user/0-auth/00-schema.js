/**
 * @import { UserAgent } from "@de100/auth-shared/types")
 */
// ## user

import { jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { bytea } from "../../_utils/custom-fields.js";
import { multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { userTableName } from "../_utils/index.js";
import { userIdFkCol, userIdFkExtraConfig } from "../0_utils/index.js";

// const _sessionMetadataJsonb = jsonb("metadata");
const userAgentJsonb = jsonb("user_agent_metadata");

const userSessionTableName = `${userTableName}_session`;
export const userSession = table(
	userSessionTableName,
	{
		id: textCols.idPk().notNull(),
		tokenHash: bytea("token_hash").notNull(), // ✅ Uint8Array storage
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		expiresAt: temporalCols.business.expiresAt().notNull(),
		lastVerifiedAt: timestamp("last_verified_at", { precision: 3 }).notNull(),
		lastExtendedAt: timestamp("last_extended_at", { precision: 3 }),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: /** @type {ReturnType<typeof userAgentJsonb.$type<UserAgent>>} */ (userAgentJsonb),
		userId: userIdFkCol().notNull(),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),

		//
		authStrategy: varchar("auth_strategy", { length: 50 }).notNull().default("jwt"), // 'session' | 'refresh_token'
		revokedAt: timestamp("revoked_at", { withTimezone: true }), // For token revocation
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // For refresh token tracking
		// metadata: /** @type {ReturnType<typeof sessionMetadataJsonb.$type<Record<string, any>>>} */ (
		// 	sessionMetadataJsonb
		// ),
	},
	(cols) => [
		...userIdFkExtraConfig({
			tName: userSessionTableName,
			cols,
		}),
		multiIndexes({
			tName: userSessionTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.expiresAt] },
				{ cols: [cols.authStrategy] },
				{ cols: [cols.revokedAt] },
				{ cols: [cols.lastUsedAt] },
				{ cols: [cols.lastVerifiedAt] },
				{ cols: [cols.lastExtendedAt] },
				{ cols: [cols.userId, cols.expiresAt] },
				{ cols: [cols.expiresAt, cols.createdAt] },
				{ cols: [cols.expiresAt, cols.revokedAt] },
			],
		}),
	],
);
const userEmailVerificationTableName = `${userTableName}_email_verification`;
export const userEmailVerificationRequest = table(
	userEmailVerificationTableName,
	{
		id: varchar("id", { length: 32 }).notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		code: textCols.longCode("code").notNull(),
		expiresAt: temporalCols.business.expiresAt().notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: userIdFkCol().notNull(),
	},
	(cols) => [
		...userIdFkExtraConfig({
			tName: userEmailVerificationTableName,
			cols: cols,
		}),
		uniqueIndex({
			tName: userEmailVerificationTableName,
			cols: [cols.code],
		}),
		...multiIndexes({
			tName: userEmailVerificationTableName,
			colsGrps: [{ cols: [cols.createdAt] }, { cols: [cols.expiresAt] }, { cols: [cols.email] }],
		}),
	],
);

const userPasswordResetTableName = `${userTableName}_password_reset`;
export const userPasswordResetSession = table(
	userPasswordResetTableName,
	{
		id: varchar("id", { length: 32 }).notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		code: textCols.longCode("code").notNull(),
		expiresAt: temporalCols.business.expiresAt().notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		userId: userIdFkCol().notNull(),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
	},
	(cols) => [
		...userIdFkExtraConfig({
			tName: userPasswordResetTableName,
			cols: cols,
		}),
		uniqueIndex({
			tName: userPasswordResetTableName,
			cols: [cols.code],
		}),
		multiIndexes({
			tName: userPasswordResetTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.expiresAt] },
				{ cols: [cols.email] },
				{ cols: [cols.emailVerifiedAt] },
				{ cols: [cols.twoFactorVerifiedAt] },
			],
		}),
	],
);
