import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgTable as table,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
// Assuming these tables exist in your schema
import { createdAt, fk, id, updatedAt, userTableName } from "../../../_utils/helpers";
import { instructorOrgAffiliation } from "../../../org/schema";
import { product } from "../../../product/schema";
import { contactInfo } from "../../../system/contact-info/schema";
import { seoMetadata } from "../../../system/seo/schema";
import { user } from "../../../user/schema";

/**
 * Instructor Profile - User-based content creator identity
 *
 * @businessLogic Individual instructor profile for course creation
 * Can participate across multiple organizations while maintaining identity
 */
export const userInstructorProfile = table(
	`${userTableName}_instructor_profile`,
	{
		id: id.notNull(),
		userId: text(`${userTableName}_id`)
			.notNull()
			.references(() => user.id),
		slug: text("slug").notNull(),
		verifiedAt: boolean("verified_at").default(false),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,

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
		uniqueIndex("uq_instructor_profile_slug").on(t.slug),
		index("idx_instructor_profile_user").on(t.userId),
		index("idx_instructor_profile_verified").on(t.verifiedAt),
	],
);

export const userInstructorProfileTranslation = table(
	`${userTableName}_instructor_profile_translation`,
	{
		id: id.notNull(),
		userInstructorProfileId: fk(`${userTableName}_instructor_profile_id`)
			.references(() => userInstructorProfile.id, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// // Professional identity
		// // Translatable instructor fields
		professionalTitle: text("professional_title"),
		bio: text("bio"),
		// specialization: text("specialization"),

		// // Teaching preferences (localized)
		// teachingPhilosophy: text("teaching_philosophy"),
		// studentMessage: text("student_message"), // Welcome message to students

		// SEO metadata reference
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_user_instructor_profile_translation_locale").on(
			t.userInstructorProfileId,
			t.locale,
		),
		uniqueIndex("uq_user_instructor_profile_translation_default")
			.on(t.userInstructorProfileId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

export const userInstructorProfileContactInfo = table(
	`${userTableName}_instructor_profile_contact_info`,
	{
		id: id.notNull(),
		instructorProfileId: text("instructor_profile_id")
			.notNull()
			.references(() => userInstructorProfile.id, { onDelete: "cascade" }),
		contactInfoId: text("contact_info_id")
			.notNull()
			.references(() => contactInfo.id, { onDelete: "cascade" }),
		isPrimary: boolean("is_primary").default(false),
		createdAt,
	},
	(t) => [
		index("idx_instructor_contact_profile").on(t.instructorProfileId),
		index("idx_instructor_contact_info").on(t.contactInfoId),
		uniqueIndex("uq_instructor_contact_primary")
			.on(t.instructorProfileId, t.isPrimary)
			.where(eq(t.isPrimary, true)),
	],
);

/**
 * Instructor Revenue Tracking
 *
 * @businessLogic Revenue attribution for instructor course creators
 * Supports the vendorRevenue connection mentioned in course schema
 */
export const userInstructorProfileRevenue = table(
	`${userTableName}_instructor_profile_revenue`,
	{
		id: id.notNull(),
		instructorMembershipId: text("instructor_membership_id")
			.notNull()
			.references(() => instructorOrgAffiliation.id),
		productId: text("product_id")
			.notNull()
			.references(() => product.id),
		// Connect to order/transaction tables when implemented
		orderId: text("order_id"), // Will reference order table
		revenueAmount: decimal("revenue_amount", { precision: 12, scale: 2 }),
		sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }),
		paidAt: timestamp("paid_at"),
		createdAt,
	},
	(t) => [
		index("idx_user_instructor_profile_revenue_membership").on(t.instructorMembershipId),
		index("idx_user_instructor_profile_revenue_product").on(t.productId),
		index("idx_user_instructor_profile_revenue_order").on(t.orderId),
	],
);

export const userInstructorProfileMetrics = table(
	`${userTableName}_instructor_profile_metrics`,
	{
		id: id.notNull(),
		userInstructorProfileId: fk(`${userTableName}_instructor_profile_id`)
			.references(() => userInstructorProfile.id, { onDelete: "cascade" })
			.notNull(),
		// Engagement metrics
		totalStudents: integer("total_students").default(0),

		avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"),
		totalReviews: integer("total_reviews").default(0),

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
		lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_instructor_metrics_instructor").on(t.userInstructorProfileId),
		index("idx_instructor_metrics_last_updated").on(t.lastUpdatedAt),
	],
);
export const userInstructorProfileCoursesMetrics = table(
	`${userTableName}_instructor_profile_courses_metrics`,
	{
		id: id.notNull(),
		userInstructorProfileId: fk(`${userTableName}_instructor_profile_id`)
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

		avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"),
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
	},
	(_t) => [],
);
