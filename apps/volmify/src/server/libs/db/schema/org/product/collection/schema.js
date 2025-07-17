import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, fk, id, table, updatedAt } from "../../../_utils/helpers.js";
import { orgTableName } from "../../_utils/helpers.js";
import { org } from "../../schema.js";
import { orgProduct } from "../schema.js";

const orgProductCollectionTableName = `${orgTableName}_product_collection`;
/**
 * @domainModel Product Collection
 * @abacRole Organizational Product Grouping
 * @businessLogic Enables merchants to organize products under shared banners,
 * promotions, or seasonal curation. Collections are per-org and serve
 * both frontend browsing and backend tagging purposes.
 *
 * @permissionContext Org-scoped access only
 * @multiTenantPattern OrganizationId is mandatory foreign key
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
		id: id.notNull(),

		/**
		 * @abacScope FK to the owning org
		 * @integrationContext Determines access scope and permission context
		 */
		orgId: fk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		/**
		 * @displayLabel Human-readable collection name
		 */
		name: text("name").notNull(),

		/**
		 * @slugField Unique slug within org for clean URLs and internal routing
		 * @seoOptimization Used for storefront routing and canonical links
		 */
		slug: text("slug").notNull(),

		/**
		 * @contentDescription Optional description shown in storefront or CMS
		 */
		description: text("description"),

		/**
		 * @mediaAsset Optional image used for visual branding of collection
		 */
		image: text("image"),

		/**
		 * @softDelete Supports archival/deactivation without full deletion
		 * @lifecycleStage Marks item as logically deleted
		 */
		deletedAt,

		/**
		 * @auditTrail Timestamps for record creation and modification
		 */
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgProductCollectionTableName}_org_id`).on(t.orgId),
		index(`idx_${orgProductCollectionTableName}_name`).on(t.name),
		uniqueIndex(`uq_${orgProductCollectionTableName}_slug_org`).on(t.orgId, t.slug),
		index(`idx_${orgProductCollectionTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductCollectionTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgProductCollectionTableName}_deleted_at`).on(t.deletedAt),
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
		productId: text("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "cascade" }),

		/**
		 * @abacLink Collection it is part of
		 */
		collectionId: text("collection_id")
			.notNull()
			.references(() => orgProductCollection.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.productId, t.collectionId] }),
		index(`idx_${orgProductCollectionProductTableName}_created_at`).on(t.createdAt),
	],
);
