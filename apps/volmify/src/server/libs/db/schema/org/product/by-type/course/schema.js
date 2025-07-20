import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { skill } from "#server/libs/db/schema/general/skill/schema";
import {
	lmsCols,
	numericCols,
	sharedCols,
	table,
	temporalCols,
	textCols,
} from "../../../../_utils/helpers";
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
		id: textCols.id().notNull(),
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
		 * @learningProgression Educational level for prerequisite management and learning pathways
		 * @customerSegmentation Enables clear course sequencing and student self-selection
		 * @qualitativeMeasure Human-readable prerequisite knowledge indicator
		 */
		level: orgProductCourseLevelEnum("level").default("beginner").notNull(),

		/**
		 * @contentComplexity Granular difficulty rating within educational level (1-10 scale)
		 * @quantitativeMeasure Enables precise course matching and recommendation algorithms
		 * @creatorInput Instructor-assessed complexity for accurate course positioning
		 */
		difficulty: integer("difficulty").default(5), // 1-10 scale

		/**
		 * @userFeedback Average user rating for course level appropriateness
		 * @qualityAssurance Community-validated level accuracy for creator credibility
		 * @recommendationEngine Data for improving course discovery algorithms
		 */
		avgUserLevelRating: decimal("avg_user_level_rating", {
			precision: 3,
			scale: 2,
		}),

		/**
		 * @userFeedback Average user rating for course difficulty assessment
		 * @learningOptimization Community feedback for course improvement and positioning
		 * @platformIntelligence Aggregate data for marketplace recommendation systems
		 */
		avgUserDifficultyRating: decimal("avg_user_difficulty_rating", {
			precision: 3,
			scale: 2,
		}),
		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),

		// The following fields and joins can be inferred from the `product` table as the `course` table is a specialization/type of the `product` table in a CTI way
		// thumbnail, vendors, status, deletedAt: temporalCols.deletedAt(), title, description, seoMetadata, slug

		// The pricing model will be handled by the `product` table
		// And the pricing model will be in a CTI many-to-many relationship with the `product` table
		// As it can be subscription, one-time purchase, or free
	},
	(t) => [
		index(`idx_${orgProductCourseI18nTableName}_product`).on(t.productId),
		index(`idx_${orgProductCourseI18nTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseI18nTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgProductCourseI18nTableName}_level`).on(t.level),
		index(`idx_${orgProductCourseI18nTableName}_difficulty`).on(t.difficulty),
		index(`idx_${orgProductCourseI18nTableName}_duration`).on(t.estimatedDurationInMinutes),
		index(`idx_${orgProductCourseI18nTableName}_level_rating`).on(t.avgUserLevelRating),
		index(`idx_${orgProductCourseI18nTableName}_difficulty_rating`).on(t.avgUserDifficultyRating),
	],
);

const orgProductCourseI18nTableName = `${orgProductCourseTableName}_i18n`;
export const orgProductCourseI18n = buildOrgI18nTable(orgProductCourseI18nTableName)(
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
		extraConfig: (self, tableName) => [index(`idx_${tableName}_course_id`).on(self.courseId)],
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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
		deletedAt: temporalCols.deletedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgProductCourseSkillTableName}`).on(t.courseId, t.skillId),
		// index(`idx_${orgProductCourseSkillTableName}_outcome`).on(t.isLearningOutcome),
		// index(`idx_${orgProductCourseSkillTableName}_proficiency`).on(t.proficiencyLevel),
		index(`idx_${orgProductCourseSkillTableName}_weight`).on(t.weight),
		index(`idx_${orgProductCourseSkillTableName}_course_id`).on(t.courseId),
		index(`idx_${orgProductCourseSkillTableName}_skill_id`).on(t.skillId),
		index(`idx_${orgProductCourseSkillTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgProductCourseSkillTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCourseSkillTableName}_deleted_at`).on(t.deletedAt),
		check("weight_range", sql`${t.weight} >= 1 AND ${t.weight} <= 10`),
	],
);

// TODO: add an i18n to `orgProductCourseSkill`

const orgMemberProductCourseChallengeRatingTableName = `${orgTableName}_member_product_course_challenge_rating`;
/**
 * Course Rating - Community-Driven Course Assessment
 *
 * @businessLogic User ratings for course level and difficulty accuracy enabling
 * community-driven quality assurance and course improvement feedback for instructors
 * within creator economy quality optimization workflows.
 */
export const orgMemberProductCourseChallengeRating = table(
	orgMemberProductCourseChallengeRatingTableName,
	{
		id: textCols.id().notNull(),
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		memberId: sharedCols.orgMemberIdFk().notNull(),

		/**
		 * @qualityFeedback User assessment of course level accuracy (1-5 stars)
		 * @creatorFeedback Helps instructors understand if course matches advertised level
		 */
		levelRating: integer("level_rating"), // 1-10 scale

		/**
		 * @complexityFeedback User assessment of course difficulty accuracy (1-5 stars)
		 * @courseImprovement Enables instructors to adjust content complexity based on feedback
		 */
		difficultyRating: integer("difficulty_rating"), // 1-10 scale

		/**
		 * @qualitativeFeedback Optional explanation for ratings
		 * @instructorInsights Detailed feedback for course improvement and creator development
		 */
		feedback: text("feedback"),

		metadata: jsonb("metadata"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgMemberProductCourseChallengeRatingTableName}course__member`).on(
			t.courseId,
			t.memberId,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_course_id`).on(t.courseId),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_member_id`).on(t.memberId),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_level`).on(t.levelRating),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_difficulty`).on(
			t.difficultyRating,
		),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberProductCourseChallengeRatingTableName}_updated_at`).on(t.updatedAt),
		check(
			"level_rating_range",
			sql`${t.levelRating} >= 1 AND ${t.levelRating} <= 10 AND ${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10`,
		),
		check(
			"difficulty_rating_range",
			sql`${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10 AND ${t.difficultyRating} >= 1 AND ${t.difficultyRating} <= 10`,
		),
	],
);
// TODO: add a history track for `orgMemberProductCourseChallengeRating`

const orgProductCourseModuleTableName = `${orgProductCourseTableName}_module`;
// Naming problem: should it be `module` or `section`?
export const orgProductCourseModule = table(
	orgProductCourseModuleTableName,
	{
		id: textCols.id().notNull(),
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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
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
		index(`idx_${orgProductCourseModuleTableName}_updated_at`).on(t.updatedAt),
		check("required_access_tier_range", sql`${t.requiredAccessTier} >= 0`),
		check("sort_order_range", sql`${t.sortOrder} >= 0`),
	],
);

const orgProductCourseModuleI18nTableName = `${orgProductCourseModuleTableName}_i18n`;
export const orgProductCourseModuleI18n = buildOrgI18nTable(orgProductCourseModuleI18nTableName)(
	{
		moduleId: textCols
			.idFk("moduleId")
			.references(() => orgProductCourseModule.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: sharedCols.seoMetadataIdFk(),
	},
	{
		fkKey: "moduleId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_module_id`).on(t.moduleId),
			index(`idx_${tName}_title`).on(t.title),
		],
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
		id: textCols.id().notNull(),
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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
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
		index(`idx_${orgProductCourseModuleSectionTableName}_updated_at`).on(t.updatedAt),
		check("required_access_tier_range", sql`${t.requiredAccessTier} >= 0`),
		check("sort_order_range", sql`${t.sortOrder} >= 0`),
	],
);

const orgProductCourseModuleSectionI18nTableName = `${orgProductCourseModuleSectionTableName}_i18n`;
export const orgProductCourseModuleSectionI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionI18nTableName,
)(
	{
		sectionId: textCols
			.idFk("section_id")
			.references(() => orgProductCourseModuleSection.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: sharedCols.seoMetadataIdFk(),
	},
	{
		fkKey: "sectionId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_section_id`).on(t.sectionId),
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
		id: textCols.id().notNull(),

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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
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
		index(`idx_${orgProductCourseModuleSectionLessonTableName}_updated_at`).on(t.updatedAt),
		check("required_access_tier_range", sql`${t.requiredAccessTier} >= 0`),
		check("sort_order_range", sql`${t.sortOrder} >= 0`),
	],
);

const orgProductCourseModuleSectionLessonI18nTableName = `${orgProductCourseModuleSectionLessonTableName}_i18n`;
// This table can be used to override the lesson metadata for a specific module
export const orgProductCourseModuleSectionLessonI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionLessonI18nTableName,
)(
	{
		lessonId: textCols
			.idFk("lesson_id")
			.references(() => orgProductCourseModuleSectionLesson.id)
			.notNull(), // TODO: Since this table is for the i18n of the course module section lesson,
		// And it reference a lesson, and the lesson already have a an optional seo metadata, maybe add a seo metadata override behavior _(merge, override, etc...)_
		seoMetadataId: sharedCols.seoMetadataIdFk(),
		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "lessonId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_lesson_id`).on(t.lessonId),
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
		memberId: sharedCols.orgMemberIdFk().notNull(),
		courseId: textCols
			.idFk("course_id")
			.references(() => orgProductCourse.id)
			.notNull(),
		status: orgMemberProductCourseEnrollmentStatusEnum("status").default("not_started").notNull(),
		progressPercentage: lmsCols.progressPercentage(),
		completedAt: temporalCols.completedAt(),

		// Access tracking
		firstAccessAt: timestamp("first_access_at"),
		lastAccessedAt: temporalCols.lastAccessedAt(),
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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
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
		index(`idx_${orgMemberProductCourseEnrollmentTableName}_updated_at`).on(t.updatedAt),
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
		id: textCols.id().notNull(),
		memberId: sharedCols.orgMemberIdFk().notNull().unique(),

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

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
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
		index(`idx_${orgMemberLearningProfileTableName}_updated_at`).on(t.updatedAt),
	],
);

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `org`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors
