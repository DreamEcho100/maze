import { eq, sql } from "drizzle-orm";
import { boolean, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import {
	orgMemberIdExtraConfig,
	orgMemberIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/member-id.js";
import {
	seoMetadataIdExtraConfig,
	seoMetadataIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	userIdExtraConfig,
	userIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-id.js";
import {
	userProfileIdExtraConfig,
	userProfileIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-profile-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
// Assuming these tables exist in your schema
import { table } from "../../_utils/tables.js";
import { contactInfo } from "../../general/contact-info/schema";
// import { userProfileOrgMembership } from "../../org/schema";
import { buildUserI18nTable, userTableName } from "../_utils/helpers";

// import { org } from "../../org/schema";

// The many to one user profile schema
const userProfileTableName = `${userTableName}_profile`;
export const userProfileTypeEnum = pgEnum("user_profile_type", [
	"main", // ← Primary profile (acts as student by default)
	"job", // ← Job profile
	// Removed "student" - main profile handles this
]);

export const userProfile = table(
	userProfileTableName,
	{
		id: textCols.id().notNull(),
		userId: userIdFkCol().notNull(),
		// orgId: orgIdFkCol().notNull(),

		slug: textCols.slug().notNull(),
		displayName: textCols.displayName().notNull(),
		// email: textCols.email().notNull(),
		// contactInfoId

		profilePictureUrl: textCols.url("profile_picture_url"),

		isActive: sharedCols.isActive(),
		type: userProfileTypeEnum("type").default("main"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...userIdExtraConfig({
			tName: userProfileTableName,
			cols,
		}),
		uniqueIndex({
			tName: userProfileTableName,
			cols: [cols.userId, cols.type],
		}).where(sql`${cols.type} = 'main'`),
		...multiIndexes({
			tName: userProfileTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.slug] },
				{ cols: [cols.displayName] },
				{ cols: [cols.isActive] },
				{ cols: [cols.type] },
			],
		}),
	],
);
export const userProfileI18n = buildUserI18nTable(userProfileTableName)(
	{
		userProfileId: userProfileIdFkCol().notNull(),
		// // Job identity
		// // Translatable job fields
		bio: text("bio"),
		// specialization: text("specialization"),

		// // Teaching preferences (localized)
		// teachingPhilosophy: text("teaching_philosophy"),
		// studentMessage: text("student_message"), // Welcome message to students

		// SEO metadata reference
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "userProfileId",
		extraConfig: (cols, tName) => [
			...userProfileIdExtraConfig({
				tName,
				cols,
			}),
			...seoMetadataIdExtraConfig({
				tName,
				cols,
			}),
		],
	},
);

const userProfileContactInfoTableName = `${userTableName}_profile_contact_info`;
export const userProfileContactInfo = table(
	userProfileContactInfoTableName,
	{
		id: textCols.id().notNull(),
		userProfileId: userProfileIdFkCol().notNull(),
		contactInfoId: textCols.idFk("contact_info_id").notNull(),
		// .references(() => contactInfo.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		// uniqueIndex("uq_job_default_contact_info")
		// 	.on(t.userProfileId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${userProfileContactInfoTableName}_user_profile_id`).on(t.userProfileId),
		// index(`idx_${userProfileContactInfoTableName}_contact_info_id`).on(t.contactInfoId),
		// index(`idx_${userProfileContactInfoTableName}_created_at`).on(t.createdAt),
		// index(`idx_${userProfileContactInfoTableName}_last_updated_at`).on(t.lastUpdatedAt),
		// index(`idx_${userProfileContactInfoTableName}_deleted_at`).on(t.deletedAt),
		...userProfileIdExtraConfig({
			tName: userProfileContactInfoTableName,
			cols: t,
		}),
		...multiForeignKeys({
			tName: userProfileContactInfoTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [t.contactInfoId],
					foreignColumns: [contactInfo.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: userProfileContactInfoTableName,
			cols: [t.userProfileId, t.isDefault],
		}).where(eq(t.isDefault, true)),
		...multiIndexes({
			tName: userProfileContactInfoTableName,
			colsGrps: [
				{ cols: [t.isDefault] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
				{ cols: [t.deletedAt] },
			],
		}),
	],
);

const userProfileOrgMembershipTableName = `${userProfileTableName}_org_membership`;
export const userProfileOrgMembershipAffiliationTypeEnum = pgEnum(
	`${userProfileOrgMembershipTableName}_affiliation_type`,
	[
		// "member",
		// "admin",
		// "owner",
		// "job",
		// "student",
		"owner",
		"employee",
		"contractor",
		"guest",
		"partner",
		"volunteer",
	],
);
export const userProfileOrgMembershipConnectionMethodEnum = pgEnum(
	`${userProfileOrgMembershipTableName}_connection_method`,
	["other", "email", "phone", "in-person"],
);
export const userProfileOrgMembership = table(
	userProfileOrgMembershipTableName,
	{
		// IMP
		// Q: make the primary key a `id` field or a compound primary key of `userProfileId` and `orgMemberId`?
		id: textCols.id().notNull(),
		userProfileId: userProfileIdFkCol().notNull(),
		orgMemberId: orgMemberIdFkCol().notNull(),

		// status

		joinedAt: temporalCols.activity.joinedAt().defaultNow(),
		approvedAt: timestamp("approved_at", {
			precision: 3,
			withTimezone: true,
		}),
		startedAt: timestamp("started_at", {
			precision: 3,
			withTimezone: true,
		}).defaultNow(),
		endedAt: timestamp("ended_at", { precision: 3, withTimezone: true }),

		affiliationType: userProfileOrgMembershipAffiliationTypeEnum("affiliation_type").notNull(),
		connectionMethod: userProfileOrgMembershipConnectionMethodEnum("connection_method"),
		applicationNotes: text("application_notes"),

		createdAt: temporalCols.audit.createdAt(),
		updatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...userProfileIdExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
		}),
		...orgMemberIdExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
		}),
		uniqueIndex({
			tName: userProfileOrgMembershipTableName,
			cols: [cols.userProfileId, cols.orgMemberId],
		}),
		...multiIndexes({
			tName: userProfileOrgMembershipTableName,
			colsGrps: [
				{ cols: [cols.joinedAt] },
				{ cols: [cols.approvedAt] },
				{ cols: [cols.startedAt] },
				{ cols: [cols.endedAt] },
				{ cols: [cols.affiliationType] },
				{ cols: [cols.connectionMethod] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.updatedAt] },
			],
		}),
	],
);
