import {
	boolean,
	decimal,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import {
	createdAt,
	fk,
	id,
	slug,
	table,
	updatedAt,
} from "../../../_utils/helpers";
import { organization, organizationMember } from "../../../organization/schema";
import { seoMetadata } from "../../../seo/schema";
import { user } from "../../../user/schema";
import { product } from "../../schema";

// Should it be a level, difficulty, or consider both? what is the difference between a level and a difficulty in this context? why? pros and cons?
export const productCourseLevelEnum = pgEnum("product_course_level", [
	"beginner",
	"intermediate",
	"advanced",
	"expert",
]);

export const productCourse = table(
	"course",
	{
		id: id.notNull(),
		organizationId: fk("organization_id")
			.references(() => organization.id)
			.notNull(),
		// Hmm, should the connection be to the `product` table or the `productVariant` table? why? pros and cons?
		// Which make sense to this project?
		// I mean, what is the difference between a product and a product variant, how they work together, how they are related, and help in this context?
		productId: fk("product_id")
			.references(() => product.id)
			.notNull(),
		estimatedDurationInMinutes: integer("estimated_duration_in_minutes")
			.default(0)
			.notNull(),
		// prerequisites ???
		//  targetAudience ???
		// completionCriteria ???
		// allowDiscussions ???

		/**
		 * @learningProgression Educational level for prerequisite management and learning pathways
		 * @customerSegmentation Enables clear course sequencing and student self-selection
		 * @qualitativeMeasure Human-readable prerequisite knowledge indicator
		 */
		level: productCourseLevelEnum("level").default("beginner").notNull(),

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
		createdAt,
		updatedAt,

		// The following fields and joins can be inferred from the `product` table as the `course` table is a specialization/type of the `product` table in a CTI way
		// thumbnail, vendors, status, deletedAt, title, description, seoMetadata, slug

		// The pricing model will be handled by the `product` table
		// And the pricing model will be in a CTI many-to-many relationship with the `product` table
		// As it can be subscription, one-time purchase, or free
	},
	(t) => [
		index("idx_course_organization").on(t.organizationId),
		index("idx_course_product").on(t.productId),
		uniqueIndex("uq_course_product_org").on(t.productId, t.organizationId),
		index("idx_course_created_at").on(t.createdAt),
		index("idx_course_updated_at").on(t.updatedAt),
	],
);

/**
 * SKILLS TAXONOMY - Platform-Wide Skill Management
 */
export const skill = table(
	"skill",
	{
		id,
		/**
		 * @skillTaxonomy Standardized skill identifier for marketplace consistency
		 * @analyticsFoundation Enables cross-organization skill tracking and recommendations
		 */
		slug: slug.notNull(), // "react", "python", "data-analysis"

		/**
		 * @skillHierarchy Parent skill for hierarchical skill organization
		 * @marketplaceNavigation Enables nested skill browsing (Programming → JavaScript → React)
		 */
		// @ts-ignore
		parentSkillId: fk("parent_skill_id"),
		// Note: Self reference foreign key break relational query types
		// So it will be defined on the callback bellow
		// .references(() => /** @type {any}*/ (skill).id),

		/**
		 * @skillCategorization Skill domain for marketplace organization
		 * @platformAnalytics Enables skill trend analysis across organizations
		 */
		category: text("category"), // "programming", "design", "business", "data"

		/**
		 * @platformManagement Global skill approval status for marketplace quality
		 * @qualityControl Prevents skill taxonomy fragmentation across organizations
		 */
		approvedAt: boolean("approved_at").default(false),

		createdByOrganizationId: fk("created_by_organization_id")
			.references(() => organization.id)
			.notNull(),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_skill_slug").on(t.slug),
		index("idx_skill_category").on(t.category),
		index("idx_skill_parent").on(t.parentSkillId),
		foreignKey({
			columns: [t.parentSkillId],
			foreignColumns: [t.id],
			name: "fk_skill_parent_skill",
		}),
	],
);

export const skillTranslation = table(
	"skill_translation",
	{
		id,
		skillId: fk("skill_id")
			.references(() => skill.id)
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		name: text("name").notNull(),
		description: text("description"),

		createdAt,
		updatedAt,
	},
	(t) => [uniqueIndex("uq_skill_translation").on(t.skillId, t.locale)],
);

/**
 * COURSE SKILLS - Structured Course Skill Attribution
 */
export const productCourseSkill = table(
	"product_course_skill",
	{
		courseId: fk("course_id")
			.references(() => productCourse.id)
			.notNull(),
		skillId: fk("skill_id")
			.references(() => skill.id)
			.notNull(),

		/**
		 * @skillRole Whether skill is taught or prerequisite
		 * @learningPathway Enables prerequisite validation and learning path construction
		 */
		isLearningOutcome: boolean("is_learning_outcome").default(true), // vs prerequisite

		/**
		 * @skillMastery Target proficiency level for learning outcomes
		 * @marketplaceMatching Enables precise skill level matching for recommendations
		 */
		proficiencyLevel: text("proficiency_level"), // "beginner", "intermediate", "advanced", "expert"

		/**
		 * @skillWeight Importance of this skill in course curriculum (1-10)
		 * @analyticsWeight Higher weight skills drive recommendation algorithms
		 */
		weight: integer("weight").default(5),

		createdAt,
	},
	(t) => [
		uniqueIndex("uq_course_skill").on(t.courseId, t.skillId),
		index("idx_course_skill_outcome").on(t.isLearningOutcome),
		index("idx_course_skill_proficiency").on(t.proficiencyLevel),
	],
);

/**
 * Course Rating - Community-Driven Course Assessment
 *
 * @businessLogic User ratings for course level and difficulty accuracy enabling
 * community-driven quality assurance and course improvement feedback for instructors
 * within creator economy quality optimization workflows.
 */
export const productCourseRating = table(
	"product_course_rating",
	{
		id,
		courseId: fk("course_id")
			.references(() => productCourse.id)
			.notNull(),
		userId: fk("user_id")
			.references(() => user.id)
			.notNull(),

		/**
		 * @qualityFeedback User assessment of course level accuracy (1-5 stars)
		 * @creatorFeedback Helps instructors understand if course matches advertised level
		 */
		levelRating: integer("level_rating"), // 1-5 scale

		/**
		 * @complexityFeedback User assessment of course difficulty accuracy (1-5 stars)
		 * @courseImprovement Enables instructors to adjust content complexity based on feedback
		 */
		difficultyRating: integer("difficulty_rating"), // 1-5 scale

		/**
		 * @qualitativeFeedback Optional explanation for ratings
		 * @instructorInsights Detailed feedback for course improvement and creator development
		 */
		feedback: text("feedback"),

		createdAt,
		updatedAt,
	},
	(t) => [uniqueIndex("uq_course_rating_user").on(t.courseId, t.userId)],
);

// Naming problem: should it be `module` or `section`?
export const productCourseModule = table("product_course_module", {
	id: id.notNull(),
	courseId: fk("product_course_id")
		.references(() => productCourse.id)
		.notNull(),

	/**
	 * @contentOrganization Module sequence within course structure
	 * @learningProgression Enables structured course progression and module dependencies
	 */
	sortOrder: integer("sort_order").notNull(),

	/**
	 * @accessControl Minimum variant access tier required for module access
	 * @businessModel Enables premium module gating for higher-tier purchases
	 */
	requiredAccessTier: integer("required_access_tier").default(1),

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

	createdAt,
	updatedAt,
	// ???
	//  // Section settings
	//  settings: jsonb("settings"),
});
export const productCourseModuleTranslation = table(
	"product_course_module_translation",
	{
		id: id.notNull(),
		productCourseModuleId: fk("product_course_module_id")
			.references(() => productCourseModule.id)
			.notNull(),
		title: text("title").notNull(),
		description: text("description"),
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),
		createdAt,
		updatedAt,
	},
);

/**
 * Product Course Module Section - Learning Sub-Unit
 *
 * @businessLogic Sections organize lessons within modules enabling granular content
 * structure and flexible learning organization for comprehensive educational content
 * management and student progress tracking workflows.
 */
export const productCourseModuleSection = table(
	"product_course_module_section",
	{
		id,
		moduleId: fk("module_id")
			.references(() => productCourseModule.id)
			.notNull(),

		/**
		 * @contentOrganization Section sequence within module structure
		 * @learningFlow Enables logical content progression within learning units
		 */
		sortOrder: integer("sort_order").notNull(),

		/**
		 * @accessControl Optional additional access requirements for premium sections
		 * @businessFlexibility Enables section-level access control for advanced monetization
		 */
		requiredAccessTier: integer("required_access_tier").default(1),

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

		createdAt,
		updatedAt,
	},
);

export const productCourseModuleSectionTranslation = table(
	"product_course_module_section",
	{
		id: id.notNull(),
		productCourseModuleId: fk("product_course_module_id")
			.references(() => productCourseModuleSection.id)
			.notNull(),
		title: text("title").notNull(),
		description: text("description"),
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),
		createdAt,
		updatedAt,
	},
);

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
export const productCourseModuleSectionLesson = table(
	"product_course_module_section_lesson",
	{
		id: id.notNull(),

		sectionId: fk("section_id")
			.references(() => productCourseModuleSection.id)
			.notNull(),
		lessonId: fk("lesson_id")
			.references(() => lesson.id)
			.notNull(),

		/**
		 * @contentSequence Lesson order within section for structured learning flow
		 * @educationalDesign Enables logical lesson progression and dependency management
		 */
		sortOrder: integer("sort_order").notNull(),

		/**
		 * @accessControl Lesson-level access requirements for granular content gating
		 * @monetizationStrategy Enables individual lesson gating for premium content
		 */
		requiredAccessTier: integer("required_access_tier").default(1),

		/**
		 * @learningRequirements Complex prerequisite logic for advanced learning paths
		 * @educationalFlexibility Supports sophisticated learning progression requirements
		 */
		prerequisites: jsonb("prerequisites"),

		createdAt,
		updatedAt,
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
);

// This table can be used to override the lesson metadata for a specific module
export const productCourseModuleLessonTranslation = table(
	"product_course_module_lesson_translation",
	{
		id: id.notNull(),
		productCourseModuleLessonId: fk("product_course_module_lesson_id")
			.references(() => productCourseModuleSectionLesson.id)
			.notNull(),
		title: integer("title").notNull(),
		description: integer("description"),
		seoMetadataId: fk("seo_metadata_id")
			.references(() => seoMetadata.id)
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),
		createdAt,
		updatedAt,
	},
);

export const lessonTypeEnum = pgEnum("lesson_type", [
	"video",
	"text",
	"quiz",
	"assignment",
	// "file",
	// What're other valid types that will help in this project and used on other LMS systems?
]);
export const lesson = table("lesson", {
	id: id.notNull(),
	organizationId: fk("organization_id")
		.references(() => organization.id)
		.notNull(),
	type: lessonTypeEnum("type").notNull(),
});

export const lessonTranslation = table("lesson_translation", {
	id: id.notNull(),
	lessonId: fk("lesson_id")
		.references(() => lesson.id)
		.notNull(),
	title: integer("title").notNull(),
	description: integer("description"),
	// Does a lesson even need SEO metadata? what would be the use case? pros and cons?
	// seoMetadataId: fk("seo_metadata_id")
	// 	.references(() => seoMetadata.id)
	// 	.notNull(),
	locale: text("locale").notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt,
	updatedAt,
});

// IMP: The lesson type related table are halted for now

// User productCourseEnrollment & progress
export const productCourseEnrollmentStatusEnum = pgEnum(
	"product_course_enrollment_status",
	["active", "completed", "cancelled"],
);
export const productCourseEnrollment = table("product_course_enrollment", {
	id: id.notNull(),
	userId: fk("user_id")
		.references(() => user.id)
		.notNull(),
	courseId: fk("product_course_id")
		.references(() => productCourse.id)
		.notNull(),
	status: productCourseEnrollmentStatusEnum("status")
		.default("active")
		.notNull(),
	progressPercentage: decimal("progress_percentage", {
		precision: 5,
		scale: 2,
	}).default("0.00"),
	completedAt: timestamp("completed_at"),

	// Access tracking
	firstAccessAt: timestamp("first_access_at"),
	lastAccessedAt: timestamp("last_accessed_at"),
	totalTimeSpent: integer("total_time_spent_seconds").default(0),

	// Scheduling
	enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
	//  expectedCompletionDate ???
	//  accessExpiresAt ???

	// ???
	//  // Notes and admin fields
	//  enrollmentNotes
	//  adminNotes
});

export const productCourseModuleLessonProgressStatusEnum = pgEnum(
	"product_course_module_lesson_progress_status",
	[
		"not_started",
		"in_progress",
		"completed",
		// What're other valid types that will help in this project and used on other LMS systems?
	],
);
export const productCourseModuleLessonProgress = table(
	"product_course_module_lesson_progress",
	{
		id: id.notNull(),
		productCourseModuleLessonId: fk("product_course_module_lesson_id")
			.references(() => productCourseModuleSectionLesson.id)
			.notNull(),
		// IMP: Should this be a user ID or the organization member ID (organization member is a user that is part of an organization)?
		// Things to consider:
		// - The organization can have the product only available to its markets or the global web app market _(not implemented yet)_.
		// - If the user is part of an organization, should the progress be tracked per user or per organization member?
		userId: fk("user_id")
			.references(() => user.id)
			.notNull(),
		progressPercentage: decimal("progress_percentage", {
			precision: 5,
			scale: 2,
		}).default("0.00"),
		// Or a status enum to indicate progress
		// progressStatus: pgEnum("progress_status", ["not_started", "in_progress", "completed"])
		// 	.default("not_started")

		// Type-specific progress data (JSONB for flexibility)
		progressData: jsonb("progress_data"),

		// Timestamps
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		lastAccessedAt: timestamp("last_accessed_at"),
	},
);

/**
 * Course Progress - Organization Member Based Tracking
 *
 * @businessLogic Progress tracked per organization member enabling organizational
 * learning management, role-based access control, and comprehensive learning analytics
 * within organizational boundaries while maintaining user identity across organizations.
 *
 * @organizationalContext Progress tied to specific organizational membership enabling
 * different learning experiences and progress tracking based on organizational role
 * and access privileges for comprehensive learning management workflows.
 */
export const productCourseProgress = table(
	"product_course_progress",
	{
		id,

		/**
		 * @learningContext Course this progress applies to
		 * @businessRule Links progress to specific educational content for tracking
		 */
		courseId: fk("course_id")
			.references(() => productCourse.id)
			.notNull(),

		/**
		 * @organizationalIdentity Organization member whose progress is tracked
		 * @businessRule Primary progress tracking identity for organizational learning
		 * @accessControl Enables role-based learning experiences and organizational analytics
		 */
		organizationMemberId: fk("organization_member_id")
			.references(() => organizationMember.id)
			.notNull(),

		/**
		 * @progressMeasurement Overall course completion percentage
		 * @learningAnalytics Enables organizational learning progress reporting and analytics
		 */
		progressPercentage: decimal("progress_percentage", {
			precision: 5,
			scale: 2,
		}).default("0.00"),

		/**
		 * @progressStatus Simplified completion status for quick filtering
		 * @organizationalReporting Enables manager oversight and completion reporting
		 */
		status: productCourseEnrollmentStatusEnum("status")
			.default("active")
			.notNull(),

		/**
		 * @learningTimeline Course learning timeline for organizational analytics
		 * @performanceTracking Tracks learning velocity and engagement patterns
		 */
		enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		lastAccessedAt: timestamp("last_accessed_at"),

		/**
		 * @engagementTracking Total learning time for organizational productivity analytics
		 * @learningOptimization Helps optimize course content and delivery methods
		 */
		totalTimeSpentSeconds: integer("total_time_spent_seconds").default(0),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_course_progress_member").on(
			t.courseId,
			t.organizationMemberId,
		),
		index("idx_course_progress_status").on(t.status),
		index("idx_course_progress_completion").on(t.completedAt),
	],
);

/**
 * USER LEARNING SUMMARY - Cross-Organizational Learning Profile
 *
 * @businessLogic Aggregated learning summary across all organizational memberships
 * enabling user-centric learning portfolio and cross-organizational skill tracking
 * for comprehensive professional development and career progression analytics.
 */
export const userLearningProfile = table("user_learning_profile", {
	id,
	userId: fk("user_id")
		.references(() => user.id)
		.notNull()
		.unique(),

	/**
	 * @learningPortfolio Aggregated learning statistics across organizations
	 * @professionalDevelopment Comprehensive learning achievements for career tracking
	 */
	totalCoursesCompleted: integer("total_courses_completed").default(0),
	totalLearningHours: integer("total_learning_hours").default(0),
	totalCertificatesEarned: integer("total_certificates_earned").default(0),

	/**
	 * @skillPortfolio Aggregated skills across all organizational learning
	 * @marketplaceProfile Skills summary for marketplace recommendations and matching
	 */
	acquiredSkills: jsonb("acquired_skills"), // Array of skills with proficiency levels

	/**
	 * @learningPreferences User learning behavior patterns for personalization
	 * @platformIntelligence Data for improving course recommendations and platform experience
	 */
	learningMetadata: jsonb("learning_metadata"),

	updatedAt,
});

// IMP: `quiz` and `assignment` results tables will be handled later after the lesson types are finalized
// IMP: The `quiz` and `assignment` will be connected to an `assessment` table that will handle the different types of assessments in A CTI way

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `organization`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors
