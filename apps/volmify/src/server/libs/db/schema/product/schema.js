import {
	decimal,
	index,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

import { createdAt, deletedAt, id, table, updatedAt } from "../_utils/helpers.js";
import { currency, market } from "../currency-and-market/schema.js";
import { organization, pricingZone } from "../organization/schema.js";
import { discount } from "./offers/schema.js";

// -------------------------------------
// ENUMS
// -------------------------------------

export const productTypeEnum = pgEnum("product_type", ["physical", "digital", "course", "service"]);

export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

// -------------------------------------
// CORE PRODUCT
// -------------------------------------

export const product = table(
	"product",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		slug: varchar("slug", { length: 128 }).notNull(),
		title: varchar("title", { length: 256 }).notNull(),
		description: text("description"),
		status: productStatusEnum("status").default("draft").notNull(),
		type: productTypeEnum("type").default("physical").notNull(),
		thumbnail: varchar("thumbnail", { length: 1024 }),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		index("idx_product_organization").on(t.organizationId),
		uniqueIndex("uq_product_slug_org").on(t.organizationId, t.slug),
	],
);

// -------------------------------------
// LOCALIZATION (I18N)
// -------------------------------------

export const productTranslation = table(
	"product_translation",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		title: text("title"),
		description: text("description"),
		seoTitle: text("seo_title"),
		seoDescription: text("seo_description"),
	},
	(t) => [uniqueIndex("uq_product_translation_locale").on(t.productId, t.locale)],
);

// -------------------------------------
// VARIANTS (size, color, access level)
// -------------------------------------

export const productVariant = table(
	"product_variant",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		sku: varchar("sku", { length: 64 }).notNull(),
		title: varchar("title", { length: 128 }),
		price: decimal("price", { precision: 10, scale: 2 }),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_product_variant_product_id").on(t.productId),
		uniqueIndex("uq_product_variant_sku").on(t.sku),
	],
);

// -------------------------------------
// PRICING BY MARKET/CURRENCY
// -------------------------------------

export const productPrice = table(
	"product_price",
	{
		productId: text("product_id")
			.references(() => product.id, { onDelete: "cascade" })
			.notNull(),
		variantId: text("variant_id")
			.references(() => productVariant.id, { onDelete: "cascade" })
			.notNull(),
		marketId: text("market_id").references(() => market.id),
		currencyCode: text("currency_code")
			.references(() => currency.code)
			.notNull(),
		price: decimal("price", { precision: 10, scale: 2 }).notNull(),
		compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
		taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		createdAt,
	},
	(t) => [primaryKey({ columns: [t.variantId, t.currencyCode, t.marketId] })],
);

// -------------------------------------
// OPTIONAL: PRICING ZONE OVERRIDES
// -------------------------------------

export const productZonePrice = table(
	"product_zone_price",
	{
		productId: text("product_id").references(() => product.id),
		variantId: text("variant_id").references(() => productVariant.id),
		zoneId: text("zone_id").references(() => pricingZone.id),
		currencyCode: text("currency_code").references(() => currency.code),
		price: decimal("price", { precision: 10, scale: 2 }).notNull(),
		compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
		createdAt,
	},
	(t) => [primaryKey({ columns: [t.variantId, t.zoneId, t.currencyCode] })],
);

// Join Tables for Product/Variant-Discounts

export const discountProduct = table(
	"discount_product",
	{
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.discountId, t.productId] })],
);
export const discountVariant = table(
	"discount_variant",
	{
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		variantId: text("variant_id")
			.notNull()
			.references(() => productVariant.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.discountId, t.variantId] })],
);

// // -------------------------------------
// // COURSE-SPECIFIC STRUCTURE
// // -------------------------------------

// export const courseSection = table(
// 	"course_section",
// 	{
// 		id,
// 		productId: text("product_id")
// 			.references(() => product.id, { onDelete: "cascade" })
// 			.notNull(),
// 		title: varchar("title", { length: 256 }).notNull(),
// 		order: integer("order").notNull(),
// 		metadata: jsonb("metadata"),
// 		createdAt,
// 	},
// 	(t) => [index("idx_course_section_product").on(t.productId)],
// );

// export const courseLesson = table(
// 	"course_lesson",
// 	{
// 		id,
// 		sectionId: text("section_id")
// 			.references(() => courseSection.id, { onDelete: "cascade" })
// 			.notNull(),
// 		title: varchar("title", { length: 256 }).notNull(),
// 		content: text("content"),
// 		videoUrl: text("video_url"),
// 		order: integer("order").notNull(),
// 		isPreview: boolean("is_preview").default(false),
// 		metadata: jsonb("metadata"),
// 		createdAt,
// 	},
// 	(t) => [index("idx_course_lesson_section").on(t.sectionId)],
// );
