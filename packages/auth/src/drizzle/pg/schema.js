
import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { idsProvider } from "../../providers/ids";
import { relations } from "drizzle-orm";
import { bytea } from "./bytea";

const createId = idsProvider.createOneSync;

export const user = pgTable(
  "user",
  {
		// id: z.string(),
    id: text("id").primaryKey().notNull().$default(createId),
		// name: z.string(),
		name: varchar("name", { length: 100 }).notNull().unique("uq_user_name"),
		displayName: varchar("display_name", { length: 100 }),
		// email: z.string().transform((val) => val.toLowerCase()),
    email: varchar("email", { length: 256 }).notNull().unique("uq_user_email"),
		// emailVerified: z.boolean().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { precision: 3 }),
		// image: z.string().nullish(),
    image: varchar("image", { length: 2096 }),
		// createdAt: z.date().default(() => new Date()),
    createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		// updatedAt: z.date().default(() => new Date()),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
    // roleId: text("role_id")
    //   .notNull()
		//   .references(() => role.id),

		// passwordHash String @map("password_hash")
		passwordHash: varchar("password_hash", { length: 512 }),
		// twoFactorEnabledAt DateTime? @map("two_factor_enabled_at") // Is two-factor authentication enabled
		twoFactorEnabledAt: timestamp("two_factor_enabled_at", { precision: 3 }),
		// totpKey            Bytes?    @map("totp_key") // TOTP key for two-factor authentication
		totpKey: bytea("totp_key"),
		// recoveryCode       Bytes?    @map("recovery_code") // Recovery code for two-factor authentication
		recoveryCode: bytea("recovery_code"),
		// // twoFactorRegisteredAt DateTime? @map("two_factor_registered_at") // When two-factor authentication was registered
		twoFactorRegisteredAt: timestamp("two_factor_registered_at", { precision: 3 }),
		// // twoFactorVerifiedAt DateTime? @map("two_factor_verified_at") // When two-factor authentication was verified
		// twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
		// // recoveryCodeUsedAt DateTime? @map("recovery_code_used_at") // When the recovery code was last used
		// recoveryCodeUsedAt: timestamp("recovery_code_used_at", { precision: 3 }),
		// // recoveryCodeExpiresAt DateTime? @map("recovery_code_expires_at") // When the recovery code expires
		// recoveryCodeExpiresAt: timestamp("recovery_code_expires_at", { precision: 3 }),
  },
	table => [
		index("idx_user_created_at").on(table.createdAt),
		index("idx_user_updated_at").on(table.updatedAt),
		index("idx_user_display_name").on(table.displayName),
  ],
);

export const session = pgTable(
  "session",
  {
		// id: z.string(),
    id: text("id").primaryKey().notNull().$default(createId),
			// createdAt: z.date().default(() => new Date()),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		// updatedAt: z.date().default(() => new Date()),
    updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
		// // token: z.string(),
    // token: varchar("token", { length: 256 }).notNull().unique("uq_session_token"),
		// expiresAt: z.date(),
    expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		// ipAddress: z.string().nullish(),
    ipAddress: varchar("ip_address", { length: 45 }),
		// userAgent: z.string().nullish(),
    userAgent: varchar("user_agent", { length: 512 }),
		// userId: z.coerce.string(),
    userId: text("user_id")
      .notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		twoFactorVerifiedAt: timestamp("two_factor_verified_at", { precision: 3 }),
  },
  table => [
    index("idx_session_created_at").on(table.createdAt),
		index("idx_session_updated_at").on(table.updatedAt),
		index("idx_session_expires_at").on(table.expiresAt),
		index("idx_session_user_id").on(table.userId),
  ],
);

export const emailVerificationRequest = pgTable(
	"email_verification_request", {
	id: text("id").primaryKey().notNull().$default(createId),
	createdAt: timestamp("created_at", { precision: 3 }).notNull(),
	code: varchar("code", { length: 256 }).notNull().unique("uq_email_verification_request_code"),
	// expiresAt: z.date(),
	expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
	email: varchar("email", { length: 256 }).notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
},
	table => [
		index("idx_email_verification_request_created_at").on(table.createdAt),
		index("idx_email_verification_request_expires_at").on(table.expiresAt),
		index("idx_email_verification_request_user_id").on(table.userId),
	],
);

export const passwordResetSession = pgTable(
	"password_reset_session", {
		id: text("id").primaryKey().notNull(), // .$default(createId),
		createdAt: timestamp("created_at", { precision: 3 }).notNull(),
		code: varchar("code", { length: 256 }).notNull().unique("uq_password_reset_session_code"),
		// expiresAt: z.date(),
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
	table => [
		index("idx_password_reset_session_created_at").on(table.createdAt),
		index("idx_password_reset_session_expires_at").on(table.expiresAt),
		index("idx_password_reset_session_email").on(table.email),
		index("idx_password_reset_session_user_id").on(table.userId),
		index("idx_password_reset_session_code").on(table.code),
		index("idx_password_reset_session_email_verified_at").on(table.emailVerifiedAt),
		index("idx_password_reset_session_two_factor_verified_at").on(table.twoFactorVerifiedAt),
	],
)

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	emailVerificationRequests: many(emailVerificationRequest),
	passwordResetSessions: many(passwordResetSession),
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