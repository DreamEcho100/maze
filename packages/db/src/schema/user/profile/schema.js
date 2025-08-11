import { eq, sql } from "drizzle-orm";
import { boolean, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/member-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	userIdFkCol,
	userIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/user-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/user-profile-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
// Assuming these tables exist in your schema
import { table } from "../../_utils/tables.js";
import { contactInfo } from "../../general/contact-info/schema.js";
// import { userProfileOrgMembership } from "../../org/schema.js";
import { buildUserI18nTable, userTableName } from "../_utils/helpers.js";

// import { org } from "../../org/schema.js";

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
		id: textCols.idPk().notNull(),
		userId: userIdFkCol().notNull(),
		// orgId: orgIdFkCol().notNull(),

		slug: textCols.slug().notNull(),
		displayName: textCols.displayName().notNull(),
		// email: textCols.email().notNull(),
		// contactInfoId

		profilePictureUrl: textCols.url("profile_picture_url"),

		isActive: sharedCols.isActive(),
		type: userProfileTypeEnum("type").default("main"),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...userIdFkExtraConfig({
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
			...userProfileIdFkExtraConfig({
				tName,
				cols,
			}),
			...seoMetadataIdFkExtraConfig({
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
		id: textCols.idPk().notNull(),
		userProfileId: userProfileIdFkCol().notNull(),
		contactInfoId: textCols.idFk("contact_info_id").notNull(),
		// .references(() => contactInfo.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...userProfileIdFkExtraConfig({
			tName: userProfileContactInfoTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: userProfileContactInfoTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [cols.contactInfoId],
					foreignColumns: [contactInfo.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: userProfileContactInfoTableName,
			cols: [cols.userProfileId, cols.isDefault],
		}).where(eq(cols.isDefault, sql`TRUE`)),
		...multiIndexes({
			tName: userProfileContactInfoTableName,
			colsGrps: [
				{ cols: [cols.isDefault] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
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
		id: textCols.idPk().notNull(),
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

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...userProfileIdFkExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
		}),
		...orgMemberIdFkExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
			colFkKey: "orgMemberId",
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
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
