import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

import { createdAt, deletedAt, id, table, updatedAt } from "../../_utils/helpers.js";
import { organization } from "../../organization/schema.js";
import { discount } from "../offers/schema.js";
import { product } from "../schema.js";

// -------------------------------------
// COLLECTIONS
// -------------------------------------
export const collection = table(
	"collection",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		image: text("image"),
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_collection_organization").on(t.organizationId),
		index("idx_collection_deleted_at").on(t.deletedAt),
		index("idx_collection_name").on(t.name),
		uniqueIndex("uq_collection_slug_org").on(t.organizationId, t.slug), // ✅ Per-org unique
	],
);
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
