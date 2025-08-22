/**
 * @import { UserAgent } from "@de100/auth-shared/types")
 */
// ## user

import { timestamp, varchar } from "drizzle-orm/pg-core";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { bytea } from "../_utils/custom-fields.js";
import { multiIndexes } from "../_utils/helpers.js";
import { table } from "../_utils/tables.js";
import { userTableName } from "./_utils/index.js";

export const user = table(
	userTableName,
	{
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
		lastLoginAt: timestamp("last_login_at", { precision: 3 }),
		name: textCols.name().notNull().unique("uq_user_name"),
		displayName: textCols.displayName().notNull(),
		email: varchar("email", { length: 256 }).notNull().unique("uq_user_email"),
		emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		image: varchar("image", { length: 2096 }),

		passwordHash: varchar("password_hash", { length: 512 }),
		twoFactorEnabledAt: timestamp("two_factor_enabled_at", { precision: 3 }),
		totpKey: bytea("totp_key"),
		recoveryCode: bytea("recovery_code"),
		twoFactorRegisteredAt: timestamp("two_factor_registered_at", {
			precision: 3,
		}),
	},
	(cols) => [
		...multiIndexes({
			tName: userTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.lastLoginAt] },
				{ cols: [cols.displayName] },
				{ cols: [cols.email] },
				{ cols: [cols.name] },
			],
		}),
	],
);
