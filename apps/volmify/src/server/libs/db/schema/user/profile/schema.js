import { eq, sql } from "drizzle-orm";
import { boolean, index, pgEnum, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
// Assuming these tables exist in your schema
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers";
import { contactInfo } from "../../general/contact-info/schema";
import { orgMember } from "../../org/member/schema";
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
		userId: sharedCols.userIdFk().notNull(),
		// orgId: sharedCols.orgIdFk().notNull(),

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
	(t) => [
		uniqueIndex(`uq_${userProfileTableName}_main_profile`)
			.on(t.userId)
			.where(sql`${t.type} = 'main'`),
		index(`idx_${userProfileTableName}_user_id`).on(t.userId),
		// Prevent job profile `type` changes on the API level
		// index(`idx_${userProfileTableName}_org_id`).on(t.orgId),
		// index(`idx_${userProfileTableName}_job_org_id`).on(
		// 	t.orgId,
		// ),
	],
);
export const userProfileI18n = buildUserI18nTable(userProfileTableName)(
	{
		userProfileId: textCols
			.idFk(`${userTableName}_profile_id`)
			.references(() => userProfile.id, { onDelete: "cascade" })
			.notNull(),
		// // Job identity
		// // Translatable job fields
		bio: text("bio"),
		// specialization: text("specialization"),

		// // Teaching preferences (localized)
		// teachingPhilosophy: text("teaching_philosophy"),
		// studentMessage: text("student_message"), // Welcome message to students

		// SEO metadata reference
		seoMetadataId: sharedCols.seoMetadataIdFk(),
	},
	{
		fkKey: "userProfileId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_user_profile_id`).on(t.userProfileId),
			index(`idx_${tName}_seo_metadata_id`).on(t.seoMetadataId),
		],
	},
);

const userProfileContactInfoTableName = `${userTableName}_profile_contact_info`;
export const userProfileContactInfo = table(
	userProfileContactInfoTableName,
	{
		id: textCols.id().notNull(),
		userProfileId: textCols
			.idFk("user_profile_id")
			.notNull()
			.references(() => userProfile.id, { onDelete: "cascade" }),
		contactInfoId: textCols
			.idFk("contact_info_id")
			.notNull()
			.references(() => contactInfo.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		uniqueIndex("uq_job_default_contact_info")
			.on(t.userProfileId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${userProfileContactInfoTableName}_user_profile_id`).on(t.userProfileId),
		index(`idx_${userProfileContactInfoTableName}_contact_info_id`).on(t.contactInfoId),
		index(`idx_${userProfileContactInfoTableName}_created_at`).on(t.createdAt),
		index(`idx_${userProfileContactInfoTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${userProfileContactInfoTableName}_deleted_at`).on(t.deletedAt),
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
		// Q: make the primary key a `id` field or a compound primary key of `userProfileId` and `orgMemberId`?
		id: textCols.id().notNull(),
		userProfileId: textCols
			.idFk("user_profile_id")
			.references(() => userProfile.id, { onDelete: "cascade" })
			.notNull(),
		orgMemberId: textCols
			.idFk("user_profile_org_member_id")
			.references(() => orgMember.id, { onDelete: "cascade" })
			.notNull(),

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
	(t) => [
		// primaryKey({ columns: [t.userProfileId, t.orgMemberId] }),
		uniqueIndex(`uq_${userProfileOrgMembershipTableName}`).on(t.userProfileId, t.orgMemberId),
		index(`idx_${userProfileOrgMembershipTableName}_user_profile_id`).on(t.userProfileId),
		index(`idx_${userProfileOrgMembershipTableName}_org_member_id`).on(t.orgMemberId),
		index(`idx_${userProfileOrgMembershipTableName}_joined_at`).on(t.joinedAt),
		index(`idx_${userProfileOrgMembershipTableName}_approved_at`).on(t.approvedAt),
		index(`idx_${userProfileOrgMembershipTableName}_started_at`).on(t.startedAt),
		index(`idx_${userProfileOrgMembershipTableName}_ended_at`).on(t.endedAt),
		index(`idx_${userProfileOrgMembershipTableName}_affiliation_type`).on(t.affiliationType),
		index(`idx_${userProfileOrgMembershipTableName}_connection_method`).on(t.connectionMethod),
		// index(
		// 	`idx_${userProfileOrgMembershipTableName}_invited_by_org_member_id`,
		// ).on(t.invitedByOrgMemberId),
		// index(
		// 	`idx_${userProfileOrgMembershipTableName}_approved_by_org_member_id`,
		// ).on(t.approvedByOrgMemberId),
		index(`idx_${userProfileOrgMembershipTableName}_created_at`).on(t.createdAt),
		index(`idx_${userProfileOrgMembershipTableName}_updated_at`).on(t.updatedAt),
	],
);
