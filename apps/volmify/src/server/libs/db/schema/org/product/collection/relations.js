import { relations } from "drizzle-orm";

import { org } from "../../schema.js";
import { discount } from "../offers/schema.js";
import { product } from "../schema.js";
import { collection, discountCollection, productCollection } from "./schema.js";

/**
 * @relationModel Collection Relations
 * @abacRole Product Curation Container
 * @businessLogic Represents an organizational grouping of products for
 * merchandising, promotional campaigns, or thematic browsing experiences.
 *
 * @integrationContext
 * Enables linking collections to:
 * - Products (curation/view logic)
 * - Discounts (bulk promotional logic)
 * - Owning Org (access boundaries)
 */
export const collectionRelations = relations(collection, ({ one, many }) => ({
	/**
	 * @abacScope Org providing collection boundary
	 * @permissionContext Determines who can manage this collection
	 */
	org: one(org, {
		fields: [collection.organizationId],
		references: [org.id],
	}),

	/**
	 * @relationType Many-to-many with Products
	 * @businessLogic Defines which products are curated under this collection
	 * @contentStrategy Enables thematic or seasonal grouping
	 */
	products: many(productCollection),

	/**
	 * @relationType Many-to-many with Discounts
	 * @monetizationModel Used to apply bulk discount logic to all products in collection
	 */
	discounts: many(discountCollection),
}));

/**
 * @junctionModel Product–Collection Relations
 * @businessLogic Binds products to collections for grouped representation.
 * Enables many-to-many structure between products and collections.
 *
 * @permissionContext Relies on both product and collection org context
 * @abacLink Joins curated content with presentation structure
 */
export const productCollectionRelations = relations(productCollection, ({ one }) => ({
	/**
	 * @abacSubject Product being assigned to a collection
	 */
	product: one(product, {
		fields: [productCollection.productId],
		references: [product.id],
	}),

	/**
	 * @abacContext Collection that hosts this product
	 */
	collection: one(collection, {
		fields: [productCollection.collectionId],
		references: [collection.id],
	}),
}));

/**
 * @junctionModel Discount–Collection Relations
 * @businessLogic Connects discount rules with curated product collections.
 * Used to simplify promotional logic and automate discount application.
 *
 * @abacRole Promotion Assignment Mapping
 * @permissionContext Scope governed by discount and collection org IDs
 */
export const discountCollectionRelations = relations(discountCollection, ({ one }) => ({
	/**
	 * @monetizationRule Discount entity being applied to the collection
	 */
	discount: one(discount, {
		fields: [discountCollection.discountId],
		references: [discount.id],
	}),

	/**
	 * @abacTarget Target collection to which discount is applied
	 */
	collection: one(collection, {
		fields: [discountCollection.collectionId],
		references: [collection.id],
	}),
}));
