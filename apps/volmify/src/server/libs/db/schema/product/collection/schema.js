import { primaryKey, text } from "drizzle-orm/pg-core";

import { createdAt, deletedAt, id, table, updatedAt } from "../../_utils/helpers.js";
import { organization } from "../../organization/schema.js";
import { discount } from "../offers/schema.js";
import { product } from "../schema.js";

// -------------------------------------
// COLLECTIONS
// -------------------------------------
export const collection = table("collection", {
	id,
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	image: text("image"),
	deletedAt,
	createdAt,
	updatedAt,
});
export const productCollection = table(
	"product_collection",
	{
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		collectionId: text("collection_id")
			.notNull()
			.references(() => collection.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);
export const discountCollection = table(
	"discount_collection",
	{
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		collectionId: text("collection_id")
			.notNull()
			.references(() => collection.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.discountId, t.collectionId] })],
);
