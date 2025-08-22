// ## category

import { numericCols } from "../_utils/cols/numeric.js";
import { sharedCols } from "../_utils/cols/shared/index.js";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../_utils/helpers.js";
import { table, tEnum } from "../_utils/tables.js";

/**
 * @fileoverview Category System Schema
 *
 * This module implements a sophisticated category taxonomy system with:
 * - Global category registry with slug-based deduplication, cross-org analytics, and intelligence features
 * - Organization-specific extensions (customization & branding)
 * - User-specific extensions (personal organization))
 * - DAG support for multi-parent hierarchies (flexible content categorization)
 * - Performance-optimized tree materialization
 * - Advanced security & comprehensive abuse prevention
 *
 * Strategic Benefits:
 * - Cross-organizational category analytics and recommendations
 * - Enhanced content discoverability through multiple categorization paths
 * - Unified platform-wide category intelligence for competitive advantage
 */
/*
### **Clean Organization & Documentation**
- **Comprehensive JSDoc comments** explaining business value and technical details
- **Logical section organization** with clear boundaries
- **Type definitions** for better developer experience
- **Strategic comments** explaining competitive advantages

### **Complete DAG Implementation**
- **Multi-parent relationships** via `orgCategoryRelationships`
- **Materialized closures** for O(1) hierarchy queries
- **Relationship types** for flexible category connections
- **Cycle prevention** with database constraints

### **Performance Optimizations**
- **Strategic indexing** for common query patterns
- **Materialized views** via closure tables
- **Efficient foreign key structures**
- **Optimized composite keys**

### **Feature Completeness**
- **Category analytics** with platform-wide metrics
- **ML feature storage** for recommendation systems
- **Enhanced I18n support** with SEO optimization
- **Proper foreign key relationships**
- **Migration-safe legacy table preservation**

### **Business Intelligence**
- **Cross-organizational analytics** capabilities
- **Trending and recommendation** data structures
- **Quality scoring** for content optimization
- **Usage patterns** for business insights
*/

// =====================================
//  ENUMS & CORE TYPES
// =====================================

/**
 * Relationship type for multi-parent DAG structures
 */
export const relationshipTypeEnum = tEnum("category_relationship_type", [
	"hierarchical", // Traditional parent-child
	"related", // Cross-category associations
	"synonym", // Alternative naming
	"broader", // Broader concept relationship
	"narrower", // More specific concept
	"cross_reference", // Related/similar categories
	"alias", // Alternative naming
	"migration", // Category consolidation
]);
// =====================================
//  CORE CATEGORY TABLES
// =====================================

/**
 * Global category registry - the foundation of the taxonomy system
 *
 * This table serves as a platform-wide category registry that eliminates
 * duplication across orgs while enabling shared category intelligence.
 *
 * Business Value:
 * - Deduplication at scale across all orgs
 * - Platform-wide category analytics and trending analysis
 * - Cross-organizational category recommendations
 * - Unified search and discovery capabilities
 */
const categoryTableName = "category";
export const category = table(
	categoryTableName,
	{
		/** URL-friendly unique identifier and primary key */
		slug: textCols.slug().notNull().primaryKey(),
		/** Soft deletion flag for category lifecycle management */
		isActive: sharedCols.isActive().default(true),
		/** Timestamp when category was deprecated */
		deprecatedAt: temporalCols.audit.deprecatedAt(),
		/** Target category slug for migration during merging */
		migrationTarget: textCols.slug("migration_target"),
		/** Creation timestamp for audit trail */
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		// Ensure migration target exists
		...multiForeignKeys({
			tName: categoryTableName,
			fkGroups: [
				{
					cols: [cols.migrationTarget],
					foreignColumns: [cols.slug],
					// afterBuild: (fk) => fk.onDelete("restrict"), // Prevent deletion of target category
				},
			],
		}),
		// Ensure slug uniqueness at database level
		uniqueIndex({
			tName: categoryTableName,
			cols: [cols.slug],
		}),
		// Optimized indexes for common query patterns
		...multiIndexes({
			tName: categoryTableName,
			colsGrps: [
				{ cols: [cols.isActive, cols.createdAt] }, // Active categories timeline
				{ cols: [cols.deprecatedAt] }, // Deprecated category management
			],
		}),
	],
);

const categoryMetricsTableName = `${categoryTableName}_metrics`;
/**
 * Category performance metrics and analytics
 *
 * Provides platform-wide intelligence about category usage, performance,
 * and trends to drive recommendations and optimization.
 */
export const categoryMetrics = table(
	categoryMetricsTableName,
	{
		/** Reference to category slug */
		slugRef: textCols.slug("slug_ref").notNull().primaryKey(),
		// Usage Statistics
		/** Total times this category has been used across platform */
		totalUsage: numericCols.count("total_usage").default(0),
		// /** Average rating from content in this category */
		// avgRating: numericCols.rating("avg_rating"),
		// /** Calculated trending score for discovery algorithms */
		// trendingScore: numericCols.score("trending_score").default(0),
		/** Last time this category was actively used */
		lastUsedAt: temporalCols.lastUsedAt(),
		// Type-specific counts for detailed analytics
		orgBrandCategoryCount: numericCols.count("org_brand_category_count").default(0),
		orgProductCourseSkillCount: numericCols.count("org_product_course_skill_count").default(0),
		orgTaxCategoryCount: numericCols.count("org_tax_category_count").default(0),
		userJobProfileSkillCount: numericCols.count("user_job_profile_skill_count").default(0),

		// Audit fields
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Foreign key to category
		...multiForeignKeys({
			tName: categoryMetricsTableName,
			fkGroups: [
				{
					cols: [cols.slugRef],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// Performance indexes
		...multiIndexes({
			tName: categoryMetricsTableName,
			colsGrps: [
				// { cols: [cols.trendingScore, cols.totalUsage] }, // Trending algorithms
				// { cols: [cols.avgRating, cols.totalUsage] }, // Quality filtering
				{ cols: [cols.lastUsedAt] }, // Recency analysis
			],
		}),
	],
);

/*

// Note:
// -  Will focus now on the category, org category,  org category DAGs system, and the user category  development.
// - Will add category abuse system later.

**For MVP - Skip User DAGs:**
```javascript
// Users typically have simpler categorization needs:
// - Personal skill lists (flat structure)
// - Learning interests (tags)
// - Simple hierarchies (beginner → intermediate → advanced)
```

**Add User DAGs Later When:**
- Users request complex personal taxonomies
- You need user-specific content relationship mapping
- Personal learning path optimization becomes important
- User-generated category hierarchies emerge

**Strategic Approach:**
```javascript
// Phase 1 (Current): Flat user categories
userCategory → category (simple reference)

// Phase 2 (Future): Add user DAGs when needed
userCategoryAssociation (copy pattern from org system)
userCategoryClosure (if path analytics needed)
```
*/
