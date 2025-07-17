import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { createdAt, deletedAt, fk, id, table, updatedAt } from "../../../_utils/helpers.js";
import { currency } from "../../../system/locale-currency-market/schema.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";
import { orgMember } from "../../member/schema.js";
import { org } from "../../schema.js";
import { orgProductCollection } from "../collection/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";

const orgDiscountTableName = `${orgTableName}_discount`;
/**
 * @enumModel DiscountType
 * @businessLogic Distinguishes discount computation logic
 * @auditTrail Determines financial impact calculation method
 */
export const orgDiscountTypeEnum = pgEnum(`${orgDiscountTableName}_type`, [
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
export const discountAppliesToEnum = pgEnum(`${orgDiscountTableName}_applies_to`, [
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
export const orgDiscount = table(
	orgDiscountTableName,
	{
		id: id.notNull(),
		orgId: fk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		type: orgDiscountTypeEnum("type").notNull(),
		value: decimal("value", { precision: 10, scale: 2 }).notNull(),

		currencyCode: text("currency_code").references(() => currency.code),

		appliesTo: discountAppliesToEnum("applies_to").notNull().default("all"),
		isActive: boolean("is_active").default(true),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),

		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		// metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgDiscountTableName}_org_id`).on(t.orgId),
		index(`idx_${orgDiscountTableName}_type`).on(t.type),
		index(`idx_${orgDiscountTableName}_active`).on(t.isActive),
		index(`idx_${orgDiscountTableName}_applies_to`).on(t.appliesTo),
		index(`idx_${orgDiscountTableName}_dates`).on(t.startsAt, t.endsAt),
		index(`idx_${orgDiscountTableName}_active_dates`).on(t.isActive, t.startsAt, t.endsAt),
		index(`idx_${orgDiscountTableName}_currency_code`).on(t.currencyCode),
	],
);

const orgDiscountI18nTableName = `${orgDiscountTableName}_i18n`;
/**
 * @table discount_translation
 * @i18nSupport Provides localized display for discounts
 * @seoSupport Optional SEO metadata integration
 */
export const orgDiscountI18n = buildOrgI18nTable(orgDiscountI18nTableName)(
	{
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),
		title: text("title"),
		description: text("description"),

		// seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
		// 	onDelete: "set null",
		// }),
	},
	{
		fkKey: "discountId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_discount_id`).on(t.discountId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

const orgDiscountProductTableName = `${orgDiscountTableName}_product`;
/**
 * Discount Product - Product-Level Discount Application
 *
 * @businessLogic Links discount campaigns to specific products enabling targeted
 * promotional strategies and marketing campaigns within orgal boundaries.
 * Supports product-specific promotional campaigns for revenue optimization and
 * customer acquisition strategies.
 *
 * @promotionalStrategy Enables orgs to create product-specific promotional
 * campaigns while maintaining compatibility with payment plan pricing and variant-based
 * commerce workflows for comprehensive promotional campaign management.
 */
export const orgDiscountProduct = table(
	orgDiscountProductTableName,
	{
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),
		productId: fk("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.discountId, t.productId] }),
		index(`idx_${orgDiscountProductTableName}_createdAt`).on(t.createdAt),
	],
);

const orgDiscountProductVariantTableName = `${orgDiscountTableName}_product_variant`;
/**
 * Discount Variant - Variant-Level Discount Application
 *
 * @businessLogic Links discount campaigns to specific product variants enabling
 * granular promotional strategies for different pricing tiers and access levels.
 * Supports variant-specific promotional campaigns that integrate with payment plan
 * pricing for sophisticated promotional strategy implementation.
 *
 * @promotionalStrategy Enables targeted promotional campaigns at the variant level
 * for precise revenue optimization and customer conversion strategies while maintaining
 * compatibility with payment plan pricing and promotional campaign workflows.
 */
export const orgDiscountProductVariant = table(
	orgDiscountProductVariantTableName,
	{
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),
		variantId: fk("variant_id")
			.notNull()
			.references(() => orgProductVariant.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.discountId, t.variantId] }),
		index(`idx_${orgDiscountProductVariantTableName}_createdAt`).on(t.createdAt),
	],
);

const orgDiscountCollectionTableName = `${orgDiscountTableName}_product_collection`;
/**
 * @junctionTable Discount–Collection Mapping
 * @businessLogic Enables applying discount logic to entire collections
 * rather than individual products for easier promotion management.
 *
 * @permissionContext Bound to discount and collection org scopes
 * @onboardingPattern Makes it easier to bulk-apply promotions by marketing teams
 */
export const orgDiscountProductCollection = table(
	orgDiscountCollectionTableName,
	{
		/**
		 * @discountLink Discount campaign being applied
		 */
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),

		/**
		 * @collectionLink Target collection receiving the discount
		 */
		collectionId: fk("collection_id")
			.notNull()
			.references(() => orgProductCollection.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.discountId, t.collectionId] }),
		index(`idx_${orgDiscountCollectionTableName}_createdAt`).on(t.createdAt),
	],
);

const orgDiscountUsageTableName = `${orgTableName}_member_discount_usage`;
/**
 * @table discount_usage
 * @auditTrail Tracks who used a discount and when
 * @businessLogic Enables enforcing usage limits and personalization
 */
export const orgMemberOrderDiscountUsage = table(
	orgDiscountUsageTableName,
	{
		id: id.notNull(),
		memberId: fk("member_id")
			.notNull()
			.references(() => orgMember.id),
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		orderId: fk("order_id").references(() => orgMemberOrder.id),
		amountDiscounted: decimal("amount_discounted", { precision: 10, scale: 2 }),
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgDiscountUsageTableName}_member_discount`).on(t.memberId, t.discountId),
		index(`idx_${orgDiscountUsageTableName}_used_at`).on(t.usedAt),
		index(`idx_${orgDiscountUsageTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgDiscountUsageTableName}_updated_at`).on(t.updatedAt),
	],
);

const orgCouponTableName = `${orgTableName}_coupon`;

/**
 * @table coupon
 * @compensationModel Code-based wrapper for discount logic
 * @permissionContext Can be scoped and assigned per user or campaign
 */
export const orgCoupon = table(
	orgCouponTableName,
	{
		id: id.notNull(),
		orgId: fk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),

		code: text("code").notNull(),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),
		isActive: boolean("is_active").default(true),
		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		uniqueIndex(`uq_${orgCouponTableName}_code_org`).on(t.orgId, t.code),
		index(`idx_${orgCouponTableName}_org_id`).on(t.orgId),
		index(`idx_${orgCouponTableName}_discount_id`).on(t.discountId),
		index(`idx_${orgCouponTableName}_active`).on(t.isActive),
		index(`idx_${orgCouponTableName}_dates`).on(t.startsAt, t.endsAt),
		index(`idx_${orgCouponTableName}_active_dates`).on(t.isActive, t.startsAt, t.endsAt),
		index(`idx_${orgCouponTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgCouponTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgCouponTableName}_deleted_at`).on(t.deletedAt),
	],
);

const orgCouponI18nTableName = `${orgCouponTableName}_i18n`;
/**
 * @table coupon_translation
 * @i18nSupport Localized titles and descriptions for coupons
 */
export const orgCouponI18n = buildOrgI18nTable(orgCouponI18nTableName)(
	{
		couponId: fk("coupon_id")
			.notNull()
			.references(() => orgCoupon.id, { onDelete: "cascade" }),
		title: text("title"),
		description: text("description"),

		// seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
		// 	onDelete: "set null",
		// }),
	},
	{
		fkKey: "couponId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_coupon_id`).on(t.couponId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

const orgGiftCardTableName = `${orgTableName}_gift_card`;

/**
 * @table gift_card
 * @compensationModel Prepaid value cards used as alternative payment method
 * @auditTrail Tracks balance and issuance info for reconciliation
 */
export const orgGiftCard = table(
	orgGiftCardTableName,
	{
		id: id.notNull(),
		orgId: fk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		code: text("code").notNull(),
		initialBalance: decimal("initial_balance", {
			precision: 10,
			scale: 2,
		}).notNull(),
		remainingBalance: decimal("remaining_balance", {
			precision: 10,
			scale: 2,
		}).notNull(),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		// Q: What's the use and the meaning of the issue logic here? is it correct? is this where it should be? something feels off...
		issuedToMemberId: fk("issued_to_member_id").references(() => orgMember.id),
		issuedToEmail: text("issued_to_email"),
		issuedAt: timestamp("issued_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
		isActive: boolean("is_active").default(true),
		// metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		uniqueIndex(`uq_${orgGiftCardTableName}_code_org`).on(t.orgId, t.code),
		index(`idx_${orgGiftCardTableName}_org`).on(t.orgId),
		index(`idx_${orgGiftCardTableName}_currency`).on(t.currencyCode),
		index(`idx_${orgGiftCardTableName}_member_id`).on(t.issuedToMemberId),
		index(`idx_${orgGiftCardTableName}_email`).on(t.issuedToEmail),
		index(`idx_${orgGiftCardTableName}_active`).on(t.isActive),
		index(`idx_${orgGiftCardTableName}_expires`).on(t.expiresAt),
		index(`idx_${orgGiftCardTableName}_balance`).on(t.remainingBalance),
		index(`idx_${orgGiftCardTableName}_issued_at`).on(t.issuedAt),
		index(`idx_${orgGiftCardTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgGiftCardTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgGiftCardTableName}_deleted_at`).on(t.deletedAt),
	],
);

const orgGiftCardI18nTableName = `${orgGiftCardTableName}_i18n`;
/**
 * @table gift_card_translation
 * @i18nSupport Localization support for gift cards
 * @seoSupport Enables optional SEO visibility for promotional cards
 */
export const orgGiftCardI18n = buildOrgI18nTable(orgGiftCardI18nTableName)(
	{
		giftCardId: fk("gift_card_id")
			.notNull()
			.references(() => orgGiftCard.id, { onDelete: "cascade" }),
		title: text("title"),
		description: text("description"),
	},
	{
		fkKey: "giftCardId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_gift_card_id`).on(t.giftCardId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

const orgMemberGiftCardUsageTableName = `${orgTableName}_member_gift_card_usage`;
/**
 * @table gift_card_usage
 * @auditTrail Tracks user redemptions and value depletion
 */
export const orgMemberGiftCardUsage = table(
	orgMemberGiftCardUsageTableName,
	{
		id: id.notNull(),
		memberId: fk("member_id")
			.notNull()
			.references(() => orgMember.id),
		giftCardId: fk("gift_card_id")
			.notNull()
			.references(() => orgGiftCard.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		amountUsed: decimal("amount_used", { precision: 10, scale: 2 }).notNull(),
		orderId: fk("order_id"),
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgMemberGiftCardUsageTableName}_member_id`).on(t.memberId),
		index(`idx_${orgMemberGiftCardUsageTableName}_gift_card_id`).on(t.giftCardId),
		index(`idx_${orgMemberGiftCardUsageTableName}_used_at`).on(t.usedAt),
		index(`idx_${orgMemberGiftCardUsageTableName}_used_at`).on(t.usedAt),
		index(`idx_${orgMemberGiftCardUsageTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgMemberGiftCardUsageTableName}_updated_at`).on(t.updatedAt),
	],
);

const orgPromotionTableName = `${orgTableName}_promotion`;
/**
 * @table promotion
 * @marketingStrategy Logical grouping for campaigns
 * @auditTrail Tracks validity and engagement timing
 */
export const orgPromotion = table(
	orgPromotionTableName,
	{
		id: id.notNull(),
		orgId: fk(`${orgTableName}_id`)
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
		deletedAt,
	},
	(t) => [
		uniqueIndex(`uq_p${orgPromotionTableName}_slug_org`).on(t.orgId, t.slug),
		index(`idx_${orgPromotionTableName}n_org`).on(t.orgId),
		index(`idx_${orgPromotionTableName}n_active`).on(t.isActive),
		index(`idx_${orgPromotionTableName}n_dates`).on(t.startsAt, t.endsAt),
		index(`idx_${orgPromotionTableName}n_active_dates`).on(t.isActive, t.startsAt, t.endsAt),
		index(`idx_${orgPromotionTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgPromotionTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgPromotionTableName}_deleted_at`).on(t.deletedAt),
	],
);

const orgPromotionI18nTableName = `${orgPromotionTableName}_i18n`;
/**
 * @table promotion_translation
 * @i18nSupport Localized messaging and SEO for promotions
 */
export const orgPromotionI18n = buildOrgI18nTable(orgPromotionI18nTableName)(
	{
		promotionId: fk("promotion_id")
			.notNull()
			.references(() => orgPromotion.id, { onDelete: "cascade" }),
		title: text("title"),
		description: text("description"),
	},
	{
		fkKey: "promotionId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_promotion_id`).on(t.promotionId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

const orgPromotionDiscountTableName = `${orgPromotionTableName}_discount`;
/**
 * @table promotion_discount
 * @businessLogic Relational link between campaigns and discounts
 * @auditTrail Ensures traceability of discount origin
 */
export const orgPromotionDiscount = table(
	orgPromotionDiscountTableName,
	{
		promotionId: fk("promotion_id")
			.notNull()
			.references(() => orgPromotion.id, { onDelete: "cascade" }),
		discountId: fk("discount_id")
			.notNull()
			.references(() => orgDiscount.id, { onDelete: "cascade" }),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.promotionId, t.discountId] }),
		index(`idx_${orgPromotionDiscountTableName}_createdAt`).on(t.createdAt),
	],
);
