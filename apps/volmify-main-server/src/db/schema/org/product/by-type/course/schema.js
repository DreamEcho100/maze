import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	integer,
	jsonb,
	pgEnum,
	pgTable as table,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { lmsCols } from "#db/schema/_utils/cols/lms";
import { numericCols } from "#db/schema/_utils/cols/numeric";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/member-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { temporalCols } from "#db/schema/_utils/cols/temporal";
import { textCols } from "#db/schema/_utils/cols/text";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#db/schema/_utils/helpers.js";
import { skill } from "#db/schema/general/skill/schema.js";
// import { skill } from "#db/schema/general/skill/schema";
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
			// .references(() => orgProduct.id)
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
	(cols) => [
		...multiForeignKeys({
			tName: orgProductCourseTableName,
			fkGroups: [
				{
					cols: [cols.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgProductCourseTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.level] },
				{ cols: [cols.difficulty] },
				{ cols: [cols.estimatedDurationInMinutes] },
				{ cols: [cols.userLevelRatingTotal] },
				{ cols: [cols.userLevelRatingCount] },
				{ cols: [cols.userLevelRatingAvg] },
				{ cols: [cols.userDifficultyRatingTotal] },
				{ cols: [cols.userDifficultyRatingCount] },
				{ cols: [cols.userDifficultyRatingAvg] },
			],
		}),
	],
);

export const orgProductCourseI18n = buildOrgI18nTable(orgProductCourseTableName)(
	{
		courseId: textCols
			.idFk("course_id")
			// .references(() => orgProductCourse.id)
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
		extraConfig: (col, tName) => [
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [col.courseId],
						foreignColumns: [orgProductCourse.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
		],
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
			// .references(() => orgProductCourse.id)
			.notNull(),
		skillId: textCols
			.idFk("skill_id")
			// .references(() => skill.id)
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
	(cols) => [
		...multiForeignKeys({
			tName: orgProductCourseSkillTableName,
			fkGroups: [
				{
					cols: [cols.courseId],
					foreignColumns: [orgProductCourse.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.skillId],
					foreignColumns: [skill.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// TODO: change to a `compositePrimaryKey`
		uniqueIndex({
			tName: orgProductCourseSkillTableName,
			cols: [cols.courseId, cols.skillId],
		}),
		...multiIndexes({
			tName: orgProductCourseSkillTableName,
			colsGrps: [
				{ cols: [cols.weight] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
		check(
			`ck_${orgProductCourseSkillTableName}_weight_range`,
			sql`${cols.weight} >= 1 AND ${cols.weight} <= 10`,
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
			// .references(() => orgProductCourse.id)
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
	(cols) => [
		...orgMemberIdFkExtraConfig({
			tName: orgMemberProductCourseChallengeRatingTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgMemberProductCourseChallengeRatingTableName,
			fkGroups: [
				{
					cols: [cols.courseId],
					foreignColumns: [orgProductCourse.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgMemberProductCourseChallengeRatingTableName,
			cols: [cols.courseId, cols.memberId],
		}),
		...multiIndexes({
			tName: orgMemberProductCourseChallengeRatingTableName,
			colsGrps: [
				{ cols: [cols.levelRatingTotal] },
				{ cols: [cols.levelRatingCount] },
				{ cols: [cols.levelRatingAvg] },
				{ cols: [cols.difficultyRatingTotal] },
				{ cols: [cols.difficultyRatingCount] },
				{ cols: [cols.difficultyRatingAvg] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

const orgMemberProductCourseChallengeRatingHistoryTableName = `${orgMemberProductCourseChallengeRatingTableName}_history`;
export const orgMemberProductCourseChallengeRatingHistoryChangeReasonEnum = pgEnum(
	`${orgMemberProductCourseChallengeRatingHistoryTableName}_reason`,
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
			.idFk("course_id")
			// .references(() => orgProductCourse.id)
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
	(cols) => [
		...multiForeignKeys({
			tName: orgProductCourseModuleTableName,
			fkGroups: [
				{
					cols: [cols.courseId],
					foreignColumns: [orgProductCourse.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgProductCourseModuleTableName,
			cols: [cols.courseId, cols.sortOrder],
		}),
		check(
			`ck_${orgProductCourseModuleTableName}_required_access_tier_range`,
			sql`${cols.requiredAccessTier} >= 0`,
		),
		check(`ck_${orgProductCourseModuleTableName}_sort_order_range`, sql`${cols.sortOrder} >= 0`),
		...multiIndexes({
			tName: orgProductCourseModuleTableName,
			colsGrps: [
				{ cols: [cols.sortOrder] },
				{ cols: [cols.requiredAccessTier] },
				{ cols: [cols.isRequired] },
				{ cols: [cols.estimatedDurationInMinutes] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

export const orgProductCourseModuleI18n = buildOrgI18nTable(orgProductCourseModuleTableName)(
	{
		moduleId: textCols
			.idFk("moduleId")
			// .references(() => orgProductCourseModule.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "moduleId",
		extraConfig: (cols, tName) => [
			// index(`idx_${tName}_title`).on(cols.title)
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.moduleId],
						foreignColumns: [orgProductCourseModule.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
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
		id: textCols.idPk().notNull(),
		moduleId: textCols
			.idFk("module_id")
			// .references(() => orgProductCourseModule.id)
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
	(cols) => [
		...multiForeignKeys({
			tName: orgProductCourseModuleSectionTableName,
			fkGroups: [
				{
					cols: [cols.moduleId],
					foreignColumns: [orgProductCourseModule.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgProductCourseModuleSectionTableName,
			cols: [cols.moduleId, cols.sortOrder],
		}),
		check(
			`ck_${orgProductCourseModuleSectionTableName}_required_access_tier_range`,
			sql`${cols.requiredAccessTier} >= 0`,
		),
		check(
			`ck_${orgProductCourseModuleSectionTableName}_sort_order_range`,
			sql`${cols.sortOrder} >= 0`,
		),
		...multiIndexes({
			tName: orgProductCourseModuleSectionTableName,
			colsGrps: [
				{ cols: [cols.sortOrder] },
				{ cols: [cols.requiredAccessTier] },
				{ cols: [cols.isRequired] },
				{ cols: [cols.estimatedDurationInMinutes] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

export const orgProductCourseModuleSectionI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionTableName,
)(
	{
		sectionId: textCols
			.idFk("section_id")
			// .references(() => orgProductCourseModuleSection.id)
			.notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "sectionId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.sectionId],
						foreignColumns: [orgProductCourseModuleSection.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
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
			// .references(() => orgProductCourseModuleSection.id)
			.notNull(),
		lessonId: textCols
			.idFk("lesson_id")
			// .references(() => orgLesson.id)
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
	(cols) => [
		...multiForeignKeys({
			tName: orgProductCourseModuleSectionLessonTableName,
			fkGroups: [
				{
					cols: [cols.sectionId],
					foreignColumns: [orgProductCourseModuleSection.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.lessonId],
					foreignColumns: [orgLesson.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// Q: should this be unique or composite primary key or none at all?
		uniqueIndex({
			tName: orgProductCourseModuleSectionLessonTableName,
			cols: [cols.sectionId, cols.lessonId],
		}),
		uniqueIndex({
			tName: orgProductCourseModuleSectionLessonTableName,
			cols: [cols.sectionId, cols.sortOrder],
		}),
		check(
			`ck_${orgProductCourseModuleSectionLessonTableName}_required_access_tier_range`,
			sql`${cols.requiredAccessTier} >= 0`,
		),
		check(
			`ck_${orgProductCourseModuleSectionLessonTableName}_sort_order_range`,
			sql`${cols.sortOrder} >= 0`,
		),
		...multiIndexes({
			tName: orgProductCourseModuleSectionLessonTableName,
			colsGrps: [
				{ cols: [cols.sortOrder] },
				{ cols: [cols.requiredAccessTier] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

// This table can be used to override the lesson metadata for a specific module
export const orgProductCourseModuleSectionLessonI18n = buildOrgI18nTable(
	orgProductCourseModuleSectionLessonTableName,
)(
	{
		lessonId: textCols
			.idFk("lesson_id")
			// .references(() => orgProductCourseModuleSectionLesson.id)
			.notNull(), // TODO: Since this table is for the i18n of the course module section lesson,
		// And it reference a lesson, and the lesson already have a an optional seo metadata, maybe add a seo metadata override behavior _(merge, override, etc...)_
		seoMetadataId: seoMetadataIdFkCol(),
		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "lessonId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.lessonId],
						foreignColumns: [orgProductCourseModuleSectionLesson.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
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
			// .references(() => orgProductCourse.id)
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
	(cols) => [
		...orgMemberIdFkExtraConfig({
			tName: orgMemberProductCourseEnrollmentTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgMemberProductCourseEnrollmentTableName,
			fkGroups: [
				{
					cols: [cols.courseId],
					foreignColumns: [orgProductCourse.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		compositePrimaryKey({
			tName: orgMemberProductCourseEnrollmentTableName,
			cols: [cols.memberId, cols.courseId],
		}),
		...multiIndexes({
			tName: orgMemberProductCourseEnrollmentTableName,
			colsGrps: [
				{ cols: [cols.status] },
				{ cols: [cols.progressPercentage] },
				{ cols: [cols.completedAt] },
				{ cols: [cols.enrolledAt] },
				{ cols: [cols.lastAccessedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
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
	(cols) => [
		...orgMemberIdFkExtraConfig({
			tName: orgMemberLearningProfileTableName,
			cols,
		}),
		...multiIndexes({
			tName: orgMemberLearningProfileTableName,
			colsGrps: [
				{ cols: [cols.totalCoursesCompleted] },
				{ cols: [cols.totalLearningInMinutes] },
				{ cols: [cols.totalCertificatesEarned] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `org`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors
