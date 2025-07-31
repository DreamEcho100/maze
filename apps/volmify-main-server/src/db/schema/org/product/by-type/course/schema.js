import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	pgTable as table,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { lmsCols } from "#db/schema/_utils/cols/lms";
import { numericCols } from "#db/schema/_utils/cols/numeric";
import { temporalCols } from "#db/schema/_utils/cols/temporal";
import { textCols } from "#db/schema/_utils/cols/text";
import { seoMetadataIdFkCol } from "#db/schema/general/seo/schema.js";
import { skill } from "#db/schema/general/skill/schema.js";
// import { skill } from "#db/schema/general/skill/schema";
import { orgMemberIdFkCol } from "#db/schema/org/member/_utils/fk.js";
import { buildOrgI18nTable, orgTableName } from "../../../_utils/helpers";
import { orgLesson } from "../../../lesson/schema";
import { orgProduct } from "../../schema";

const orgProductCourseTableName = `${orgTableName}_product_course`;
// Should it be a level, difficulty, or consider both? what is the difference between a level and a difficulty in this context? why? pros and cons?
export const orgProductCourseLevelEnum = pgEnum(`${orgProductCourseTableName}_level`, [
	"beginner",
	"intermediate",
	"advanced",
	"expert",
]);

export const orgProductCourse = table(
	orgProductCourseTableName,
	{
		id: textCols.idPk().notNull(),
		// Hmm, should the connection be to the `product` table or the `productVariant` table? why? pros and cons?
		// Which make sense to this project?
		// I mean, what is the difference between a product and a product variant, how they work together, how they are related, and help in this context?
		productId: textCols
			.idFk("product_id")
			.references(() => orgProduct.id)
			.notNull(),
		estimatedDurationInMinutes: integer("estimated_duration_in_minutes").default(0).notNull(),
		// prerequisites ???
		//  targetAudience ???
		// completionCriteria ???
		// allowDiscussions ???

		/**
		 * Describes the learner's progress or stage in their educational journey.
		 * @learningProgression Educational level for prerequisite management and learning pathways
		 * @customerSegmentation Enables clear course sequencing and student self-selection
		 * @qualitativeMeasure Human-readable prerequisite knowledge indicator
		 */
		level: orgProductCourseLevelEnum("level").default("beginner").notNull(),

		/**
		 * Measures how challenging the course is, from easy to extremely difficult.
		 * @contentComplexity Granular difficulty rating within educational level (1-10 scale)
		 * @quantitativeMeasure Enables precise course matching and recommendation algorithms
		 * @creatorInput Org Member-assessed complexity for accurate course positioning
		 */
		difficulty: integer("difficulty").default(5), // 1-10 scale

		userLevelRatingTotal: numericCols.ratingTotal("user_level_rating_total").default(0),
		userLevelRatingCount: numericCols.ratingCount("user_level_rating_count").default(0),
		/**
		 * @userFeedback Average user rating for course level appropriateness
		 * @qualityAssurance Community-validated level accuracy for creator credibility
		 * @recommendationEngine Data for improving course discovery algorithms
		 */
		userLevelRatingAvg: numericCols.ratingAgg("user_level_rating_avg").default("0.00"),

		userDifficultyRatingTotal: numericCols.ratingTotal("user_difficulty_rating_total").default(0),
		userDifficultyRatingCount: numericCols.ratingCount("user_difficulty_rating_count").default(0),
		/**
		 * @userFeedback Average user rating for course difficulty assessment
		 * @learningOptimization Community feedback for course improvement and positioning
		 * @platformIntelligence Aggregate data for marketplace recommendation systems
		 */
		userDifficultyRatingAvg: numericCols.ratingAgg("user_difficulty_rating_avg").default("0.00"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		// The following fields and joins can be inferred from the `product` table as the `course` table is a specialization/type of the `product` table in a CTI way
		// thumbnail, vendors, status, deletedAt: temporalCols.audit.deletedAt(), title, description, seoMetadata, slug

		// The pricing model will be handled by the `product` table
		// And the pricing model will be in a CTI many-to-many relationship with the `product` table
		// As it can be subscription, one-time purchase, or free
	},
	(t) => [
		index(`idx_${orgProductCourseTableName}_product`).on(t.productId),
		index(`idx_${orgProductCourseTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${orgProductCourseTableName}_level`).on(t.level),
		index(`idx_${orgProductCourseTableName}_difficulty`).on(t.difficulty),
		index(`idx_${orgProductCourseTableName}_duration`).on(t.estimatedDurationInMinutes),
		index(`idx_${orgProductCourseTableName}_level_rating_total`).on(t.userLevelRatingTotal),
		index(`idx_${orgProductCourseTableName}_level_rating_count`).on(t.userLevelRatingCount),
		index(`idx_${orgProductCourseTableName}_level_rating_avg`).on(t.userLevelRatingAvg),
		index(`idx_${orgProductCourseTableName}_difficulty_rating_total`).on(
			t.userDifficultyRatingTotal,
		),
		index(`idx_${orgProductCourseTableName}_difficulty_rating_count`).on(
			t.userDifficultyRatingCount,
		),
		index(`idx_${orgProductCourseTableName}_difficulty_rating_avg`).on(t.userDifficultyRatingAvg),
	],
);

export const orgProductCourseI18n = buildOrgI18nTable(orgProductCourseTableName)(
	{
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		/**
		 * @localizedContent Course-specific localized metadata
		 * @marketingStrategy Region-specific course positioning and messaging
		 */
		prerequisites: text("prerequisites").array(),
		targetAudience: text("target_audience"),
		completionCriteria: text("completion_criteria"),

		/**
		 * @marketingContent Simple learning outcomes for course marketing
		 * @customerFacing User-friendly outcomes vs structured skill data
		 */
		learningOutcomes: text("learning_outcomes").array(),
	},
	{
		fkKey: "courseId",
		// extraConfig: (self, tableName) => [],
	},
);

const orgProductCourseSkillTableName = `${orgProductCourseTableName}_skill`;
/**
 * COURSE SKILLS - Structured Course Skill Attribution
 */
export const orgProductCourseSkill = table(
	orgProductCourseSkillTableName,
	{
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		skillId: textCols
			.idFk("skill_id")
			.references(() => skill.id)
			.notNull(),

		// /**
		//  * @skillRole Whether skill is taught or prerequisite
		//  * @learningPathway Enables prerequisite validation and learning path construction
		//  */
		// isLearningOutcome: boolean("is_learning_outcome").default(true), // vs prerequisite

		// /**
		//  * @skillMastery Target proficiency level for learning outcomes
		//  * @marketplaceMatching Enables precise skill level matching for recommendations
		//  */
		// proficiencyLevel: text("proficiency_level"), // "beginner", "intermediate", "advanced", "expert"

		/**
		 * @skillWeight Importance of this skill in course curriculum (1-10)
		 * @analyticsWeight Higher weight skills drive recommendation algorithms
		 */
		weight: integer("weight").default(5),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgProductCourseSkillTableName}`).on(t.courseId, t.skillId),
		// index(`idx_${orgProductCourseSkillTableName}_outcome`).on(t.isLearningOutcome),
		// index(`idx_${orgProductCourseSkillTableName}_proficiency`).on(t.proficiencyLevel),
		index(`idx_${orgProductCourseSkillTableName}_weight`).on(t.weight),
		index(`idx_${orgProductCourseSkillTableName}_course_id`).on(t.courseId),
		index(`idx_${orgProductCourseSkillTableName}_skill_id`).on(t.skillId),
		index(`idx_${orgProductCourseSkillTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${orgProductCourseSkillTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseSkillTableName}_deleted_at`).on(t.deletedAt),
		check(
			`ck_${orgProductCourseSkillTableName}_weight_range`,
			sql`${t.weight} >= 1 AND ${t.weight} <= 10`,
		),
	],
);

// TODO: add an i18n to `orgProductCourseSkill`

const orgMemberProductCourseChallengeRatingTableName = `${orgTableName}_member_product_course_challenge_rating`;
/**
 * Course Rating - Community-Driven Course Assessment
 *
 * @businessLogic User ratings for course level and difficulty accuracy enabling
 * community-driven quality assurance and course improvement feedback for jobs
 * within creator economy quality optimization workflows.
 */
export const orgMemberProductCourseChallengeRating = table(
	orgMemberProductCourseChallengeRatingTableName,
	{
		id: textCols.idPk().notNull(),
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		memberId: orgMemberIdFkCol().notNull(),

		/**
		 * @qualityFeedback User assessment of course level accuracy
		 * @creatorFeedback Helps jobs understand if course matches advertised level
		 */
		levelRatingTotal: numericCols.ratingTotal("level_rating_total").default(0),
		levelRatingCount: numericCols.ratingCount("level_rating_count").default(0),
		levelRatingAvg: numericCols.ratingAgg("level_rating_avg").default("0.00"),

		/**
		 * @complexityFeedback User assessment of course difficulty accuracy
		 * @courseImprovement Enables jobs to adjust content complexity based on feedback
		 */
		difficultyRatingTotal: integer("difficulty_rating_total").default(0),
		difficultyRatingCount: integer("difficulty_rating_count").default(0),
		difficultyRatingAvg: numericCols.ratingAgg("difficulty_rating_avg").default("0.00"),

		/**
		 * @qualitativeFeedback Optional explanation for ratings
		 * @jobInsights Detailed feedback for course improvement and creator development
		 */
		feedback: text("feedback"),

		// metadata: jsonb("metadata"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgMemberProductCourseChallengeRatingTableName}course__member`).on(
			t.courseId,
			t.memberId,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_course_id`).on(t.courseId),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_member_id`).on(t.memberId),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_level_rating_total`).on(
			t.levelRatingTotal,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_level_rating_count`).on(
			t.levelRatingCount,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_level_rating_avg`).on(
			t.levelRatingAvg,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_difficulty_rating_total`).on(
			t.difficultyRatingTotal,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_difficulty_rating_count`).on(
			t.difficultyRatingCount,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_difficulty_rating_avg`).on(
			t.difficultyRatingAvg,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_last_updated_at`).on(
			t.lastUpdatedAt,
		),
		// check(
		// 	`ck_${orgMemberProductCourseChallengeRatingTableName}_level_rating_range`,
		// 	sql`${t.levelRatingTotal} >= 1 AND ${t.levelRatingTotal} <= 10 AND ${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10`,
		// ),
		// check(
		// 	`ck_${orgMemberProductCourseChallengeRatingTableName}_difficulty_rating_range`,
		// 	sql`${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10 AND ${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10`,
		// ),
	],
);

const orgMemberProductCourseChallengeRatingHistoryTableName = `${orgMemberProductCourseChallengeRatingTableName}_history`;
export const orgMemberProductCourseChallengeRatingHistoryChangeReasonEnum = pgEnum(
	"org_member_product_course_challenge_rating_history_reason",
	[
		"updated", // User changed their rating (normal update)
		// Q: Should the `"corrected"` be allowed? and when it should be used and wheere?
		"corrected", // Admin or user fixed an error or mistake in the rating
		"initial", // The original/first rating entry
	],
);

export const orgMemberProductCourseChallengeRatingHistory = table(
	orgMemberProductCourseChallengeRatingHistoryTableName,
	{
		id: textCols.idPk().notNull(),
		ratingId: textCols.idFk("rating_id").references(() => orgMemberProductCourseChallengeRating.id),

		// Historical values
		previousLevelRating: numericCols.ratingTotal("previous_level_rating"),
		previousDifficultyRating: numericCols.ratingTotal("previous_difficulty_rating"),
		previousFeedback: text("previous_feedback"),

		// Change metadata
		changedAt: temporalCols.audit.createdAt(),
		reason: orgMemberProductCourseChallengeRatingHistoryChangeReasonEnum("reason"),
	},
);

const orgProductCourseModuleTableName = `${orgProductCourseTableName}_module`;
// Naming problem: should it be `module` or `section`?
export const orgProductCourseModule = table(
	orgProductCourseModuleTableName,
	{
		id: textCols.idPk().notNull(),
		courseId: textCols
			.idFk("product_course_id")
			.references(() => orgProductCourse.id)
			.notNull(),

		/**
		 * @contentOrg Module sequence within course structure
		 * @learningProgression Enables structured course progression and module dependencies
		 */
		sortOrder: numericCols.sortOrder().notNull(),

		// Q: Could the access be 0 and what does that mean?
		/**
		 * @accessControl Minimum variant access tier required for module access
		 * @businessModel Enables premium module gating for higher-tier purchases, where 0 means free
		 */
		requiredAccessTier: numericCols.accessTier("required_access_tier"),

		/**
		 * @learningRequirements Module completion requirements for course progression
		 * @educationalStructure Supports flexible learning path design
		 */
		isRequired: boolean("is_required").default(true),

		/**
		 * @timeEstimation Total estimated completion time for student planning
		 * @learningManagement Helps students plan study schedules and course commitment
		 */
		estimatedDurationInMinutes: integer("estimated_duration_in_minutes"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		// ???
		//  // Section settings
		//  settings: jsonb("settings"),
	},
	(t) => [
		uniqueIndex(`uq_${orgProductCourseModuleTableName}_sort`).on(t.courseId, t.sortOrder),
		index(`idx_${orgProductCourseModuleTableName}_course_id`).on(t.courseId),
		index(`idx_${orgProductCourseModuleTableName}_access_tier`).on(t.requiredAccessTier),
		index(`idx_${orgProductCourseModuleTableName}_required`).on(t.isRequired),
		index(`idx_${orgProductCourseModuleTableName}_duration`).on(t.estimatedDurationInMinutes),
		index(`idx_${orgProductCourseModuleTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseModuleTableName}_last_updated_at`).on(t.lastUpdatedAt),
		check(
			`ck_${orgProductCourseModuleTableName}_required_access_tier_range`,
			sql`${t.requiredAccessTier} >= 0`,
		),
		check(`ck_${orgProductCourseModuleTableName}_sort_order_range`, sql`${t.sortOrder} >= 0`),
	],
);

export const orgProductCourseModuleI18n = buildOrgI18nTable(orgProductCourseModuleTableName)(
	{
		moduleId: textCols
			.idFk("moduleId")
			.references(() => orgProductCourseModule.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "moduleId",
		extraConfig: (t, tName) => [index(`idx_${tName}_title`).on(t.title)],
	},
);

const orgProductCourseModuleSectionTableName = `${orgProductCourseTableName}_module_section`;
/**
 * Product Course Module Section - Learning Sub-Unit
 *
 * @businessLogic Sections organize lessons within modules enabling granular content
 * structure and flexible learning org for comprehensive educational content
 * management and student progress tracking workflows.
 */
export const orgProductCourseModuleSection = table(
	orgProductCourseModuleSectionTableName,
	{
		id: textCols.idPk().notNull(),
		moduleId: textCols
			.idFk("module_id")
			.references(() => orgProductCourseModule.id)
			.notNull(),

		/**
		 * @contentOrg Section sequence within module structure
		 * @learningFlow Enables logical content progression within learning units
		 */
		sortOrder: numericCols.sortOrder().notNull(),

		// Q: Could the access be 0 and what does that mean?
		/**
		 * @accessControl Optional additional access requirements for premium sections
		 * @businessFlexibility Enables section-level access control for advanced monetization, where 0 means free
		 */
		requiredAccessTier: numericCols.accessTier("required_access_tier"),

		/**
		 * @learningProgression Section completion requirements for module progression
		 * @educationalDesign Supports flexible section-based learning path design
		 */
		isRequired: boolean("is_required").default(true),

		/**
		 * @timeEstimation Total estimated completion time for student planning
		 * @learningManagement Helps students plan study schedules and course commitment
		 */
		estimatedDurationInMinutes: integer("estimated_duration_in_minutes"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgProductCourseModuleSectionTableName}_sort_order`).on(
			t.moduleId,
			t.sortOrder,
		),
		index(`idx_${orgProductCourseModuleSectionTableName}_module_id`).on(t.moduleId),
		index(`idx_${orgProductCourseModuleSectionTableName}_required_access_tier`).on(
			t.requiredAccessTier,
		),
		index(`idx_${orgProductCourseModuleSectionTableName}_is_required`).on(t.isRequired),
		index(`idx_${orgProductCourseModuleSectionTableName}_estimated_duration_in_minutes`).on(
			t.estimatedDurationInMinutes,
		),
		index(`idx_${orgProductCourseModuleSectionTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseModuleSectionTableName}_last_updated_at`).on(t.lastUpdatedAt),
		check(
			`ck_${orgProductCourseModuleSectionTableName}_required_access_tier_range`,
			sql`${t.requiredAccessTier} >= 0`,
		),
		check(
			`ck_${orgProductCourseModuleSectionTableName}_sort_order_range`,
			sql`${t.sortOrder} >= 0`,
		),
	],
);

export const orgProductCourseModuleSectionI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionTableName,
)(
	{
		sectionId: textCols
			.idFk("section_id")
			.references(() => orgProductCourseModuleSection.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "sectionId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_title`).on(t.title),
			index(`idx_${tName}_seo_metadata_id`).on(t.seoMetadataId),
		],
	},
);

const orgProductCourseModuleSectionLessonTableName = `${orgProductCourseTableName}_module_section_lesson`;
// The following will be for the lessons within the modules
// Things to consider for Lessons:
// - Are reusable across modules/courses
// - Have different types (video, rich-text, quiz, etc.)
// - Lessons per module can have different prerequisites (e.g., must complete lesson X before accessing lesson Y, no prerequisites, need to complete a quiz, etc.)
// - Different types of prerequisites per modules are related to the product payment model
// - Lessons can have different metadata (e.g., tags, categories, etc.)
/**
 * Product Course Module Section Lesson - Individual Learning Item
 *
 * @businessLogic Individual lessons within sections enabling granular content delivery
 * and progress tracking for comprehensive learning analytics and student engagement
 * optimization within structured educational content architecture.
 */
export const orgProductCourseModuleSectionLesson = table(
	orgProductCourseModuleSectionLessonTableName,
	{
		id: textCols.idPk().notNull(),

		sectionId: textCols
			.idFk("section_id")
			.references(() => orgProductCourseModuleSection.id)
			.notNull(),
		lessonId: textCols
			.idFk("lesson_id")
			.references(() => orgLesson.id)
			.notNull(),

		/**
		 * @contentSequence Lesson order within section for structured learning flow
		 * @educationalDesign Enables logical lesson progression and dependency management
		 */
		sortOrder: numericCols.sortOrder().notNull(),

		// Q: Could the access be 0 and what does that mean?
		/**
		 * @accessControl Lesson-level access requirements for granular content gating
		 * @monetizationStrategy Enables individual lesson gating for premium content, where 0 means free
		 */
		requiredAccessTier: numericCols.accessTier("required_access_tier"),

		/**
		 * @learningRequirements Complex prerequisite logic for advanced learning paths
		 * @educationalFlexibility Supports sophisticated learning progression requirements
		 */
		prerequisites: jsonb("prerequisites"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		// Example: {
		//   "required_lessons": ["lesson-123", "lesson-456"],
		//   "required_quiz_score": 80,
		//   "required_modules_completed": 2,
		//   "required_assignments": ["assignment-789"]
		// }

		// ???
		//  // Completion tracking
		//  completionCriteria
		//  minimumTimeRequired
		//  // Lesson settings (type-specific configurations)
		//  settings
	},
	(t) => [
		uniqueIndex(`uq_${orgProductCourseModuleSectionLessonTableName}_sort`).on(
			t.sectionId,
			t.sortOrder,
		),
		uniqueIndex(`uq_${orgProductCourseModuleSectionLessonTableName}`).on(t.sectionId, t.lessonId),
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_section_id`).on(t.sectionId),
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_lesson_id`).on(t.lessonId),
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_access_tier`).on(
			t.requiredAccessTier,
		),
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_last_updated_at`).on(
			t.lastUpdatedAt,
		),
		check(
			`ck_${orgProductCourseModuleSectionLessonTableName}_required_access_tier_range`,
			sql`${t.requiredAccessTier} >= 0`,
		),
		check(
			`ck_${orgProductCourseModuleSectionLessonTableName}_sort_order_range`,
			sql`${t.sortOrder} >= 0`,
		),
	],
);

// This table can be used to override the lesson metadata for a specific module
export const orgProductCourseModuleSectionLessonI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionLessonTableName,
)(
	{
		lessonId: textCols
			.idFk("lesson_id")
			.references(() => orgProductCourseModuleSectionLesson.id)
			.notNull(), // TODO: Since this table is for the i18n of the course module section lesson,
		// And it reference a lesson, and the lesson already have a an optional seo metadata, maybe add a seo metadata override behavior _(merge, override, etc...)_
		seoMetadataId: seoMetadataIdFkCol(),
		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "lessonId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_seo_metadata_id`).on(t.seoMetadataId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

// IMP: The lesson type related table are halted for now

const orgMemberProductCourseEnrollmentTableName = `${orgTableName}_member_product_course_enrollment`;
// User productCourseEnrollment & progress
export const orgMemberProductCourseEnrollmentStatusEnum = pgEnum(
	`${orgMemberProductCourseEnrollmentTableName}_enrollment_status`,
	[
		"not_started",
		"in_progress",
		"completed",
		// What're other valid types that will help in this project and used on other LMS systems?
	],
);
export const orgMemberProductCourseEnrollment = table(
	orgMemberProductCourseEnrollmentTableName,
	{
		/**
		 * @orgalIdentity Org member whose progress is tracked
		 * @businessRule Primary progress tracking identity for org learning
		 * @accessControl Enables role-based learning experiences and org analytics
		 */
		memberId: orgMemberIdFkCol().notNull(),
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		status: orgMemberProductCourseEnrollmentStatusEnum("status").default("not_started").notNull(),
		progressPercentage: lmsCols.progressPercentage(),
		completedAt: temporalCols.activity.completedAt(),

		// Access tracking
		firstAccessAt: timestamp("first_access_at"),
		lastAccessedAt: temporalCols.activity.lastAccessedAt(),
		totalTimeSpent: integer("total_time_spent_seconds").default(0),

		// Scheduling
		enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
		// Q: the payment plan of the product handles a similar cases to this so is this needed
		//  expectedCompletionDate ???
		//  accessExpiresAt ???

		// ???
		//  // Notes and admin fields
		//  enrollmentNotes
		//  adminNotes
		// /**
		//  * @engagementTracking Total learning time for org productivity analytics
		//  * @learningOptimization Helps optimize course content and delivery methods
		//  */
		// totalTimeSpentSeconds: integer("total_time_spent_seconds").default(0),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		primaryKey({ columns: [t.memberId, t.courseId] }),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_member_id`).on(t.memberId),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_course_id`).on(t.courseId),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_status`).on(t.status),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_progress_percentage`).on(
			t.progressPercentage,
		),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_completed_at`).on(t.completedAt),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_enrolled_at`).on(t.enrolledAt),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_last_access_at`).on(t.lastAccessedAt),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_last_updated_at`).on(t.lastUpdatedAt),
	],
);

const orgMemberLearningProfileTableName = `${orgTableName}_member_learning_profile`;
/**
 * USER LEARNING SUMMARY - Cross-Org Learning Profile
 *
 * @businessLogic Aggregated learning summary across all org memberships
 * enabling user-centric learning portfolio and cross-org skill tracking
 * for comprehensive professional development and career progression analytics.
 */
export const orgMemberLearningProfile = table(
	orgMemberLearningProfileTableName,
	{
		id: textCols.idPk().notNull(),
		memberId: orgMemberIdFkCol().notNull().unique(),

		/**
		 * @learningPortfolio Aggregated learning statistics across orgs
		 * @professionalDevelopment Comprehensive learning achievements for career tracking
		 */
		totalCoursesCompleted: integer("total_courses_completed").default(0),
		totalLearningInMinutes: integer("total_learning_in_minutes").default(0),
		totalCertificatesEarned: integer("total_certificates_earned").default(0),

		/**
		 * @skillPortfolio Aggregated skills across the org learning
		 * @marketplaceProfile Skills summary for marketplace recommendations and matching
		 */
		acquiredSkills: jsonb("acquired_skills"), // Array of skills with proficiency levels

		/**
		 * @learningPreferences User learning behavior patterns for personalization
		 * @platformIntelligence Data for improving course recommendations and platform experience
		 */
		learningMetadata: jsonb("learning_metadata"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${orgMemberLearningProfileTableName}_member_id`).on(t.memberId),

		index(`idx_${orgMemberLearningProfileTableName}_total_courses_completed`).on(
			t.totalCoursesCompleted,
		),
		index(`idx_${orgMemberLearningProfileTableName}_total_learning_in_minutes`).on(
			t.totalLearningInMinutes,
		),
		index(`idx_${orgMemberLearningProfileTableName}_total_certificates_earned`).on(
			t.totalCertificatesEarned,
		),

		index(`idx_${orgMemberLearningProfileTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberLearningProfileTableName}_last_updated_at`).on(t.lastUpdatedAt),
	],
);

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `org`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors
