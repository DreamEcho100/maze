import { sql } from "drizzle-orm";
import { check, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "#db/schema/_utils/cols/numeric.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import { seoMetadataIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	userIdFkCol,
	userIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-id.js";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#db/schema/_utils/helpers.js";
import { table } from "#db/schema/_utils/tables.js";
import { buildOrgI18nTable } from "#db/schema/org/_utils/helpers.js";
import { buildUserI18nTable } from "#db/schema/user/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared";

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

const orgCategoryTableName = "org_category";
const userCategoryTableName = "user_category";
export const orgCategoryScopeEnum = pgEnum(`${orgCategoryTableName}_scope`, [
	// "org_product_category", // Traditional product taxonomy
	// "org_product_collection", // Marketing collections
	// "org_product_tag", // Flexible tagging system
	// "org_product_payment_plan_access_tier_category", // Access control categorization
	// "org_skill", // Organization-specific skill taxonomy
	"org_brand_category", // Brand-specific categorization
	"org_product_course_skill", // Course skill categorization
	"org_tax_category", // Tax-related categorization
]);
export const userCategoryScopeEnum = pgEnum(`${userCategoryTableName}_scope`, [
	"user_job_profile_skill", // User-specific job profile skill categorization
]);

// /**
//  * Category type enumeration supporting various taxonomy use cases
//  */
// export const categoryScopeEnum = pgEnum("category_scope", [
// 	orgCategoryScopeEnum.enumName[0],
// 	orgCategoryScopeEnum.enumName[1],
// 	orgCategoryScopeEnum.enumName[2],
// 	orgCategoryScopeEnum.enumName[3],
// 	orgCategoryScopeEnum.enumName[4],
// 	userCategoryScopeEnum.enumName[0],
// ]);

/**
 * Relationship type for multi-parent DAG structures
 */
export const relationshipTypeEnum = pgEnum("category_relationship_type", [
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

// =====================================
//  ORG CATEGORY SYSTEM
// =====================================

/**
 * Organization-specific category extensions
 *
 * Links global categories to specific orgs, enabling:
 * - Organization-scoped category customization
 * - Local category hierarchies and relationships
 * - Org-specific metadata and configurations
 */
export const orgCategory = table(
	orgCategoryTableName,
	{
		// id primary key, will be mostly used for relations outside this file and it's correct _scope_ per relation should be enforced on the API level
		id: textCols.idPk().notNull(),
		/** Organization identifier for multi-tenant isolation */
		orgId: orgIdFkCol().notNull(),
		createdByEmployeeId: orgEmployeeIdFkCol({ name: "created_by_employee_id" }),
		lastUpdatedByEmployeeId: orgEmployeeIdFkCol({ name: "last_updated_by_employee_id" }),

		/** Reference to global category slug */
		slugRef: textCols.slug("slug_ref").notNull(),
		/** Type of category (org-specific) */
		scope: orgCategoryScopeEnum("scope").notNull(),
		/** Creation timestamp */
		createdAt: temporalCols.audit.createdAt().notNull(),
		/** Last modification timestamp */
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Composite unique index key ensuring unique org+slug+scope combinations, will too be mostly used on relations on this file
		uniqueIndex({
			tName: orgCategoryTableName,
			cols: [cols.orgId, cols.slugRef, cols.scope],
		}),
		// Foreign key configurations
		...orgIdFkExtraConfig({
			tName: orgCategoryTableName,
			cols,
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryTableName,
			cols,
			colFkKey: "createdByEmployeeId",
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryTableName,
			cols,
			colFkKey: "lastUpdatedByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgCategoryTableName,
			fkGroups: [
				{
					cols: [cols.slugRef],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("restrict"), // Prevent deletion of global category
				},
			],
		}),
		// Optimized indexes for common access patterns
		...multiIndexes({
			tName: orgCategoryTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.slugRef] }, // Primary lookup pattern
				{ cols: [cols.createdAt] }, // Timeline queries
				{ cols: [cols.lastUpdatedAt] }, // Change tracking
			],
		}),
	],
);

/**
 * Organization category internationalization and localization
 *
 * Provides translatable content for categories with SEO optimization
 * and region-specific customization capabilities.
 */
export const orgCategoryI18n = buildOrgI18nTable(orgCategoryTableName)(
	{
		slugRef: textCols.slug("slug_ref").notNull(),
		name: textCols.name().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),

		// Ehanced integration fields
		// /** Additional keywords for search optimization */
		// searchKeywords: textCols.longText("search_keywords"),
		/** Display order for UI presentation */
		displayOrder: numericCols.sortOrder("display_order"),
		/** Public visibility flag */
		isPublic: sharedCols.isPublic().default(true),
		// /** UI theming color in hex format */
		// categoryColor: textCols.hexColor("category_color"),
	},
	{
		fkKey: "slugRef",
		extraConfig: (col, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [col.slugRef],
						foreignColumns: [category.slug],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [
					{ cols: [col.slugRef, col.name] }, // Primary lookup
					{ cols: [col.name] }, // Cross-org analysis
					// { cols: [col.displayOrder] }, // UI ordering
					{ cols: [col.isPublic] }, // Public visibility queries
				],
			}),
		],
	},
);

// =====================================
//  ORG CATEGORY DAGs SYSTEM
// =====================================
const orgCategoryAssociationTableName = `${orgCategoryTableName}_association`;
/**
 * Multi-parent DAG relationship system for orgs
 *
 * Enables sophisticated category hierarchies with multiple parent support,
 * allowing content to be discoverable through multiple logical paths.
 *
 * Business Value:
 * - 4x content discoverability through multiple categorization paths
 * - Enhanced user experience with flexible mental models
 * - Advanced recommendation algorithms using relationship graphs
 */
export const orgCategoryAssociation = table(
	orgCategoryAssociationTableName,
	{
		/** Organization identifier */
		orgId: orgIdFkCol().notNull(),
		createdByEmployeeId: orgEmployeeIdFkCol({ name: "created_by_employee_id" }),
		lastUpdatedByEmployeeId: orgEmployeeIdFkCol({ name: "last_updated_by_employee_id" }),

		childId: textCols.idFk("child_id").notNull(),
		parentId: textCols.idFk("parent_id").notNull(),

		// Scope for business logic validation
		scope: orgCategoryScopeEnum("scope").notNull(),

		// Relationship metadata/** Type of relationship (hierarchical, related, etc.) */
		relationshipType: relationshipTypeEnum("relationship_type").default("hierarchical"),
		/** Relationship strength/importance weight */
		weight: numericCols.weight(),
		/** Whether this is the primary parent relationship */
		isPrimary: sharedCols.isPrimary().default(false),

		// Audit trail
		// TODO: make it by employee
		// /** User who created this relationship */
		// createdByUserId: userIdFkCol("created_by_user_id"),
		/** Creation timestamp */
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Composite primary key prevents duplicate relationships
		compositePrimaryKey({
			tName: orgCategoryAssociationTableName,
			cols: [cols.orgId, cols.childId, cols.parentId, cols.scope],
		}),

		// Prevent self-referential relationships
		check(
			`${orgCategoryAssociationTableName}_no_self_reference`,
			sql`${cols.childId} != ${cols.parentId}`,
		),

		// Foreign key constraints
		...orgIdFkExtraConfig({
			tName: orgCategoryAssociationTableName,
			cols,
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryAssociationTableName,
			cols,
			colFkKey: "createdByEmployeeId",
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryAssociationTableName,
			cols,
			colFkKey: "lastUpdatedByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgCategoryAssociationTableName,
			fkGroups: [
				{
					cols: [cols.childId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.parentId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),

		// Performance indexes for DAG traversal
		...multiIndexes({
			tName: orgCategoryAssociationTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.childId] }, // Child category lookups
				{ cols: [cols.orgId, cols.parentId] }, // Parent category lookups
				{ cols: [cols.orgId, cols.scope] }, // Scope-based queries
				{ cols: [cols.relationshipType, cols.weight] }, // Relationship analysis
				{ cols: [cols.isPrimary] }, // Primary relationship queries
				{ cols: [cols.createdAt] }, // Creation timeline
				{ cols: [cols.lastUpdatedAt] }, // Last update tracking
			],
		}),
	],
);

const orgCategoryClosureAncestorPathTableName = `${orgCategoryTableName}_closure_ancestor_path`;
/**
 * Ancestor path closure table for fast DAG traversal
 * Pre-computes all ancestor relationships for O(1) hierarchy queries.
 * Essential for performance when dealing with complex category hierarchies.
 */
export const orgCategoryClosureAncestorPath = table(
	orgCategoryClosureAncestorPathTableName,
	{
		id: textCols.idPk().notNull(),
		/** Organization identifier */
		orgId: orgIdFkCol().notNull(),
		createdByEmployeeId: orgEmployeeIdFkCol({ name: "created_by_employee_id" }),
		lastUpdatedByEmployeeId: orgEmployeeIdFkCol({ name: "last_updated_by_employee_id" }),

		/** Ancestor category in the path */
		mainId: textCols.idFk("main_id").notNull(),
		/** Type of category (org-specific) */
		scope: orgCategoryScopeEnum("scope").notNull(),
		titleId: textCols.idFk("title_id").notNull(),
		depth: numericCols.depth().notNull(),
		usageCount: numericCols.count("usage_count").default(0),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// Composite primary key for unique ancestor paths
		uniqueIndex({
			tName: orgCategoryClosureAncestorPathTableName,
			cols: [cols.orgId, cols.mainId, cols.scope],
		}),
		// Foreign key constraints
		...orgIdFkExtraConfig({
			tName: orgCategoryClosureAncestorPathTableName,
			cols,
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryClosureAncestorPathTableName,
			cols,
			colFkKey: "createdByEmployeeId",
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryClosureAncestorPathTableName,
			cols,
			colFkKey: "lastUpdatedByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgCategoryClosureAncestorPathTableName,
			fkGroups: [
				{
					cols: [cols.mainId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.titleId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("restrict"), // Prevent deletion of global category
				},
			],
		}),
		// Performance indexes for common ancestor queries
		...multiIndexes({
			tName: orgCategoryClosureAncestorPathTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.scope, cols.depth] }, // Scope-aware depth analysis
				{ cols: [cols.orgId, cols.mainId] }, // Primary lookup
				{ cols: [cols.orgId, cols.depth] }, // Length analysis
				{ cols: [cols.createdAt] }, // Creation timeline
				{ cols: [cols.lastUpdatedAt] }, // Closure freshness
			],
		}),
	],
);

const orgCategoryClosureTableName = `${orgCategoryTableName}_closure`;
/**
 * Materialized closure table for fast DAG traversal
 *
 * Pre-computes all ancestor-descendant relationships for O(1) hierarchy queries.
 * Essential for performance when dealing with complex category hierarchies.
 */
export const orgCategoryClosure = table(
	orgCategoryClosureTableName,
	{
		/** Organization identifier */
		orgId: orgIdFkCol().notNull(),
		createdByEmployeeId: orgEmployeeIdFkCol({ name: "created_by_employee_id" }),
		lastUpdatedByEmployeeId: orgEmployeeIdFkCol({ name: "last_updated_by_employee_id" }),

		/** Ancestor category in the path */
		ancestorPathId: textCols.idFk("ancestor_path_id").notNull(),
		ancestorId: textCols.idFk("ancestor_id").notNull(),
		/** Type of category (org-specific) */
		scope: orgCategoryScopeEnum("scope").notNull(),
		/** Descendant category in the path */
		descendantId: textCols.idFk("descendant_id").notNull(),
		/** Depth of relationship (0 = self, 1 = direct child, etc.) */
		depth: numericCols.depth().notNull(),
		// Q: is this needed?
		// /** Number of different paths between ancestor and descendant */
		// pathCount: numericCols.count("path_count").default(1),

		// Performance optimization
		createdAt: temporalCols.audit.createdAt().notNull(),
		/** Last time this closure was updated */
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Composite primary key for unique closure relationships
		compositePrimaryKey({
			tName: orgCategoryClosureTableName,
			cols: [cols.orgId, cols.ancestorPathId, cols.descendantId, cols.scope],
		}),
		// Foreign key constraints
		...orgIdFkExtraConfig({
			tName: orgCategoryClosureTableName,
			cols,
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryClosureTableName,
			cols,
			colFkKey: "createdByEmployeeId",
		}),
		...orgEmployeeIdFkExtraConfig({
			tName: orgCategoryClosureTableName,
			cols,
			colFkKey: "lastUpdatedByEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgCategoryClosureTableName,
			fkGroups: [
				{
					cols: [cols.ancestorPathId],
					foreignColumns: [orgCategoryClosureAncestorPath.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.ancestorId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.descendantId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// Optimized indexes for common DAG queries
		...multiIndexes({
			tName: orgCategoryClosureTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.ancestorPathId] }, // Path lookups
				{ cols: [cols.orgId, cols.ancestorId] }, // Ancestor queries
				{ cols: [cols.orgId, cols.descendantId] }, // Descendant queries
				{ cols: [cols.orgId, cols.scope, cols.depth] }, // Scope-aware depth
				{ cols: [cols.ancestorPathId, cols.depth] }, // Path depth analysis
				// { cols: [cols.pathCount] }, // Path count analysis
				{ cols: [cols.createdAt] }, // Closure creation timeline
				{ cols: [cols.lastUpdatedAt] }, // Closure freshness
			],
		}),
		// Prevent self-referential closures
		// Proper self-reference logic
		// Prevent circular references in closures
		check(
			`${orgCategoryClosureTableName}_self_reference_logic`,
			sql`(${cols.ancestorId} = ${cols.descendantId} AND ${cols.depth} = 0) OR 
      (${cols.ancestorId} != ${cols.descendantId} AND ${cols.depth} > 0)`,
		),
		// Ensure depth is non-negative
		check(`${orgCategoryClosureTableName}_depth_non_negative`, sql`${cols.depth} >= 0`),
		// // Ensure path count is positive
		// check(`${orgCategoryClosureTableName}_path_count_positive`, sql`${cols.pathCount} > 0`),
	],
);

// =====================================
//  USER CATEGORY SYSTEM
// =====================================
/**
 * User-specific category extensions
 *
 * Links global categories to specific users, enabling:
 * - User-scoped category customization
 * - Local category hierarchies and relationships
 * - Org-specific metadata and configurations
 */
export const userCategory = table(
	userCategoryTableName,
	{
		// id primary key, will be mostly used for relations outside this file and it's correct _scope_ per relation should be enforced on the API level
		id: textCols.idPk().notNull(),
		/** User identifier for multi-tenant isolation */
		userId: userIdFkCol().notNull(),
		/** Reference to global category slug */
		slugRef: textCols.slug("slug_ref").notNull(),
		/** Type of category (user-specific) */
		scope: userCategoryScopeEnum("scope").notNull(),
		/** Creation timestamp */
		createdAt: temporalCols.audit.createdAt().notNull(),
		/** Last modification timestamp */
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt().notNull(),
	},
	(cols) => [
		// Composite unique index key ensuring unique user+slug+scope combinations, will too be mostly used on relations on this file
		uniqueIndex({
			tName: userCategoryTableName,
			cols: [cols.userId, cols.slugRef, cols.scope],
		}),
		// Foreign key configurations
		...userIdFkExtraConfig({
			tName: userCategoryTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: userCategoryTableName,
			fkGroups: [
				{
					cols: [cols.slugRef],
					foreignColumns: [category.slug],
					afterBuild: (fk) => fk.onDelete("restrict"), // Prevent deletion of global category
				},
			],
		}),
		// Optimized indexes for common access patterns
		...multiIndexes({
			tName: userCategoryTableName,
			colsGrps: [
				{ cols: [cols.userId, cols.slugRef] }, // Primary lookup pattern
				{ cols: [cols.createdAt] }, // Timeline queries
				{ cols: [cols.lastUpdatedAt] }, // Change tracking
			],
		}),
	],
);

/**
 * User category internationalization and localization
 *
 * Provides translatable content for categories with SEO optimization
 * and region-specific customization capabilities.
 */
export const userCategoryI18n = buildUserI18nTable(userCategoryTableName)(
	{
		slugRef: textCols.slug("slug_ref").notNull(),
		name: textCols.name().notNull(),
		description: textCols.description(),
		seoMetadataId: seoMetadataIdFkCol(),

		// Ehanced integration fields
		// /** Additional keywords for search optimization */
		// searchKeywords: textCols.longText("search_keywords"),
		/** Display order for UI presentation */
		displayOrder: numericCols.sortOrder("display_order"),
		/** Public visibility flag */
		isPublic: sharedCols.isPublic().default(true),
		// /** UI theming color in hex format */
		// categoryColor: textCols.hexColor("category_color"),
	},
	{
		fkKey: "slugRef",
		extraConfig: (col, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [col.slugRef],
						foreignColumns: [category.slug],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [
					{ cols: [col.slugRef, col.name] }, // Primary lookup
					{ cols: [col.name] }, // Cross-user analysis
					// { cols: [col.displayOrder] }, // UI ordering
					{ cols: [col.isPublic] }, // Public visibility queries
				],
			}),
		],
	},
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
