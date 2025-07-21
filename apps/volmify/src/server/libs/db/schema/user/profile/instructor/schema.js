import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
// Assuming these tables exist in your schema
import { numericCols, sharedCols, table, temporalCols, textCols } from "../../../_utils/helpers";
import { contactInfo } from "../../../general/contact-info/schema";
import { orgLocale } from "../../../org/locale-region/schema";
import { orgProduct } from "../../../org/product/schema";
import { instructorOrgAffiliation } from "../../../org/schema";
import { userTableName } from "../../_utils/helpers";

const userInstructorProfileTableName = `${userTableName}_instructor_profile`;
/**
 * Instructor Profile - User-based content creator identity
 *
 * @businessLogic Individual instructor profile for course creation
 * Can participate across multiple orgs while maintaining identity
 */
export const userInstructorProfile = table(
	userInstructorProfileTableName,
	{
		id: textCols.id().notNull(),
		userId: sharedCols.userIdFk().notNull(),
		slug: textCols.slug().notNull(),
		verifiedAt: boolean("verified_at").default(false),
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		// The following is commented out because it should be handled in it's own related tables, maybe in the same way as LinkedIn Learning or Udemy, with as many tables as needed
		// // Professional identity
		// expertise: text("expertise").array(),
		// yearsExperience: integer("years_experience"),

		// The following is commented out because it's not needed for now, but may be added later in this way or in some other way if seems valuable
		// // Teaching profile
		// teachingStyle: text("teaching_style"), // "hands-on", "theoretical", "mixed", "interactive"
		// preferredSubjects: text("preferred_subjects").array(),
		// languagesSpoken: text("languages_spoken").array(),
		// /**
		//  * ```json
		//  *	{
		//  *		"timezone": "UTC-5",
		//  *		"available_days": ["monday", "tuesday", "wednesday"],
		//  *		"available_hours": {"start": "09:00", "end": "17:00"},
		//  *		"flexible": true
		//  *	}
		//  * ```
		//  */
		// availabilitySchedule: jsonb("availability_schedule"),

		// The following is commented out because it should be handled in it's own related course/class table, will be covered on there not here for now
		// // Teaching preferences
		// isAcceptingStudents: boolean("is_accepting_students").default(true),
		// maxStudentsPerCourse: integer("max_students_per_course"),
		// preferredClassSize: text("preferred_class_size"), // "small", "medium", "large", "unlimited"

		// // Instructor metrics
		// totalStudents: integer("total_students").default(0),
		// totalCourses: integer("total_courses").default(0),
		// completionRate: decimal("completion_rate", { precision: 5, scale: 2 }),
		// studentSatisfactionScore: decimal("student_satisfaction_score", {
		// 	precision: 3,
		// 	scale: 2,
		// }),

		// The following is commented out because it should be handled in it's own related table, maybe in the same way as LinkedIn Learning or Udemy, with as many tables as needed, but how to handle it and what's the best way to do it _(hence it should be well thought out)_?
		// // Verification status
		// identityVerified: boolean("identity_verified").default(false),
		// expertiseVerified: boolean("expertise_verified").default(false),
		// backgroundChecked: boolean("background_checked").default(false),
		// teachingDemoCompleted: boolean("teaching_demo_completed").default(false),

		// // Trust and safety
		// trustScore: decimal("trust_score", { precision: 5, scale: 2 }),
		// lastTrustScoreUpdate: timestamp("last_trust_score_update"),
	},
	(t) => [
		// uniqueIndex("uq_instructor_user").on(t.userId),
		uniqueIndex(`uq_${userInstructorProfileTableName}_slug`).on(t.slug),
		index(`idx_${userInstructorProfileTableName}_user_id`).on(t.userId),
		index(`idx_${userInstructorProfileTableName}_verified_at`).on(t.verifiedAt),
		index(`idx_${userInstructorProfileTableName}_created_at`).on(t.createdAt),
		index(`idx_${userInstructorProfileTableName}_last_updated_at`).on(t.lastUpdatedAt),
	],
);
// TODO: Metrics
// Instead of storing aggregates in profiles, use dedicated analytics
// orgInstructorAnalyticsSummary: {
//   instructorId, orgId, lastCalculatedAt,
//   totalCourses, totalStudents, avgRating, totalRevenue
// }

// orgInstructorAnalyticsTimeSeries: {
//   instructorId, orgId, period, periodType,
//   activeUsers, engagements, revenue, enrollments
// }

const userInstructorProfileI18nTableName = `${userTableName}_instructor_profile_i18n`;
export const userInstructorProfileI18n = table(
	userInstructorProfileI18nTableName,
	{
		id: textCols.id().notNull(),
		userInstructorProfileId: textCols
			.idFk(`${userTableName}_instructor_profile_id`)
			.references(() => userInstructorProfile.id, { onDelete: "cascade" })
			.notNull(),
		localeKey: sharedCols
			.orgLocaleKeyFk("locale_key")
			.notNull()
			.references(() => orgLocale.localeKey, { onDelete: "cascade" }),
		isDefault: sharedCols.isDefault(),

		// // Professional identity
		// // Translatable instructor fields
		professionalTitle: text("professional_title"),
		bio: text("bio"),
		// specialization: text("specialization"),

		// // Teaching preferences (localized)
		// teachingPhilosophy: text("teaching_philosophy"),
		// studentMessage: text("student_message"), // Welcome message to students

		// SEO metadata reference
		seoMetadataId: sharedCols.seoMetadataIdFk(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${userInstructorProfileI18nTableName}_locale_key`).on(
			t.userInstructorProfileId,
			t.localeKey,
		),
		uniqueIndex(`uq_${userInstructorProfileI18nTableName}_default`)
			.on(t.userInstructorProfileId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${userInstructorProfileI18nTableName}_profile_id`).on(t.userInstructorProfileId),
		index(`idx_${userInstructorProfileI18nTableName}_locale_key`).on(t.localeKey),
		index(`idx_${userInstructorProfileI18nTableName}_seo_metadata_id`).on(t.seoMetadataId),
		index(`idx_${userInstructorProfileI18nTableName}_created_at`).on(t.createdAt),
		index(`idx_${userInstructorProfileI18nTableName}_last_updated_at`).on(t.lastUpdatedAt),
	],
);

const userInstructorProfileContactInfoTableName = `${userTableName}_instructor_profile_contact_info`;
export const userInstructorProfileContactInfo = table(
	userInstructorProfileContactInfoTableName,
	{
		id: textCols.id().notNull(),
		instructorProfileId: textCols
			.idFk("instructor_profile_id")
			.notNull()
			.references(() => userInstructorProfile.id, { onDelete: "cascade" }),
		contactInfoId: textCols
			.idFk("contact_info_id")
			.notNull()
			.references(() => contactInfo.id, { onDelete: "cascade" }),
		// isPrimary: boolean("is_primary").default(false),
		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		index(`idx_${userInstructorProfileContactInfoTableName}_instructor_profile_id`).on(
			t.instructorProfileId,
		),
		index(`idx_${userInstructorProfileContactInfoTableName}_contact_info_id`).on(t.contactInfoId),
		index(`idx_${userInstructorProfileContactInfoTableName}_created_at`).on(t.createdAt),
		// uniqueIndex("uq_instructor_contact_primary")
		// 	.on(t.instructorProfileId, t.isPrimary)
		// 	.where(eq(t.isPrimary, true)),
	],
);

const userInstructorProfileProductTableName = `${userTableName}_instructor_profile_product`;
/**
 * Instructor Revenue Tracking
 *
 * @businessLogic Revenue attribution for instructor course creators
 * Supports the vendorRevenue connection mentioned in course schema
 */
export const userInstructorProfileRevenue = table(
	userInstructorProfileProductTableName,
	{
		id: textCols.id().notNull(),
		instructorMembershipId: textCols
			.idFk("instructor_membership_id")
			.notNull()
			.references(() => instructorOrgAffiliation.id),
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id),
		// Connect to order/transaction tables when implemented
		orderId: textCols.idFk("order_id"), // Will reference order table
		revenueAmount: decimal("revenue_amount", { precision: 12, scale: 2 }),
		sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }),
		paidAt: timestamp("paid_at"),
		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		index(`idx_${userInstructorProfileProductTableName}_instructor_membership_id`).on(
			t.instructorMembershipId,
		),
		index(`idx_${userInstructorProfileProductTableName}_product_id`).on(t.productId),
		index(`idx_${userInstructorProfileProductTableName}_order_id`).on(t.orderId),
	],
);

const userInstructorProfileSkillTableName = `${userTableName}_instructor_profile_skill`;
export const userInstructorProfileSkill = table(
	userInstructorProfileSkillTableName,
	{
		id: textCols.id().notNull(),
		profileId: textCols
			.idFk("profile_id")
			.references(() => userInstructorProfile.id, { onDelete: "cascade" })
			.notNull(),
		// Engagement metrics
		totalStudents: integer("total_students").default(0),

		ratingTotal: numericCols.ratingTotal("rating_total").default(0),
		ratingCount: numericCols.ratingCount("rating_count").default(0),
		ratingAvg: numericCols.ratingAgg("rating_avg").default("0.00"),

		totalReviews: integer("total_reviews").default(0),
		createdAt: temporalCols.audit.createdAt(),

		// totalCourses: integer("total_courses").default(0),
		// totalCoursesCompleted: integer("total_courses_completed").default(0),
		// totalCoursesInProgress: integer("total_courses_in_progress").default(0),

		// // Time-based metrics
		// avgSessionDuration: decimal("avg_session_duration", {
		// 	precision: 8,
		// 	scale: 2,
		// }),
		// peakActivityHours: text("peak_activity_hours").array(),

		// // Quality metrics (when review system is ready)
		// qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
		// responseTime: decimal("avg_response_time", { precision: 8, scale: 2 }), // hours

		// // Engagement metrics
		// forumParticipation: integer("forum_participation").default(0),
		// studentInteractions: integer("student_interactions").default(0),

		// On what term do we count active users? Daily, weekly, monthly, or others?
		// totalActiveUsers: integer("total_active_users").default(0),
		// On what term do we count engagements? Daily, weekly, monthly, or others?
		// totalEngagements: integer("total_engagements").default(0),

		// The following is commented out because it should be handled in it's own related vendor and org financial metrics table
		// // Financial metrics
		// totalRevenueGenerated: decimal("total_revenue_generated", {
		// 	precision: 12,
		// 	scale: 2,
		// }).default("0"),
		// totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).default(
		// 	"0",
		// ),
		// revenueSharePercentage: decimal("revenue_share_percentage", {
		// 	precision: 5,
		// 	scale: 2,
		// }).default("70.00"),
		// // The following is commented out because the review system is not implemented yet, but will be in the future
		// // Performance metrics
		// avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default(
		// 	"0.00",
		// ),
		// totalReviews: integer("total_reviews").default(0),
		// completionRate: decimal("completion_rate", {
		// 	precision: 5,
		// 	scale: 2,
		// }).default("0.00"),
		// studentSatisfactionScore: decimal("student_satisfaction_score", {
		// 	precision: 3,
		// 	scale: 2,
		// }).default("0.00"),
		// The following is commented out because it's not needed for now, but may be added later in this way or in some other way if seems valuable
		// // Trust and safety
		// trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default(
		// 	"0.00",
		// ),
		// lastTrustScoreUpdate: timestamp("last_trust_score_update").defaultNow(),
		// Last updated

		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${userInstructorProfileSkillTableName}_profile_id`).on(t.profileId),
		index(`idx_${userInstructorProfileSkillTableName}_last_updated`).on(t.lastUpdatedAt),
		index(`idx_${userInstructorProfileSkillTableName}_created_at`).on(t.createdAt),
		index(`idx_${userInstructorProfileSkillTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${userInstructorProfileSkillTableName}_rating_total`).on(t.ratingTotal),
		index(`idx_${userInstructorProfileSkillTableName}_rating_count`).on(t.ratingCount),
		index(`idx_${userInstructorProfileSkillTableName}_rating_avg`).on(t.ratingAvg),
		index(`idx_${userInstructorProfileSkillTableName}_total_reviews`).on(t.totalReviews),
	],
);
// TODO:
// // Don't store aggregated metrics in profile - calculate on demand
// // Use dedicated analytics tables for time-series data
// orgInstructorAnalytics: {
//   instructorId, orgId, period, activeUsers, engagements, periodType: "daily|weekly|monthly"
// }
const userInstructorProfileSkillI18nTableName = `${userTableName}_instructor_profile_skill_i18n`;
export const userInstructorProfileCoursesMetrics = table(
	userInstructorProfileSkillI18nTableName,
	{
		id: textCols.id().notNull(),
		profileId: textCols
			.idFk("profile_id")
			.references(() => userInstructorProfile.id, { onDelete: "cascade" })
			.notNull(),
		amount: integer("amount").default(0),

		totalRevenueGenerated: decimal("total_revenue_generated", {
			precision: 12,
			scale: 2,
		}).default("0"),
		totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).default("0"),

		totalCompletedByStudents: integer("total_completed_by_students").default(0),
		totalInProgressByStudents: integer("total_in_progress_by_students").default(0),

		ratingTotal: numericCols.ratingTotal("rating_total").default(0),
		ratingCount: numericCols.ratingCount("rating_count").default(0),
		ratingAvg: numericCols.ratingAgg("rating_avg").default("0.00"),
		totalReviews: integer("total_reviews").default(0),
		// totalActive: integer("total_courses_active").default(0),
		// totalArchived: integer("total_courses_archived").default(0),
		// totalPending: integer("total_courses_pending").default(0),
		// totalDraft: integer("total_courses_draft").default(0),
		// totalRejected: integer("total_courses_rejected").default(0),
		// totalPublished: integer("total_courses_published").default(0),
		// totalUnpublished: integer("total_courses_unpublished").default(0),
		// totalScheduled: integer("total_courses_scheduled").default(0),
		// totalCancelled: integer("total_courses_cancelled").default(0),
		// totalFailed: integer("total_courses_failed").default(0),
		// totalWaitingForApproval: integer("total_courses_waiting_for_approval").default(
		// 	0,
		// ),
		// totalWithReviews: integer("total_courses_with_reviews").default(0),
		// totalWithRatings: integer("total_courses_with_ratings").default(0),
		// totalWithFeedback: integer("total_courses_with_feedback").default(0),
		// totalWithCertificates: integer("total_courses_with_certificates").default(0),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${userInstructorProfileSkillI18nTableName}_profile_id`).on(t.profileId),
		index(`idx_${userInstructorProfileSkillI18nTableName}_created_at`).on(t.createdAt),
		index(`idx_${userInstructorProfileSkillI18nTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${userInstructorProfileSkillI18nTableName}_rating_total`).on(t.ratingTotal),
		index(`idx_${userInstructorProfileSkillI18nTableName}_rating_count`).on(t.ratingCount),
		index(`idx_${userInstructorProfileSkillI18nTableName}_rating_avg`).on(t.ratingAvg),
		index(`idx_${userInstructorProfileSkillI18nTableName}_total_reviews`).on(t.totalReviews),
	],
);
