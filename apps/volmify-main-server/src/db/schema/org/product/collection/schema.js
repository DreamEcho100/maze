import { text } from "drizzle-orm/pg-core";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import { compositePrimaryKey, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
import { orgTableName } from "../../_utils/helpers.js";

const orgProductCollectionTableName = `${orgTableName}_product_collection`;
/**
 * @domainModel Product Collection
 * @abacRole Org Product Grouping
 * @businessLogic Enables merchants to organize products under shared banners,
 * promotions, or seasonal curation. Collections are per-org and serve
 * both frontend browsing and backend tagging purposes.
 *
 * @permissionContext Org-scoped access only
 * @multiTenantPattern OrgId is mandatory foreign key
 * @auditTrail Tracks soft deletions, creation, and updates
 *
 * @indexingStrategy
 * - `uq_collection_slug_org`: Ensures slug is unique per org (used for URL routing)
 * - `idx_collection_name`: Enables search or filtering
 * - `idx_collection_deleted_at`: Supports lifecycle filtering
 */
export const orgProductCollection = table(
	orgProductCollectionTableName,
	{
		/**
		 * @uniqueIdentifier Internal PK for referencing this collection
		 */
		id: textCols.idPk().notNull(),

		/**
		 * @abacScope FK to the owning org
		 * @integrationContext Determines access scope and permission context
		 */
		orgId: orgIdFkCol().notNull(),

		/**
		 * @displayLabel Human-readable collection name
		 */
		title: textCols.title().notNull(),

		/**
		 * @slugField Unique slug within org for clean URLs and internal routing
		 * @seoOptimization Used for storefront routing and canonical links
		 */
		slug: textCols.slug().notNull(),

		/**
		 * @contentDescription Optional description shown in storefront or CMS
		 */
		description: textCols.description(),

		/**
		 * @mediaAsset Optional image used for visual branding of collection
		 */
		image: text("image"),

		/**
		 * @softDelete Supports archival/deactivation without full deletion
		 * @lifecycleStage Marks item as logically deleted
		 */
		deletedAt: temporalCols.audit.deletedAt(),

		/**
		 * @auditTrail Timestamps for record creation and modification
		 */
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgProductCollectionTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgProductCollectionTableName,
			cols: [cols.slug, cols.orgId],
		}),
		...multiIndexes({
			tName: orgProductCollectionTableName,
			colsGrps: [
				{ cols: [cols.title] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

const orgProductCollectionProductTableName = `${orgProductCollectionTableName}_product`;
/**
 * @junctionTable Product–Collection Mapping
 * @businessLogic Enables grouping multiple products under a single collection
 * and assigning a single product to many collections (e.g., "Summer Sale", "Trending").
 *
 * @permissionContext Inherits from both product and collection org context
 * @compensationModel Useful for applying discounts/promotions at collection level
 */
export const orgProductCollectionProduct = table(
	orgProductCollectionProductTableName,
	{
		/**
		 * @abacLink Product being associated
		 */
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "cascade" }),

		/**
		 * @abacLink Collection it is part of
		 */
		collectionId: textCols.idFk("collection_id").notNull(),
		// .references(() => orgProductCollection.id, { onDelete: "cascade" }),
		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => [
		// primaryKey({ columns: [t.productId, t.collectionId] }),
		// index(`idx_${orgProductCollectionProductTableName}_created_at`).on(t.createdAt),
		uniqueIndex({
			tName: orgProductCollectionProductTableName,
			cols: [cols.productId, cols.collectionId],
		}),
		compositePrimaryKey({
			tName: orgProductCollectionProductTableName,
			cols: [cols.productId, cols.collectionId],
		}),
		...multiIndexes({
			tName: orgProductCollectionProductTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
	],
);
