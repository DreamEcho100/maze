import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { createdAt, id, table, updatedAt } from "../../_utils/helpers.js";
import { user } from "../../auth/schema.js";
import { currency } from "../../currency-and-market/schema.js";
import { organization } from "../../organization/schema.js";
import { seoMetadata } from "../../seo/schema.js";

export const discountTypeEnum = pgEnum("discount_type", [
	"percentage", // e.g. 10% off
	"fixed", // e.g. $20 off
	"free_shipping", // only removes shipping cost
	"buy_x_get_y", // future-proof
]);

export const discountAppliesToEnum = pgEnum("discount_applies_to", [
	"product", // applies to specific products
	"variant", // applies to specific product variants
	"collection", // applies to specific collections
	"all", // applies to all products/variants in the organization
]);

// 🏷️ discount (core discount entity)  (base rule — percentage, fixed, free shipping)
export const discount = table(
	"discount",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		type: discountTypeEnum("type").notNull(),
		value: decimal("value", { precision: 10, scale: 2 }).notNull(), // meaning depends on type

		currencyCode: text("currency_code") // only for fixed
			.references(() => currency.code),

		appliesTo: discountAppliesToEnum("applies_to").notNull().default("all"),
		isActive: boolean("is_active").default(true),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),

		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_discount_organization").on(t.organizationId),
		index("idx_discount_type").on(t.type),
		index("idx_discount_active").on(t.isActive),
		index("idx_discount_applies_to").on(t.appliesTo),
		index("idx_discount_dates").on(t.startsAt, t.endsAt),
		index("idx_discount_active_dates").on(t.isActive, t.startsAt, t.endsAt),
		index("idx_discount_currency").on(t.currencyCode),
	],
);

// 🧾 discount_translation
export const discountTranslation = table(
	"discount_translation",
	{
		id,
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
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
		uniqueIndex("uq_discount_translation").on(t.discountId, t.locale),
		uniqueIndex("uq_discount_translation_default")
			.on(t.discountId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_discount_translation_locale").on(t.locale),
		index("idx_discount_translation_default").on(t.isDefault),
	],
);

// 👥 discount_usage (track who used wha
export const discountUsage = table(
	"discount_usage",
	{
		id,
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		orderId: text("order_id"), // optional, if linked to an order
		amountDiscounted: decimal("amount_discounted", { precision: 10, scale: 2 }), // amount discounted by this usage
	},
	(t) => [
		index("idx_discount_usage_user_discount").on(t.userId, t.discountId),
		index("idx_discount_usage_date").on(t.usedAt),
	],
);

// 🧷 coupon (code-based discount wrapper)
export const coupon = table(
	"coupon",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),

		code: text("code").notNull(),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),
		isActive: boolean("is_active").default(true),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_coupon_code_org").on(t.organizationId, t.code),
		// Add these missing indexes
		index("idx_coupon_organization").on(t.organizationId),
		index("idx_coupon_discount").on(t.discountId),
		index("idx_coupon_active").on(t.isActive),
		index("idx_coupon_dates").on(t.startsAt, t.endsAt),
		index("idx_coupon_active_dates").on(t.isActive, t.startsAt, t.endsAt),
	],
);

// 🧾 coupon_translation (localization for coupon codes)
export const couponTranslation = table(
	"coupon_translation",
	{
		id,
		couponId: text("coupon_id")
			.notNull()
			.references(() => coupon.id, { onDelete: "cascade" }),
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
		uniqueIndex("uq_coupon_translation").on(t.couponId, t.locale),
		uniqueIndex("uq_coupon_translation_default")
			.on(t.couponId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_coupon_translation_locale").on(t.locale),
		index("idx_coupon_translation_default").on(t.isDefault),
	],
);

// 🎁 gift_card
export const giftCard = table(
	"gift_card",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		code: text("code").notNull(),
		initialBalance: decimal("initial_balance", { precision: 10, scale: 2 }).notNull(),
		remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),

		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		issuedToUserId: text("issued_to_user_id").references(() => user.id),
		issuedToEmail: text("issued_to_email"),

		issuedAt: timestamp("issued_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_gift_card_code_org").on(t.organizationId, t.code),
		index("idx_gift_card_organization").on(t.organizationId),
		index("idx_gift_card_currency").on(t.currencyCode),
		index("idx_gift_card_user").on(t.issuedToUserId),
		index("idx_gift_card_email").on(t.issuedToEmail),
		index("idx_gift_card_active").on(t.isActive),
		index("idx_gift_card_expires").on(t.expiresAt),
		index("idx_gift_card_balance").on(t.remainingBalance), // For balance queries
	],
);

// 🎁 gift_card_translatio
export const giftCardTranslation = table(
	"gift_card_translation",
	{
		id,
		giftCardId: text("gift_card_id")
			.notNull()
			.references(() => giftCard.id, { onDelete: "cascade" }),
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
		uniqueIndex("uq_gift_card_translation").on(t.giftCardId, t.locale),
		uniqueIndex("uq_gift_card_translation_default")
			.on(t.giftCardId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_gift_card_translation_locale").on(t.locale),
		index("idx_gift_card_translation_default").on(t.isDefault),
	],
);

// 🏷️ gift_card_usage (track who used what)
export const giftCardUsage = table(
	"gift_card_usage",
	{
		id,
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		giftCardId: text("gift_card_id")
			.notNull()
			.references(() => giftCard.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		amountUsed: decimal("amount_used", { precision: 10, scale: 2 }).notNull(),
		orderId: text("order_id"), // optional, if linked to an order
	},
	(t) => [
		index("idx_gift_card_usage_user").on(t.userId),
		index("idx_gift_card_usage_gift_card").on(t.giftCardId),
		index("idx_gift_card_usage_date").on(t.usedAt),
	],
);

// 🏷️ promotion (optional campaign or marketing grouping)
export const promotion = table(
	"promotion",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		slug: text("slug").notNull(),
		bannerImage: text("banner_image"),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_promotion_slug_org").on(t.organizationId, t.slug), // Per-org unique
		index("idx_promotion_organization").on(t.organizationId),
		index("idx_promotion_active").on(t.isActive),
		index("idx_promotion_dates").on(t.startsAt, t.endsAt),
		index("idx_promotion_active_dates").on(t.isActive, t.startsAt, t.endsAt),
	],
);

// 🗣️ 7. promotion_translation
export const promotionTranslation = table(
	"promotion_translation",
	{
		id,
		promotionId: text("promotion_id")
			.notNull()
			.references(() => promotion.id, { onDelete: "cascade" }),
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
		uniqueIndex("uq_promotion_translation").on(t.promotionId, t.locale),
		uniqueIndex("uq_promotion_translation_default")
			.on(t.promotionId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_promotion_translation_locale").on(t.locale),
		index("idx_promotion_translation_default").on(t.isDefault),
	],
);

// 🔗 promotion_discount  (link discounts to promotions)
export const promotionDiscount = table(
	"promotion_discount",
	{
		id,
		promotionId: text("promotion_id")
			.notNull()
			.references(() => promotion.id, { onDelete: "cascade" }),
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [uniqueIndex("uq_promotion_discount").on(t.promotionId, t.discountId)],
);
