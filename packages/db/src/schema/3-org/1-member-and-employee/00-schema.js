// ### member

import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table, tEnum } from "../../_utils/tables.js";
import { userProfileIdFkCol, userProfileIdFkExtraConfig } from "../../2-user/1-profile/schema.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";
import { orgMemberStatusEnum, orgMemberTableName } from "./_utils/index.js";

export { orgMemberStatusEnum };

// - **`orgMember`** = Customer/user presence in org (enrolls in courses, places orders)

export const orgMemberBaseRoleEnum = tEnum(`${orgMemberTableName}_base_role`, [
	"owner", // Full control over the org; can manage settings, members, and resources
	"member", // Standard member role; actual permissions governed by group mappings
	// "admin", // Full org privileges; manage members, teams, configs
	"employee",
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
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		orgId: orgIdFkCol().notNull(),

		userProfileId: userProfileIdFkCol().notNull(),

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
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgMemberTableName,
			cols,
		}),
		...userProfileIdFkExtraConfig({
			tName: orgMemberTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgMemberTableName,
			cols: [cols.userProfileId, cols.orgId],
		}),
		multiIndexes({
			tName: orgMemberTableName,
			colsGrps: [
				{ cols: [cols.role] },
				{ cols: [cols.status] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastActiveAt] },
				{ cols: [cols.joinedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

// -- member

// TODO: can be manged through the org membership
// export const jobOrgAffiliationStatusEnum = tEnum("job_org_affiliation_status", [
// 	"pending",
// 	"active",
// 	"suspended",
// 	"terminated",
// ]);

// The following is commented out as it is not needed for now.
// Org-specific locale settings
// The following is commented out as it is not needed for now.
// Org-specific locale settings
// export const orgLocale = table(
// 	`${orgTableName}_locale`,
// 	{
// 		orgId: textCols.idFK(`org_id`)
// 			.notNull()
// 			.references(() => org.id, { onDelete: "cascade" }),
// 		locale: text("locale").notNull(), // e.g. "en-US", "ar-EG"
// 		isDefault: sharedCols.isDefault(),
// 		isActive: boolean("is_active").default(true),

// 		// Locale-specific settings
// 		numberFormat: text("number_format").default("en-US"), // e.g., "en-US", "fr-FR"
// 		currencyFormat: text("currency_format").default("USD"), // e.g., "USD", "EUR"
// 		dateFormat: text("date_format").default("MM/DD/YYYY"),
// 		timeFormat: text("time_format").default("12h"),
// 		weekStart: integer("week_start").default(0), // 0 = Sunday
// 		createdAt: temporalCols.audit.createdAt().notNull(),,
// 	},
// 	(t) => [
// 		primaryKey({ cols: [t.orgId, t.locale] }),
// 		uniqueIndex("uq_org_default_locale")
// 			.on(t.orgId, t.isDefault)
// 			.where(eq(t.isDefault, true)),
// 		index("idx_org_locale_active").on(t.orgId, t.isActive),
// 	],
// );

// The following fields are commented because they are not used right now, but can be added later if needed
// status: varchar("status", { length: 20 }).default("active"), // 'active', 'suspended', 'closed'
// orgType: varchar("type", { length: 50 }).default("company"), // 'company', 'agency', 'freelancer'
// billingEmail: varchar("billing_email", { length: 256 }),
// website: varchar("website", { length: 512 }),
// industry: varchar("industry", { length: 100 })

// // Brand-specific metrics
// brandRecognition: decimal("brand_recognition", { precision: 5, scale: 2 }),
// contentCertifications: integer("content_certifications").default(0),
// partnerOrgs: integer("partner_orgs").default(0),
// brandedCourses: integer("branded_courses").default(0),

// The following is commented out because it should be handled in another way, not like this, needs to be well thought out
// // Permissions within this org
// canCreateCourses: boolean("can_create_courses").default(true),
// canManageStudents: boolean("can_manage_students").default(false),
// canAccessAnalytics: boolean("can_access_analytics").default(true),
// canManageOtherJobs: boolean("can_manage_other_jobs").default(
// 	false,
// ),
// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"
