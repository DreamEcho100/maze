import { integer } from "drizzle-orm/pg-core";
import { numericCols } from "#db/schema/_utils/cols/numeric.js";
import {
	userJobProfileIdFkCol,
	userJobProfileIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-profile-id.js";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
// Assuming these tables exist in your schema
import { table } from "../../../_utils/tables.js";
import { skill } from "../../../general/skill/schema";
import { userTableName } from "../../_utils/helpers";

// refs
// <https://github.com/AminRezaeeyan/LinkedOn/blob/main/server/src/main/resources/databaseSetUp.sql>
// <https://github.com/dhruv-goyal-10/Linkedin-Clone-backend/blob/master/project/Profile/models.py>

// TODO: change the concept from `userJobProfile` to `userProfile_career` or `userProfile_identity`
// This will allow to have multiple profiles for different purposes, e.g., job, student,
// mentor, etc., and will allow to have multiple profiles for the same user in different orgs
// or even in the same org, e.g., job profile for one course and student
// profile for another course, or mentor profile for another course, etc.
const userJobProfileTableName = `${userTableName}_job_profile`;
/**
 * Job Profile - User-based content creator identity
 *
 * @businessLogic Individual job profile for course creation
 * Can participate across multiple orgs while maintaining identity
 */
export const userJobProfile = table(
	userJobProfileTableName,
	{
		// id: textCols.idPk().notNull(),
		userProfileId: userProfileIdFkCol().primaryKey().notNull(),
		// userId: userIdFkCol().notNull(),
		slug: textCols.slug().notNull(),
		verifiedAt: temporalCols.business.verifiedAt(),
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		// TODO: correct any unique check that it's table has the `deletedAt` column
		deletedAt: temporalCols.audit.deletedAt(),

		displayName: textCols.displayName().notNull(),
		headline: textCols.tagline("headline").notNull(),
		bio: textCols.shortDescription("bio").notNull(),
		// requirement: jsonb("requirement"), // JSON structure for custom requirements
		// specialization: textCols.tagline("specialization").notNull(),
		// location: textCols.location("location").notNull(),
		// industry: textCols.tagline("industry").notNull(),
		// jobStatus: varchar('job_status', { length: 50 }).notNull().checkIn(['active', 'inactive', 'suspended', 'completed']),
		// state: varchar('job_status', { length: 50 }).notNull().checkIn(['open_to_work', 'open_to_hiring', 'open_to_providing_services', 'none']),

		// degrees, certificates, or achievements
		// skills: [String],
		// experience: [
		// 	{
		// 		title: String,
		// 		company: String, // Organization???
		// 		startDate: Date,
		// 		endDate: Date,
		// 		description: String,
		//		isCurrentlyWorking: Boolean,
		//		employmentType: String, // "full-time", "part-time", "contract", "internship"
		//		skills: [String],
		//		tagline: String, // Short description or tagline for the experience
		//		dateOfBirth: Date, // Maybe removed to the main user profile table instead
		// 	},
		// ],
		// education: [
		// 	{
		// 		school: String,
		// 		degree: String,
		//		grade: String,
		// 		fieldOfStudy: String,
		//		tagline: String,
		// 		startYear: Number,
		// 		startMonth: Number,
		// 		startDay: Number,
		// 		endYear: Number,
		// 		endMonth: Number,
		// 		endDay: Number,
		//		description: String,
		//		activities: String,
		// 	},
		// ],
		// connections: [
		// 	{
		// 		type: mongoose.Schema.Types.ObjectId,
		// 		ref: "User",
		// 	},
		// ],

		// languages
		// specialties
		// certifications

		// The following is commented out because it should be handled in it's own related tables, maybe in the same way as LinkedIn Learning or Udemy, with as many tables as needed
		// // Job identity
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

		// // Job metrics
		// totalStudents: integer("courses_students_total").default(0),
		// totalCourses: integer("courses_total").default(0),
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
	(cols) => [
		// // uniqueIndex("uq_job_user").on(cols.userId),
		...userProfileIdFkExtraConfig({
			tName: userJobProfileTableName,
			cols,
		}),
		uniqueIndex({
			tName: userJobProfileTableName,
			// Q: a unique index on the slug only or on the userProfileId and slug?
			cols: [cols.slug],
		}),
		...multiIndexes({
			tName: userJobProfileTableName,
			colsGrps: [
				{ cols: [cols.slug] },
				{ cols: [cols.displayName] },
				{ cols: [cols.headline] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.verifiedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
		// check(`ck_${userJobProfileTableName}_job_profile_type_enforcement`,
		//   sql`EXISTS(SELECT 1 FROM ${userProfileTableName} WHERE id = ${cols.userProfileId} AND type = 'job')`),
	],
);
// TODO: Metrics
// Instead of storing aggregates in profiles, use dedicated analytics
// orgJobAnalyticsSummary: {
//   jobId, orgId, lastCalculatedAt,
//   totalCourses, totalStudents, avgRating, totalRevenue
// }

// orgJobAnalyticsTimeSeries: {
//   jobId, orgId, period, periodType,
//   activeUsers, engagements, revenue, enrollments
// }

// IQ: s I18n reeeeeeeeeeeeeeeeeeeeeeeally needed here or is it overkill? what would be the value of having or not having it?
// export const userJobProfileI18n = buildUserI18nTable(userJobProfileTableName)(
// 	{
// 		jobProfileId: textCols
// 			.idFk("job_profile_id")
// 			.references(() => userJobProfile.userProfileId, {
// 				onDelete: "cascade",
// 			})
// 			.notNull(),
// 		// // Job identity
// 		// // Translatable job fields
// 		professionalTitle: textCols.title("professional_title").notNull(),
// 		specialization: textCols.shortDescription("specialization").notNull(),
// 		// specialization: text("specialization"),

// 		// // Teaching preferences (localized)
// 		// teachingPhilosophy: text("teaching_philosophy"),
// 		// studentMessage: text("student_message"), // Welcome message to students

// 		// SEO metadata reference
// 		seoMetadataId: seoMetadataIdFkCol(),
// 	},
// 	{
// 		fkKey: "jobProfileId",
// 		extraConfig: (cols, tName) => [index(`idx_${tName}_job_profile_id`).on(cols.jobProfileId)],
// 	},
// );

const userJobProfileSkillTableName = `${userTableName}_job_profile_skill`;
export const userJobProfileSkill = table(
	userJobProfileSkillTableName,
	{
		id: textCols.idPk().notNull(),
		jobProfileId: userJobProfileIdFkCol().notNull(),
		skillId: textCols
			.idFk("skill_id")
			// .references(() => skill.id, { onDelete: "cascade" })
			.notNull(),

		// proficiency: varchar('proficiency', { length: 50 }).checkIn(['beginner', 'intermediate', 'expert']),

		createdAt: temporalCols.audit.createdAt(),
		// lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		// endorsement connections???

		// totalCourses: integer("courses_total").default(0),
		// totalCoursesCompleted: integer("courses_completed_total").default(0),
		// totalCoursesInProgress: integer("courses_in_progress_total").default(0),

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
		// totalReviews: integer("courses_reviews_total").default(0),
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
	},
	(cols) => [
		// index(`idx_${userJobProfileSkillTableName}_job_profile_id`).on(cols.jobProfileId),
		// index(`idx_${userJobProfileSkillTableName}_created_at`).on(cols.createdAt),
		// // index(`idx_${userJobProfileSkillTableName}_last_updated_at`).on(cols.lastUpdatedAt),
		...userJobProfileIdFkExtraConfig({
			tName: userJobProfileSkillTableName,
			cols,
			colFkKey: "jobProfileId",
		}),
		...multiForeignKeys({
			tName: userJobProfileSkillTableName,
			fkGroups: [
				{
					cols: [cols.skillId],
					foreignColumns: [skill.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: userJobProfileSkillTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				// { cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

// // Skill Endorsements Table (LinkedIn-style skill endorsements)
// export const skillEndorsements = pgTable('skill_endorsements', {
//   id: serial('id').primaryKey(),
//   skill_id: integer('skill_id').notNull().references(() => skills.id),
//   endorsed_by_user_id: integer('endorsed_by_user_id').notNull().references(() => users.id),
//   endorsed_user_id: integer('endorsed_user_id').notNull().references(() => users.id),
//   endorsement_date: timestamp('endorsement_date').defaultNow(),
// });

// // Recommendations Table (Recommendations written by others)
// export const recommendations = pgTable('recommendations', {
//   id: serial('id').primaryKey(),
//   job_profile_id: integer('job_profile_id').notNull().references(() => jobProfiles.id),
//   recommended_by: integer('recommended_by').notNull().references(() => users.id),
//   recommendation_text: text('recommendation_text').notNull(),
//   created_at: timestamp('created_at').defaultNow(),
// });

// // Education Table (Store academic background of the user)
// export const education = pgTable('education', {
//   id: serial('id').primaryKey(),
//   user_id: integer('user_id').notNull().references(() => users.id),
//   degree: varchar('degree', { length: 255 }),
//   school_name: varchar('school_name', { length: 255 }),
//   field_of_study: varchar('field_of_study', { length: 255 }),
//   start_date: date('start_date'),
//   end_date: date('end_date'),
//   created_at: timestamp('created_at').defaultNow(),
// });

// // Certifications Table (Store professional certifications of the user)
// export const certifications = pgTable('certifications', {
//   id: serial('id').primaryKey(),
//   user_id: integer('user_id').notNull().references(() => users.id),
//   certification_name: varchar('certification_name', { length: 255 }),
//   issuing_organization: varchar('issuing_organization', { length: 255 }),
//   issue_date: date('issue_date'),
//   expiration_date: date('expiration_date'),
//   created_at: timestamp('created_at').defaultNow(),
// });

// // User Activity Log Table (Track all user activities)
// export const userActivityLog = pgTable('user_activity_log', {
//   id: serial('id').primaryKey(),
//   user_id: integer('user_id').notNull().references(() => users.id),
//   activity_type: varchar('activity_type', { length: 255 }),
//   activity_details: jsonb('activity_details'),
//   activity_date: timestamp('activity_date').defaultNow(),
// });

// export const jobCompanies = pgTable("job_companies", {
// 	id: serial("id").primaryKey(),
// 	name: varchar("name", { length: 255 }).notNull().unique(),
// 	industry: varchar("industry", { length: 255 }),
// 	websiteUrl: varchar("website_url", { length: 255 }),
// 	location: varchar("location", { length: 255 }),
// });

// TODO:
// // Don'cols store aggregated metrics in profile - calculate on demand
// // Use dedicated analytics tables for time-series data
// orgJobAnalytics: {
//   jobId, orgId, period, activeUsers, engagements, periodType: "daily|weekly|monthly"
// }

const userJobProfileMetricsTableName = `${userTableName}_job_profile_metrics`;
export const userJobProfileMetrics = table(
	userJobProfileMetricsTableName,
	{
		id: textCols.idPk().notNull(),
		jobProfileId: userJobProfileIdFkCol().notNull(),

		// Engagement metrics

		total: integer("total").default(0),

		ratingTotal: numericCols.ratingTotal("rating_total").default(0),
		ratingCount: numericCols.ratingCount("rating_count").default(0),
		ratingAvg: numericCols.ratingAgg("rating_avg").default("0.00"),

		reviewsCount: integer("reviews_count").default(0),
		revenueGeneratedTotal: numericCols.currency.price("revenue_generated_total").default("0.00"),
		payoutsTotal: numericCols.currency.price("payouts_total").default("0.00"),
		studentsCount: integer("students_count").default(0),
		completedByStudentsCount: integer("completed_by_students_count").default(0),
		inProgressByStudentsCount: integer("in_progress_by_students_count").default(0),

		coursesTotal: integer("courses_total").default(0),
		coursesRatingTotal: numericCols.ratingTotal("courses_rating_total").default(0),
		coursesRatingCount: numericCols.ratingCount("courses_rating_count").default(0),
		coursesRatingAvg: numericCols.ratingAgg("courses_rating_avg").default("0.00"),
		coursesReviewsCount: integer("courses_reviews_count").default(0),
		coursesRevenueGeneratedTotal: numericCols.currency
			.price("courses_revenue_generated_total")
			.default("0.00"),
		coursesPayoutsTotal: numericCols.currency.price("courses_payouts_total").default("0.00"),
		coursesStudentsCount: integer("courses_students_count").default(0),
		courseCompletedByStudentsCount: integer("courses_completed_by_students_count").default(0),
		coursesInProgressByStudentsCount: integer("courses_in_progress_by_students_count").default(0),

		// calculationPeriod: text("calculation_period"), // "all_time", "last_30_days", etc.

		// totalActive: integer("courses_active_total").default(0),
		// totalArchived: integer("courses_archived_total").default(0),
		// totalPending: integer("courses_pending_total").default(0),
		// totalDraft: integer("courses_draft_total").default(0),
		// totalRejected: integer("courses_rejected_total").default(0),
		// totalPublished: integer("courses_published_total").default(0),
		// totalUnpublished: integer("courses_unpublished_total").default(0),
		// totalScheduled: integer("courses_scheduled_total").default(0),
		// totalCancelled: integer("courses_cancelled_total").default(0),
		// totalFailed: integer("courses_failed_total").default(0),
		// totalWaitingForApproval: integer("courses_waiting_for_approval_total").default(
		// 	0,
		// ),
		// totalWithReviews: integer("courses_with_reviews_total").default(0),
		// totalWithRatings: integer("courses_with_ratings_total").default(0),
		// totalWithFeedback: integer("courses_with_feedback_total").default(0),
		// totalWithCertificates: integer("courses_with_certificates_total").default(0),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// index(`idx_${userJobProfileMetricsTableName}_created_at`).on(cols.createdAt),
		// index(`idx_${userJobProfileMetricsTableName}_last_updated`).on(cols.lastUpdatedAt),
		...userJobProfileIdFkExtraConfig({
			tName: userJobProfileMetricsTableName,
			cols,
			colFkKey: "jobProfileId",
		}),
		// uniqueIndex({
		// 	tName: userJobProfileMetricsTableName,
		// 	cols: [cols.jobProfileId],
		// }),
		...multiIndexes({
			tName: userJobProfileMetricsTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.total] },
				{ cols: [cols.ratingTotal] },
				{ cols: [cols.ratingCount] },
				{ cols: [cols.ratingAvg] },
				{ cols: [cols.reviewsCount] },
				{ cols: [cols.revenueGeneratedTotal] },
				{ cols: [cols.payoutsTotal] },
				{ cols: [cols.studentsCount] },
				{ cols: [cols.completedByStudentsCount] },
				{ cols: [cols.inProgressByStudentsCount] },
				{ cols: [cols.coursesTotal] },
				{ cols: [cols.coursesRatingTotal] },
				{ cols: [cols.coursesRatingCount] },
				{ cols: [cols.coursesRatingAvg] },
				{ cols: [cols.coursesReviewsCount] },
				{ cols: [cols.coursesRevenueGeneratedTotal] },
				{ cols: [cols.coursesPayoutsTotal] },
				{ cols: [cols.coursesStudentsCount] },
				{ cols: [cols.courseCompletedByStudentsCount] },
				{ cols: [cols.coursesInProgressByStudentsCount] },
			],
		}),
	],
);

// export const userJobProfileAnalyticsTimeSeries = table(
// 	"user_job_profile_analytics_time_series",
// 	{
// 		id: textCols.idPk().notNull(),
// 		jobProfileId: textCols
// 			.idFk("job_profile_id")
// 			.references(() => userJobProfile.userProfileId),
// 		orgId: orgIdFkCol(),

// 		// Time period
// 		period: date("period").notNull(), // 2024-01-01 for monthly, 2024-01-01 for daily
// 		periodType: pgEnum("period_type", ["daily", "weekly", "monthly"])("period_type"),

// 		// Metrics for this period
// 		activeUsers: integer("active_users").default(0),
// 		engagements: integer("engagements").default(0),
// 		revenue: numericCols.currency.amount("revenue").default(0),
// 		enrollments: integer("enrollments").default(0),
// 	},
// );

// The following is halted for now on this phase _(the mvp)_
/*
### **8. Job Verification (Industry Standard)**
```javascript
// ✅ INDUSTRY STANDARD: LinkedIn/Upwork verification system
// Used by: LinkedIn, Upwork, Fiverr, professional platforms
export const userJobProfileVerification = table(
  'user_job_profile_verification',
  {
    id: textCols.idPk().notNull(),
    jobProfileId: textCols.idFk("job_profile_id")
      .references(() => userJobProfile.userProfileId),
    
    // Verification types
    verificationType: pgEnum("verification_type", [
      "identity", "education", "work_experience", "skills_assessment", 
      "background_check", "tax_information", "payment_method"
    ])("verification_type").notNull(),
    
    // Verification status
    status: pgEnum("verification_status", [
      "pending", "in_review", "approved", "rejected", "expired", "requires_update"
    ])("status").default("pending"),
    
    // Evidence
    submittedDocuments: jsonb("submitted_documents"), // URLs, metadata
    verificationScore: integer("verification_score"), // 0-100
    
    // Process tracking
    submittedAt: temporalCols.audit.createdAt("submitted_at"),
    reviewedAt: temporalCols.business.verifiedAt("reviewed_at"),
    reviewedBy: textCols.idFk("reviewed_by"), // Admin/system user
    
    // Expiration
    expiresAt: temporalCols.business.endsAt("expires_at"),
    
    // Verification provider (third-party)
    verificationProvider: textCols.provider("verification_provider"), // "jumio", "onfido", "persona"
    externalVerificationId: textCols.code("external_verification_id"),
    
    createdAt: temporalCols.audit.createdAt(),
  }
);
*/
