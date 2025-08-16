import { pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "#schema/_utils/cols/numeric.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	userIdFkCol,
	userIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/user-id.js";
import { temporalCols } from "#schema/_utils/cols/temporal.js";
import { textCols } from "#schema/_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
} from "#schema/_utils/helpers.js";
import { table } from "#schema/_utils/tables.js";
import { category } from "../../schema.js";

/**
 * Content moderation status for category quality control
 */
export const moderationStatusEnum = pgEnum("category_moderation_status", [
	"pending",
	"approved",
	"rejected",
	"flagged",
	"under_review",
]);

/**
 * Category reporting and flagging reasons
 */
export const flagReasonEnum = pgEnum("category_flag_reason", [
	"spam",
	"inappropriate",
	"duplicate",
	"misleading",
	"copyright_violation",
	"low_quality",
]);

/**
 * Community reporting types
 */
export const reportTypeEnum = pgEnum("category_report_type", [
	"spam",
	"inappropriate",
	"duplicate",
	"quality_issue",
	"policy_violation",
]);

/**
 * Report status tracking
 */
export const reportStatusEnum = pgEnum("category_report_status", [
	"pending",
	"investigating",
	"resolved",
	"dismissed",
	"escalated",
]);

/**
 * Advanced category features for machine learning and semantic analysis
 *
 * Stores computed features, embeddings, and behavioral patterns for
 * advanced recommendation systems and content intelligence.
 *
 */
export const categoryFeatures = table(
	"category_features",
	{
		/**Reference to category slug */
		slugRef: textCols.slug("slug_ref").notNull().primaryKey(),
		/**Semantic vector embeddings for similarity analysis */
		semanticVector: jsonCols.vector("semantic_vector"),
		/**Usage behavior patterns for ML models */
		usagePatterns: jsonCols.metadata("usage_patterns"),
		/**Content classification signals */
		contentSignals: jsonCols.metadata("content_signals"),
		/**Cross-category relationship strengths */
		relationshipWeights: jsonCols.metadata("relationship_weights"),
		/**Last time features were computed */
		lastAnalyzedAt: temporalCols.lastProcessed(),
	},
	(cols) => [
		// Foreign key to category
		...multiForeignKeys({
			tName: "category_features",
			fkGroups: [
				{
					cols: [cols.slug],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),

		// Index for feature freshness
		index("idx_category_features_analyzed").on(cols.lastAnalyzedAt),
	],
);

// =====================================
// ABUSE PREVENTION SYSTEM
// =====================================
/*

### **Enhanced Abuse Prevention**
- **Rate limiting system** with daily/monthly quotas
- **Usage tracking** for enforcement
- **AI-powered moderation** with quality scoring
- **Community reporting** system
- **Behavioral analysis** for pattern detection
*/

const orgCategoryQuotaTableName = "org_category_quota";
/**
 * Organization category quotas and rate limiting
 *
 * Prevents abuse through configurable limits on category creation
 * and hierarchy complexity per organization.
 */
export const orgCategoryQuota = table(
	orgCategoryQuotaTableName,
	{
		/** Organization identifier */
		orgId: orgIdFkCol().notNull().primaryKey(),
		// Rate limiting configuration
		/** Maximum categories that can be created per day */
		maxCategoriesPerDay: numericCols
			.limit("max_categories_per_day")
			.default(10),
		/** Maximum categories that can be created per month */
		maxCategoriesPerMonth: numericCols
			.limit("max_categories_per_month")
			.default(100),
		// Hierarchy limits to prevent performance issues
		/** Maximum hierarchy depth allowed */
		maxDepth: numericCols.depth("max_depth").default(6),
		/** Maximum children per category */
		maxChildren: numericCols.count("max_children").default(50),
		// Lifecycle management
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
		/** When this quota configuration expires */
		endsAt: temporalCols.audit.endsAt(),
		// Reset tracking for rate limits
		/** Last daily quota reset */
		lastDailyReset: temporalCols.lastReset(),
		/** Last monthly quota reset */
		lastMonthlyReset: temporalCols.lastReset(),
	},
	(cols) => [
		// Foreign key to organization
		...orgIdFkExtraConfig({
			tName: orgCategoryQuotaTableName,
			cols,
		}),
		// indexes for efficient quota management
		...multiIndexes({
			tName: orgCategoryQuotaTableName,
			colsGrps: [
				{ cols: [cols.orgId] }, // Primary lookup
				{ cols: [cols.maxCategoriesPerDay] }, // Daily limits
				{ cols: [cols.maxCategoriesPerMonth] }, // Monthly limits
				{ cols: [cols.maxDepth] }, // Hierarchy depth analysis
				{ cols: [cols.maxChildren] }, // Children limits
				{ cols: [cols.createdAt] }, // Creation timeline
				{ cols: [cols.lastUpdatedAt] }, // Update tracking
				{ cols: [cols.endsAt] }, // Expiration management
				{ cols: [cols.lastDailyReset] }, // Daily reset tracking
				{ cols: [cols.lastMonthlyReset] }, // Monthly reset tracking
			],
		}),
	],
);

const orgCategoryUsageTrackingTableName = "org_category_usage_tracking";
/**
 * Daily category creation tracking for rate limiting
 *
 * Tracks actual usage against quotas to enforce limits and detect abuse patterns.
 */
export const orgCategoryUsageTracking = table(
	orgCategoryUsageTrackingTableName,
	{
		/** Organization identifier */
		orgId: orgIdFkCol().notNull(),
		/** Date for which usage is being tracked */
		trackingDate: temporalCols.date("tracking_date").notNull(),
		// Usage counters
		/** Categories created today */
		categoriesCreatedToday: numericCols
			.count("categories_created_today")
			.default(0),
		/** Categories created this month */
		categoriesCreatedThisMonth: numericCols
			.count("categories_created_this_month")
			.default(0),
		/** Current maximum depth in use */
		currentMaxDepth: numericCols.depth("current_max_depth").default(0),
		/** Relationships created today */
		relationshipsCreatedToday: numericCols
			.count("relationships_created_today")
			.default(0),
		// Audit trail
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Composite primary key for unique org+date tracking
		compositePrimaryKey({
			tName: orgCategoryUsageTrackingTableName,
			cols: [cols.orgId, cols.trackingDate],
		}),
		// Foreign key to organization
		...orgIdFkExtraConfig({
			tName: orgCategoryUsageTrackingTableName,
			cols,
		}),
		// Index for efficient date-based queries
		...multiIndexes({
			tName: orgCategoryUsageTrackingTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.trackingDate] }, // Primary lookup
				{ cols: [cols.categoriesCreatedToday] }, // Daily creation tracking
				{ cols: [cols.categoriesCreatedThisMonth] }, // Monthly creation tracking
				{ cols: [cols.currentMaxDepth] }, // Depth analysis
				{ cols: [cols.relationshipsCreatedToday] }, // Relationship tracking
			],
		}),
	],
);

const categoryModerationQueueTableName = "category_moderation_queue";
/**
 * Content moderation queue for category quality control
 *
 * AI-powered and human-moderated system to maintain category quality
 * and prevent spam, abuse, and low-quality content.
 */
export const categoryModerationQueue = table(
	categoryModerationQueueTableName,
	{
		/** Unique identifier for moderation entry */
		id: textCols.idPk(),
		/** Organization identifier */
		orgId: orgIdFkCol().notNull(),
		/** Organization member who created the category */
		orgMemberId: orgMemberIdFkCol(),
		/** Category slug being moderated */
		categorySlug: textCols.slug("category_slug").notNull(),
		// Flagging and detection
		/** Primary reason for flagging */
		flagReason: flagReasonEnum("flag_reason"),
		/** AI detection results and confidence scores */
		automaticFlags: jsonCols.metadata("automatic_flags"),
		/** Current moderation status */
		moderationStatus: moderationStatusEnum("status").default("pending"),
		// AI quality analysis
		/** Spam likelihood score (0-1) */
		spamScore: numericCols.score("spam_score"),
		/** Content quality assessment score (0-1) */
		qualityScore: numericCols.score("quality_score"),
		/** Similarity to existing categories (0-1) */
		semanticSimilarity: numericCols.score("semantic_similarity"),
		// Human review trail
		/** User who reviewed this entry */
		reviewedByUserId: userIdFkCol("reviewed_by_user_id"),
		/** When review was completed */
		reviewedAt: temporalCols.reviewedAt(),
		/** Human reviewer notes */
		reviewNotes: textCols.longText("review_notes"),
		// Lifecycle
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		// Foreign key constraints
		...orgIdFkExtraConfig({
			tName: categoryModerationQueueTableName,
			cols,
		}),
		...userIdFkExtraConfig({
			tName: categoryModerationQueueTableName,
			cols,
			colFkKey: "reviewedByUserId",
		}),
		...multiForeignKeys({
			tName: categoryModerationQueueTableName,
			fkGroups: [
				{
					cols: [cols.categorySlug],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),

		// Indexes for moderation workflows
		...multiIndexes({
			tName: categoryModerationQueueTableName,
			colsGrps: [
				{ cols: [cols.moderationStatus, cols.createdAt] }, // Pending queue
				{ cols: [cols.spamScore] }, // AI flagging
				{ cols: [cols.qualityScore] }, // Quality filtering
				{ cols: [cols.reviewedByUserId, cols.reviewedAt] }, // Reviewer tracking
			],
		}),
	],
);

/**
 * User behavior analysis for abuse detection
 *
 * Tracks user patterns to identify potential abuse, spam, or gaming
 * of the category system through behavioral analysis.
 */
export const userCategoryBehavior = table(
	"user_category_behavior",
	{
		/** User identifier */
		userId: userIdFkCol().notNull().primaryKey(),
		// Content pattern analysis
		/** Average length of category names created */
		avgCategoryNameLength: numericCols.average("avg_category_name_length"),
		/** Average length of category descriptions */
		avgDescriptionLength: numericCols.average("avg_description_length"),
		/** Rate of category creation per hour */
		categoriesPerHour: numericCols.rate("categories_per_hour"),
		/** Ratio of unique words to total words (detect repetition) */
		uniqueWordsRatio: numericCols.ratio("unique_words_ratio"),
		// Relationship and hierarchy patterns
		/** Average depth of hierarchies created */
		avgDepthCreated: numericCols.average("avg_depth_created"),
		/** Complexity score of hierarchy structures */
		hierarchyComplexity: numericCols.score("hierarchy_complexity"),
		/** Rate of cross-references and relationships created */
		crossReferenceRate: numericCols.rate("cross_reference_rate"),
		// Quality and engagement metrics
		/** Categories that actually have content */
		categoriesWithContent: numericCols.count("categories_with_content"),
		/** Categories that receive views/usage */
		categoriesWithViews: numericCols.count("categories_with_views"),
		/** Overall engagement quality score */
		engagementScore: numericCols.score("engagement_score"),
		// Analysis tracking
		/** Last time behavior was analyzed */
		lastAnalyzedAt: temporalCols.lastAnalyzed(),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Foreign key to user
		...userIdFkExtraConfig({
			tName: "user_category_behavior",
			cols,
		}),

		// Indexes for behavior analysis queries
		...multiIndexes({
			tName: "user_category_behavior",
			colsGrps: [
				{ cols: [cols.categoriesPerHour, cols.engagementScore] }, // Abuse detection
				{ cols: [cols.hierarchyComplexity] }, // Pattern analysis
				{ cols: [cols.lastAnalyzedAt] }, // Analysis freshness
			],
		}),
	],
);

const categoryReportingTableName = "category_reporting";
/**
 * Community reporting system for category quality
 *
 * Enables community-driven moderation where users can report
 * problematic categories for review and action.
 */
export const categoryReporting = table(
	categoryReportingTableName,
	{
		/** Unique report identifier */
		id: textCols.idPk(),
		/** Category being reported */
		categorySlug: textCols.slug("category_slug").notNull(),
		/**User who submitted the report */
		reportedByUserId: userIdFkCol("reported_by_user_id").notNull(),
		// Report details
		/**Type of report (spam, inappropriate, etc.) */
		reportType: reportTypeEnum("type").notNull(),
		/**Detailed reason for the report */
		reportReason: textCols.longText("report_reason"),
		/**Supporting evidence URLs */
		evidenceUrls: jsonCols.array("evidence_urls"),
		// Community validation
		/**Number of community votes supporting this report */
		communityVotes: numericCols.count("community_votes").default(0),
		/**Weight multiplier for moderator votes */
		moderatorWeight: numericCols.weight("moderator_weight").default(1.0),
		// Resolution tracking
		/**Current status of the report */
		status: reportStatusEnum("status").default("pending"),
		/**When report was resolved */
		resolvedAt: temporalCols.resolvedAt(),
		/**User who resolved the report */
		resolvedByUserId: userIdFkCol("resolved_by_user_id"),
		// Lifecycle
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		...userIdFkExtraConfig({
			tName: categoryReportingTableName,
			cols,
		}),
		// Foreign key constraints
		...multiForeignKeys({
			tName: categoryReportingTableName,
			fkGroups: [
				{
					cols: [cols.categorySlug],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),

		// Indexes for reporting workflows
		...multiIndexes({
			tName: categoryReportingTableName,
			colsGrps: [
				{ cols: [cols.status, cols.createdAt] }, // Pending reports queue
				{ cols: [cols.categorySlug] }, // Reports by category
				{ cols: [cols.reportedByUserId] }, // Reports by user
				{ cols: [cols.communityVotes] }, // Popular reports
			],
		}),
	],
);
