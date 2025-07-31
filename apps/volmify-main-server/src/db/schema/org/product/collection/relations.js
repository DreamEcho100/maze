import { relations } from "drizzle-orm";

import { org } from "../../schema.js";
import { orgDiscountProductCollection } from "../offers/schema.js";
import { orgProduct } from "../schema.js";
import { orgProductCollection, orgProductCollectionProduct } from "./schema.js";

/**
 * @relationModel Collection Relations
 * @abacRole Product Curation Container
 * @businessLogic Represents an org grouping of products for
 * merchandising, promotional campaigns, or thematic browsing experiences.
 *
 * @integrationContext
 * Enables linking collections to:
 * - Products (curation/view logic)
 * - Discounts (bulk promotional logic)
 * - Owning Org (access boundaries)
 */
export const collectionRelations = relations(orgProductCollection, ({ one, many }) => ({
	/**
	 * @abacScope Org providing collection boundary
	 * @permissionContext Determines who can manage this collection
	 */
	org: one(org, {
		fields: [orgProductCollection.orgId],
		references: [org.id],
	}),

	/**
	 * @relationType Many-to-many with Products
	 * @businessLogic Defines which products are curated under this collection
	 * @contentStrategy Enables thematic or seasonal grouping
	 */
	products: many(orgProductCollectionProduct),

	/**
	 * @relationType Many-to-many with Discounts
	 * @monetizationModel Used to apply bulk discount logic to all products in collection
	 */
	discounts: many(orgDiscountProductCollection),
}));

/**
 * @junctionModel Product–Collection Relations
 * @businessLogic Binds products to collections for grouped representation.
 * Enables many-to-many structure between products and collections.
 *
 * @permissionContext Relies on both product and collection org context
 * @abacLink Joins curated content with presentation structure
 */
export const productCollectionRelations = relations(orgProductCollectionProduct, ({ one }) => ({
	/**
	 * @abacSubject Product being assigned to a collection
	 */
	product: one(orgProduct, {
		fields: [orgProductCollectionProduct.productId],
		references: [orgProduct.id],
	}),

	/**
	 * @abacContext Collection that hosts this product
	 */
	collection: one(orgProductCollection, {
		fields: [orgProductCollectionProduct.collectionId],
		references: [orgProductCollection.id],
	}),
}));
