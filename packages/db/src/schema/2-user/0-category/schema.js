// ## user -> category
// =====================================
//  USER CATEGORY SYSTEM
// =====================================

import { numericCols } from "../../_utils/cols/numeric.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table, tEnum } from "../../_utils/tables.js";
import { seoMetadataIdFkCol } from "../../0-seo/0_utils/index.js";
import { category } from "../../schema.js";
import { buildUserI18nTable, userIdFkCol, userIdFkExtraConfig } from "../0_utils/index.js";

const userCategoryTableName = "user_category";
export const userCategoryScopeEnum = tEnum(`${userCategoryTableName}_scope`, [
	"user_job_profile_skill", // User-specific job profile skill categorization
]);
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
// -- user -> category
