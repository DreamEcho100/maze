import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, table, updatedAt } from "../../../_utils/helpers.js";
import { org } from "../../schema.js";
import { discount } from "../offers/schema.js";
import { orgProduct } from "../schema.js";

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
export const collection = table(
	"collection",
	{
		/**
		 * @uniqueIdentifier Internal PK for referencing this collection
		 */
		id: id.notNull(),

		/**
		 * @abacScope FK to the owning org
		 * @integrationContext Determines access scope and permission context
		 */
		orgId: text("org_id")
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
		index("idx_collection_org").on(t.orgId),
		index("idx_collection_deleted_at").on(t.deletedAt),
		index("idx_collection_name").on(t.name),
		uniqueIndex("uq_collection_slug_org").on(t.orgId, t.slug),
	],
);

/**
 * @junctionTable Product–Collection Mapping
 * @businessLogic Enables grouping multiple products under a single collection
 * and assigning a single product to many collections (e.g., "Summer Sale", "Trending").
 *
 * @permissionContext Inherits from both product and collection org context
 * @compensationModel Useful for applying discounts/promotions at collection level
 */
export const productCollection = table(
	"product_collection",
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
			.references(() => collection.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);

/**
 * @junctionTable Discount–Collection Mapping
 * @businessLogic Enables applying discount logic to entire collections
 * rather than individual products for easier promotion management.
 *
 * @permissionContext Bound to discount and collection org scopes
 * @onboardingPattern Makes it easier to bulk-apply promotions by marketing teams
 */
export const discountCollection = table(
	"discount_collection",
	{
		/**
		 * @discountLink Discount campaign being applied
		 */
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),

		/**
		 * @collectionLink Target collection receiving the discount
		 */
		collectionId: text("collection_id")
			.notNull()
			.references(() => collection.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.discountId, t.collectionId] })],
);
