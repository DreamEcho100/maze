import { eq, isNotNull, isNull } from "drizzle-orm";
import {
	boolean,
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

import { createdAt, deletedAt, id, slug, table, updatedAt } from "../_utils/helpers.js";
import { currency } from "../currency-and-market/schema.js";
import { organization, organizationMarket, pricingZone } from "../organization/schema.js";
import { seoMetadata } from "../seo/schema.js";
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
		slug: slug.notNull(),
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
		index("idx_product_status").on(t.status),
		index("idx_product_type").on(t.type),
		index("idx_product_deleted_at").on(t.deletedAt),
		index("idx_product_created_at").on(t.createdAt),
		index("idx_product_status_type").on(t.status, t.type),
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
		isDefault: boolean("is_default").default(false),
		title: text("title"),
		description: text("description"),

		// SEO reference (optional - not all translations need SEO)
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_product_translation_product_locale").on(t.productId, t.locale),
		uniqueIndex("uq_product_translation_default")
			.on(t.productId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_product_translation_product").on(t.productId),
		index("idx_product_translation_locale").on(t.locale),
	],
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
		uniqueIndex("uq_product_variant_sku_org").on(t.productId, t.sku),
		index("idx_product_variant_product_id").on(t.productId),
		index("idx_product_variant_price").on(t.price), // For price-based queries
	],
);

// -------------------------------------
// PRICING BY MARKET/CURRENCY
// -------------------------------------

export const productPrice = table(
	"product_price",
	{
		id,
		productId: text("product_id")
			.references(() => product.id, { onDelete: "cascade" })
			.notNull(),
		variantId: text("variant_id")
			.references(() => productVariant.id, { onDelete: "cascade" })
			.notNull(),
		marketId: text("market_id").references(() => organizationMarket.id),
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
	(t) => [
		// Use conditional unique index or handle nulls properly
		uniqueIndex("uq_product_price_variant_market_currency")
			.on(t.variantId, t.marketId, t.currencyCode)
			.where(isNotNull(t.marketId)),
		// Separate unique index for global pricing (null market)
		uniqueIndex("uq_product_price_variant_global_currency")
			.on(t.variantId, t.currencyCode)
			.where(isNull(t.marketId)),
		index("idx_product_price_product").on(t.productId),
		index("idx_product_price_market").on(t.marketId),
		index("idx_product_price_currency").on(t.currencyCode),
		index("idx_product_price_dates").on(t.startsAt, t.endsAt),
		index("idx_product_price_active").on(t.startsAt, t.endsAt, t.currencyCode), // For active price lookups
	],
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
	(t) => [
		primaryKey({ columns: [t.variantId, t.zoneId, t.currencyCode] }),
		index("idx_product_zone_price_product").on(t.productId),
		index("idx_product_zone_price_zone").on(t.zoneId),
		index("idx_product_zone_price_currency").on(t.currencyCode),
	],
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
