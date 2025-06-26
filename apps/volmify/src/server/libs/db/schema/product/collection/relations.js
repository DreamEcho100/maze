import { relations } from "drizzle-orm";

import { organization } from "../../organization/schema.js";
import { discount } from "../offers/schema.js";
import { product } from "../schema.js";
import { collection, discountCollection, productCollection } from "./schema.js";

export const collectionRelations = relations(collection, ({ one, many }) => ({
	organization: one(organization, {
		fields: [collection.organizationId],
		references: [organization.id],
	}),
	products: many(productCollection),
	discounts: many(discountCollection),
}));

export const productCollectionRelations = relations(productCollection, ({ one }) => ({
	product: one(product, {
		fields: [productCollection.productId],
		references: [product.id],
	}),
	collection: one(collection, {
		fields: [productCollection.collectionId],
		references: [collection.id],
	}),
}));

export const discountCollectionRelations = relations(discountCollection, ({ one }) => ({
	discount: one(discount, {
		fields: [discountCollection.discountId],
		references: [discount.id],
	}),
	collection: one(collection, {
		fields: [discountCollection.collectionId],
		references: [collection.id],
	}),
}));
