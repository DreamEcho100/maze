import { eq, sql } from "drizzle-orm";
import {
	boolean,
	check,
	decimal,
	index,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
// Assuming these tables exist in your schema
import {
	numericCols,
	sharedCols,
	table,
	temporalCols,
	textCols,
} from "../../_utils/helpers";
import { contactInfo } from "../../general/contact-info/schema";
import { orgMember } from "../../org/member/schema";
import { orgMemberProductOrderItem } from "../../org/product/orders/schema";
import { orgProduct } from "../../org/product/schema";
// import { userProfileOrgMembership } from "../../org/schema";
import { buildUserI18nTable, userTableName } from "../_utils/helpers";

// import { org } from "../../org/schema";

// The many to one user profile schema
const userProfileTableName = `${userTableName}_profile`;
export const userProfileTypeEnum = pgEnum("user_profile_type", [
	"main",
	"instructor",
	"student",
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

		profilePictureUrl: text("profile_picture_url"),

		isActive: sharedCols.isActive(),
		type: userProfileTypeEnum("type").default("main"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${userProfileTableName}_user_id`).on(t.userId),
		// index(`idx_${userProfileTableName}_org_id`).on(t.orgId),
		// index(`idx_${userProfileTableName}_instructor_org_id`).on(
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
		// // Professional identity
		// // Translatable instructor fields
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
		uniqueIndex("uq_instructor_default_contact_info")
			.on(t.userProfileId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${userProfileContactInfoTableName}_user_profile_id`).on(
			t.userProfileId,
		),
		index(`idx_${userProfileContactInfoTableName}_contact_info_id`).on(
			t.contactInfoId,
		),
		index(`idx_${userProfileContactInfoTableName}_created_at`).on(t.createdAt),
		index(`idx_${userProfileContactInfoTableName}_last_updated_at`).on(
			t.lastUpdatedAt,
		),
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
		// "instructor",
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

		affiliationType:
			userProfileOrgMembershipAffiliationTypeEnum("affiliation_type").notNull(),
		connectionMethod:
			userProfileOrgMembershipConnectionMethodEnum("connection_method"),
		applicationNotes: text("application_notes"),

		createdAt: temporalCols.audit.createdAt(),
		updatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		// primaryKey({ columns: [t.userProfileId, t.orgMemberId] }),
		uniqueIndex(`uq_${userProfileOrgMembershipTableName}`).on(
			t.userProfileId,
			t.orgMemberId,
		),
		index(`idx_${userProfileOrgMembershipTableName}_user_profile_id`).on(
			t.userProfileId,
		),
		index(`idx_${userProfileOrgMembershipTableName}_org_member_id`).on(
			t.orgMemberId,
		),
		index(`idx_${userProfileOrgMembershipTableName}_joined_at`).on(t.joinedAt),
		index(`idx_${userProfileOrgMembershipTableName}_approved_at`).on(
			t.approvedAt,
		),
		index(`idx_${userProfileOrgMembershipTableName}_started_at`).on(
			t.startedAt,
		),
		index(`idx_${userProfileOrgMembershipTableName}_ended_at`).on(t.endedAt),
		index(`idx_${userProfileOrgMembershipTableName}_affiliation_type`).on(
			t.affiliationType,
		),
		index(`idx_${userProfileOrgMembershipTableName}_connection_method`).on(
			t.connectionMethod,
		),
		// index(
		// 	`idx_${userProfileOrgMembershipTableName}_invited_by_org_member_id`,
		// ).on(t.invitedByOrgMemberId),
		// index(
		// 	`idx_${userProfileOrgMembershipTableName}_approved_by_org_member_id`,
		// ).on(t.approvedByOrgMemberId),
		index(`idx_${userProfileOrgMembershipTableName}_created_at`).on(
			t.createdAt,
		),
		index(`idx_${userProfileOrgMembershipTableName}_updated_at`).on(
			t.updatedAt,
		),
	],
);

// -------------------------------------
// PROFESSIONAL ATTRIBUTION (CREATOR ECONOMY)
// -------------------------------------

// TODO: can be manged through the org membership
// export const instructorOrgAffiliationStatusEnum = pgEnum("instructor_org_affiliation_status", [
// 	"pending",
// 	"active",
// 	"suspended",
// 	"terminated",
// ]);

const userProfileOrgMembershipProductAttributionTableName = `${userProfileOrgMembershipTableName}_attribution`;
// TODO: Compensation in a CTI way to handle different compensation models
export const userProfileOrgMembershipProductAttributionCompensationTypeEnum =
	pgEnum(
		`${userProfileOrgMembershipProductAttributionTableName}_compensation_type`,
		["revenue_share", "flat_fee", "hourly", "salary", "per_course", "none"],
	);
/**
 *  Attribution Tracking
 *
 * @businessLogic Attribution attribution for  course creators
 */
export const userProfileOrgMembershipProductAttribution = table(
	userProfileOrgMembershipProductAttributionTableName,
	{
		id: textCols.id().notNull(),
		// Q: connect with `membershipId` field or with a compound primary key of `userProfileId` and `orgMemberId`?
		membershipId: textCols
			.idFk("membership_id")
			.notNull()
			.references(() => userProfileOrgMembership.id),
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id),
		// // Connect to order/transaction tables when implemented
		// orderId: textCols
		// 	.idFk("order_id")
		// 	.references(() => orgMemberProductOrder.id),

		compensationType:
			userProfileOrgMembershipProductAttributionCompensationTypeEnum(
				"compensation_type",
			).default("revenue_share"),
		compensationAmount: decimal("compensation_amount", {
			precision: 10,
			scale: 2,
		}),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),
		revenueAmount: decimal("revenue_amount", { precision: 12, scale: 2 }),
		sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }),
		lastPaidAt: timestamp("last_paid_at"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${userProfileOrgMembershipProductAttributionTableName}`).on(
			t.membershipId,
			t.productId,
		),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_membership_id`,
		).on(t.membershipId),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_product_id`,
		).on(t.productId),
		// index(
		// 	`idx_${userProfileOrgMembershipProductAttributionTableName}_order_id`,
		// ).on(t.orderId),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_compensation_type`,
		).on(t.compensationType),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_compensation_amount`,
		).on(t.compensationAmount),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_revenue_share_percentage`,
		).on(t.revenueSharePercentage),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_revenue_amount`,
		).on(t.revenueAmount),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_share_percentage`,
		).on(t.sharePercentage),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_last_paid_at`,
		).on(t.lastPaidAt),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_created_at`,
		).on(t.createdAt),
		index(
			`idx_${userProfileOrgMembershipProductAttributionTableName}_last_updated_at`,
		).on(t.lastUpdatedAt),
	],
);

const userProfileOrgMembershipProductAttributionRevenueTableName = `${userProfileOrgMembershipProductAttributionTableName}_revenue`;
export const userProfileOrgMembershipProductAttributionRevenueRecipientTypeEnum =
	pgEnum(
		`${userProfileOrgMembershipProductAttributionRevenueTableName}_recipient_type`,
		[
			"organization", // Org receives revenue
			"instructor", // Creator/instructor receives revenue
			"platform", // Platform fee
			"payment_processor", // Gateway processing fee
			"tax_authority", // Tax amount
		],
	);

export const userProfileOrgMembershipProductAttributionRevenueBasisEnum =
	pgEnum(
		`${userProfileOrgMembershipProductAttributionRevenueTableName}_basis`,
		[
			"product_ownership", // Product creator
			"instructor_attribution", // Course instructor
			"org_commission", // Organization commission
			"platform_fee", // Platform service fee
			"processing_fee", // Payment processing
			"referral_commission", // Referral program
		],
	);
export const userProfileOrgMembershipProductAttributionRevenue = table(
	userProfileOrgMembershipProductAttributionRevenueTableName,
	{
		id: textCols.id().notNull(),

		orderItemId: textCols
			.idFk("order_item_id")
			.notNull()
			.references(() => orgMemberProductOrderItem.id, { onDelete: "cascade" }),

		/**
		 * @revenueRecipient Who receives this revenue portion
		 */
		recipientType:
			userProfileOrgMembershipProductAttributionRevenueRecipientTypeEnum(
				"recipient_type",
			).notNull(), // TODO: Needs another way for flexible recipient identification, for example could user profile be changed a profile table and in CTI way define if it's for an org or a user _(it seems to be over-engineering though)_? or maybe just make a separate table for org attribution _(maybe also change how the product connect to the orgs or have secondary/affiliated orgs)_?
		// orgId: textCols.idFk("org_id").references(() => org.id),
		attributedMemberId: textCols
			.idFk("attributed_member_id")
			.references(() => userProfileOrgMembershipProductAttribution.id)
			.notNull(),
		platformRecipient: textCols.category("platform_recipient"), // "platform_fee", "processing_fee"

		/**
		 * @revenueCalculation Revenue amount and calculation details
		 */
		revenueAmount: numericCols.currency.amount("revenue_amount").notNull(),
		revenuePercentage: numericCols.percentage.revenueShare(),

		/**
		 * @attributionBasis How this revenue share was calculated
		 */
		attributionBasis:
			userProfileOrgMembershipProductAttributionRevenueBasisEnum(
				"attribution_basis",
			).notNull(),

		/**
		 * @currencyConsistency Revenue currency
		 */
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(
			`idx_${userProfileOrgMembershipProductAttributionRevenueTableName}_order_item_id`,
		).on(t.orderItemId),
		index(
			`idx_${userProfileOrgMembershipProductAttributionRevenueTableName}_recipient_type`,
		).on(t.recipientType),
		// index(
		// 	`idx_${userProfileOrgMembershipProductAttributionRevenueTableName}_org_id`,
		// ).on(t.orgId),
		index(
			`idx_${userProfileOrgMembershipProductAttributionRevenueTableName}_attributed_member_id`,
		).on(t.attributedMemberId),

		// Business constraints
		check("positive_revenue", sql`${t.revenueAmount} >= 0`),
		check(
			"valid_percentage",
			sql`${t.revenuePercentage} IS NULL OR (${t.revenuePercentage} >= 0 AND ${t.revenuePercentage} <= 100)`,
		),
		// check(
		// 	"single_recipient",
		// 	sql`(${t.orgId} IS NOT NULL)::int + (${t.attributedMemberId} IS NOT NULL)::int + (${t.platformRecipient} IS NOT NULL)::int = 1`,
		// ),
	],
);
