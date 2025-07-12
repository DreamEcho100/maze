import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { createdAt, fk, id, table, updatedAt } from "../../../_utils/helpers";
import { organization } from "../../../organization/schema";
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
		estimatedDurationInMinutes: integer("estimated_duration_in_minutes").default(0).notNull(),
		// prerequisites ???
		//  targetAudience ???
		// completionCriteria ???
		// allowDiscussions ???
		// IMP: Should the following be fields or a connection type of way table? which is better for performance, scalability, maintainability, searchability, and flexibility? why? pros and cons?
		//  learningOutcomes: text("learning_outcomes").array(),
		//  skills: text("skills").array(),
		level: productCourseLevelEnum("level").default("beginner").notNull(),
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

// Naming problem: should it be `module` or `section`?
export const productCourseModule = table("product_course_module", {
	id: id.notNull(),
	courseId: fk("product_course_id")
		.references(() => productCourse.id)
		.notNull(),
	sortOrder: integer("sort_order").notNull(),
	isRequired: boolean("is_required").default(true),
	estimatedDurationInMinutes: integer("estimated_duration_minutes"),

	// ???
	//  // Section settings
	//  settings: jsonb("settings"),
});

export const productCourseModuleTranslation = table("product_course_module_translation", {
	id: id.notNull(),
	productCourseModuleId: fk("product_course_module_id")
		.references(() => productCourseModule.id)
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
});

// The following will be for the lessons within the modules
// Things to consider for Lessons:
// - Are reusable across modules/courses
// - Have different types (video, rich-text, quiz, etc.)
// - Lessons per module can have different prerequisites (e.g., must complete lesson X before accessing lesson Y, no prerequisites, need to complete a quiz, etc.)
// - Different types of prerequisites per modules are related to the product payment model
// - Lessons can have different metadata (e.g., tags, categories, etc.)
export const productCourseModuleLesson = table("product_course_module_lesson", {
	id: id.notNull(),
	productCourseModuleId: fk("product_course_module_id")
		.references(() => productCourseModule.id)
		.notNull(),
	lessonId: fk("lesson_id")
		.references(() => lesson.id)
		.notNull(),
	sortOrder: integer("sort_order").notNull(),

	isRequired: boolean("is_required").default(true),
	isPublic: boolean("is_public").default(false),
	allowComments: boolean("allow_comments").default(true),
	estimatedDurationInMinutes: integer("estimated_duration_minutes"),

	// ???
	//  // Completion tracking
	//  completionCriteria
	//  minimumTimeRequired
	//  // Lesson settings (type-specific configurations)
	//  settings
});

// This table can be used to override the lesson metadata for a specific module
export const productCourseModuleLessonTranslation = table(
	"product_course_module_lesson_translation",
	{
		id: id.notNull(),
		productCourseModuleLessonId: fk("product_course_module_lesson_id")
			.references(() => productCourseModuleLesson.id)
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
export const productCourseEnrollmentStatusEnum = pgEnum("product_course_enrollment_status", [
	"active",
	"completed",
	"cancelled",
]);
export const productCourseEnrollment = table("product_course_enrollment", {
	id: id.notNull(),
	userId: fk("user_id")
		.references(() => user.id)
		.notNull(),
	courseId: fk("product_course_id")
		.references(() => productCourse.id)
		.notNull(),
	status: productCourseEnrollmentStatusEnum("status").default("active").notNull(),
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
export const productCourseModuleLessonProgress = table("product_course_module_lesson_progress", {
	id: id.notNull(),
	productCourseModuleLessonId: fk("product_course_module_lesson_id")
		.references(() => productCourseModuleLesson.id)
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
});

// IMP: `quiz` and `assignment` results tables will be handled later after the lesson types are finalized
// IMP: The `quiz` and `assignment` will be connected to an `assessment` table that will handle the different types of assessments in A CTI way

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `organization`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors
