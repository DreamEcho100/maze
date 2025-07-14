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

import { createdAt, getLocaleKey, id, table, updatedAt } from "../../../_utils/helpers.js";
import { currency, locale } from "../../../system/locale-currency-market/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { user } from "../../../user/schema.js";
import { org } from "../../schema.js";

/**
 * @enumModel DiscountType
 * @businessLogic Distinguishes discount computation logic
 * @auditTrail Determines financial impact calculation method
 */
export const discountTypeEnum = pgEnum("discount_type", [
	"percentage", // percentage-based reduction
	"fixed", // fixed currency amount
	"free_shipping", // removes shipping cost
	"buy_x_get_y", // future expansion for quantity logic
]);

/**
 * @enumModel DiscountAppliesTo
 * @permissionContext Defines scoping logic for discount applicability
 * @abacRole Affects who can redeem based on resource association
 */
export const discountAppliesToEnum = pgEnum("discount_applies_to", [
	"product",
	"variant",
	"collection",
	"all",
]);

/**
 * @table discount
 * @businessLogic Core discount rule applicable to products or orders
 * @auditTrail Traceable financial benefit allocation
 * @multiTenantPattern Scoped to org
 */
export const discount = table(
	"discount",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		type: discountTypeEnum("type").notNull(),
		value: decimal("value", { precision: 10, scale: 2 }).notNull(),

		currencyCode: text("currency_code").references(() => currency.code),

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

/**
 * @table discount_translation
 * @i18nSupport Provides localized display for discounts
 * @seoSupport Optional SEO metadata integration
 */
export const discountTranslation = table(
	"discount_translation",
	{
		id: id.notNull(),
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id, { onDelete: "cascade" }),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		title: text("title"),
		description: text("description"),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_discount_translation").on(t.discountId, t.localeKey),
		uniqueIndex("uq_discount_translation_default")
			.on(t.discountId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_discount_translation_locale_key").on(t.localeKey),
		index("idx_discount_translation_default").on(t.isDefault),
	],
);

/**
 * @table discount_usage
 * @auditTrail Tracks who used a discount and when
 * @businessLogic Enables enforcing usage limits and personalization
 */
export const discountUsage = table(
	"discount_usage",
	{
		id: id.notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		discountId: text("discount_id")
			.notNull()
			.references(() => discount.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		orderId: text("order_id"),
		amountDiscounted: decimal("amount_discounted", { precision: 10, scale: 2 }),
	},
	(t) => [
		index("idx_discount_usage_user_discount").on(t.userId, t.discountId),
		index("idx_discount_usage_date").on(t.usedAt),
	],
);

/**
 * @table coupon
 * @compensationModel Code-based wrapper for discount logic
 * @permissionContext Can be scoped and assigned per user or campaign
 */
export const coupon = table(
	"coupon",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
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
		index("idx_coupon_organization").on(t.organizationId),
		index("idx_coupon_discount").on(t.discountId),
		index("idx_coupon_active").on(t.isActive),
		index("idx_coupon_dates").on(t.startsAt, t.endsAt),
		index("idx_coupon_active_dates").on(t.isActive, t.startsAt, t.endsAt),
	],
);

/**
 * @table coupon_translation
 * @i18nSupport Localized titles and descriptions for coupons
 */
export const couponTranslation = table(
	"coupon_translation",
	{
		id: id.notNull(),
		couponId: text("coupon_id")
			.notNull()
			.references(() => coupon.id, { onDelete: "cascade" }),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		title: text("title"),
		description: text("description"),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_coupon_translation").on(t.couponId, t.localeKey),
		uniqueIndex("uq_coupon_translation_default")
			.on(t.couponId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_coupon_translation_locale_key").on(t.localeKey),
		index("idx_coupon_translation_default").on(t.isDefault),
	],
);

/**
 * @table gift_card
 * @compensationModel Prepaid value cards used as alternative payment method
 * @auditTrail Tracks balance and issuance info for reconciliation
 */
export const giftCard = table(
	"gift_card",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
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
		index("idx_gift_card_balance").on(t.remainingBalance),
	],
);

/**
 * @table gift_card_translation
 * @i18nSupport Localization support for gift cards
 * @seoSupport Enables optional SEO visibility for promotional cards
 */
export const giftCardTranslation = table(
	"gift_card_translation",
	{
		id: id.notNull(),
		giftCardId: text("gift_card_id")
			.notNull()
			.references(() => giftCard.id, { onDelete: "cascade" }),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		title: text("title"),
		description: text("description"),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_gift_card_translation").on(t.giftCardId, t.localeKey),
		uniqueIndex("uq_gift_card_translation_default")
			.on(t.giftCardId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_gift_card_translation_locale_key").on(t.localeKey),
		index("idx_gift_card_translation_default").on(t.isDefault),
	],
);

/**
 * @table gift_card_usage
 * @auditTrail Tracks user redemptions and value depletion
 */
export const giftCardUsage = table(
	"gift_card_usage",
	{
		id: id.notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		giftCardId: text("gift_card_id")
			.notNull()
			.references(() => giftCard.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		amountUsed: decimal("amount_used", { precision: 10, scale: 2 }).notNull(),
		orderId: text("order_id"),
	},
	(t) => [
		index("idx_gift_card_usage_user").on(t.userId),
		index("idx_gift_card_usage_gift_card").on(t.giftCardId),
		index("idx_gift_card_usage_date").on(t.usedAt),
	],
);

/**
 * @table promotion
 * @marketingStrategy Logical grouping for campaigns
 * @auditTrail Tracks validity and engagement timing
 */
export const promotion = table(
	"promotion",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
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
		uniqueIndex("uq_promotion_slug_org").on(t.organizationId, t.slug),
		index("idx_promotion_organization").on(t.organizationId),
		index("idx_promotion_active").on(t.isActive),
		index("idx_promotion_dates").on(t.startsAt, t.endsAt),
		index("idx_promotion_active_dates").on(t.isActive, t.startsAt, t.endsAt),
	],
);

/**
 * @table promotion_translation
 * @i18nSupport Localized messaging and SEO for promotions
 */
export const promotionTranslation = table(
	"promotion_translation",
	{
		id: id.notNull(),
		promotionId: text("promotion_id")
			.notNull()
			.references(() => promotion.id, { onDelete: "cascade" }),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		title: text("title"),
		description: text("description"),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_promotion_translation").on(t.promotionId, t.localeKey),
		uniqueIndex("uq_promotion_translation_default")
			.on(t.promotionId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_promotion_translation_locale_key").on(t.localeKey),
		index("idx_promotion_translation_default").on(t.isDefault),
	],
);

/**
 * @table promotion_discount
 * @businessLogic Relational link between campaigns and discounts
 * @auditTrail Ensures traceability of discount origin
 */
export const promotionDiscount = table(
	"promotion_discount",
	{
		id: id.notNull(),
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
