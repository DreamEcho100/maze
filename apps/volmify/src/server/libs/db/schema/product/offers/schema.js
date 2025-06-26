import {
	boolean,
	decimal,
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
export const discount = table("discount", {
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
});

// 🧾 discount_translation
export const discountTranslation = table(
	"discount_translation",
	{
		id,
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),

		title: text("title"),
		description: text("description"),
	},
	(t) => [uniqueIndex("uq_discount_translation").on(t.discountId, t.locale)],
);

// 🧷 coupon (code-based discount wrapper)
export const coupon = table("coupon", {
	id,
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	discountId: text("discount_id")
		.notNull()
		.references(() => discount.id, { onDelete: "cascade" }),

	code: text("code").notNull().unique("uq_coupon_code"),
	usageLimit: integer("usage_limit"),
	usedCount: integer("used_count").default(0),
	isActive: boolean("is_active").default(true),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	metadata: jsonb("metadata"),
	createdAt,
	updatedAt,
});

// 🧾 coupon_translation (localization for coupon codes)
export const couponTranslation = table(
	"coupon_translation",
	{
		id,
		couponId: text("coupon_id")
			.notNull()
			.references(() => coupon.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		title: text("title"),
		description: text("description"),
	},
	(t) => [uniqueIndex("uq_coupon_translation").on(t.couponId, t.locale)],
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
	},
	(t) => [uniqueIndex("uq_user_discount_usage").on(t.userId, t.discountId)],
);

// 🎁 gift_card
export const giftCard = table("gift_card", {
	id,
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	code: text("code").notNull().unique("uq_gift_card_code"),
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
});

// 🎁 gift_card_translatio
export const giftCardTranslation = table(
	"gift_card_translation",
	{
		id,
		giftCardId: text("gift_card_id")
			.notNull()
			.references(() => giftCard.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),

		title: text("title"),
		description: text("description"),
	},
	(t) => [uniqueIndex("uq_gift_card_translation").on(t.giftCardId, t.locale)],
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
	},
	(t) => [uniqueIndex("uq_user_gift_card_usage").on(t.userId, t.giftCardId)],
);

// 🏷️ promotion (optional campaign or marketing grouping)
export const promotion = table("promotion", {
	id,
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),

	slug: text("slug").notNull().unique("uq_promotion_slug"),
	bannerImage: text("banner_image"),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	isActive: boolean("is_active").default(true),
	metadata: jsonb("metadata"),

	createdAt,
	updatedAt,
});

// 🗣️ 7. promotion_translation
export const promotionTranslation = table(
	"promotion_translation",
	{
		id,
		promotionId: text("promotion_id")
			.notNull()
			.references(() => promotion.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(),

		title: text("title"),
		description: text("description"),
		seoTitle: text("seo_title"),
		seoDescription: text("seo_description"),
	},
	(t) => [uniqueIndex("uq_promotion_translation").on(t.promotionId, t.locale)],
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
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [uniqueIndex("uq_promotion_discount").on(t.promotionId, t.discountId)],
);
