import { decimal, integer, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import {
	currencyCodeExtraConfig,
	currencyCodeFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdExtraConfig,
	orgEmployeeIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgMemberIdExtraConfig,
	orgMemberIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdExtraConfig, orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#db/schema/_utils/helpers.js";
import { numericCols } from "../../../_utils/cols/numeric.js";
import { sharedCols } from "../../../_utils/cols/shared/index.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";
import { orgProductCollection } from "../collection/schema.js";
import { orgMemberOrder } from "../orders/schema.js";
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),

		type: orgDiscountTypeEnum("type").notNull(),
		value: decimal("value", { precision: 10, scale: 2 }).notNull(),

		currencyCode: currencyCodeFkCol(),

		appliesTo: discountAppliesToEnum("applies_to").notNull().default("all"),
		isActive: sharedCols.isActive(),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),

		startsAt: temporalCols.business.startsAt(),
		endsAt: temporalCols.business.endsAt(),
		// metadata: jsonb("metadata"),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgDiscountTableName,
			cols,
		}),
		...currencyCodeExtraConfig({
			tName: orgDiscountTableName,
			cols,
		}),
		...multiIndexes({
			tName: orgDiscountTableName,
			colsGrps: [
				{ cols: [cols.orgId, cols.type] },
				{ cols: [cols.orgId, cols.isActive] },
				{ cols: [cols.orgId, cols.appliesTo] },
				{ cols: [cols.orgId, cols.startsAt, cols.endsAt] },
				{ cols: [cols.orgId, cols.currencyCode] },
			],
		}),
	],
);

/**
 * @table discount_translation
 * @i18nSupport Provides localized display for discounts
 * @seoSupport Optional SEO metadata integration
 */
export const orgDiscountI18n = buildOrgI18nTable(orgDiscountTableName)(
	{
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),
		title: textCols.title().notNull(),
		description: textCols.shortDescription("description"),

		// seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
		// 	onDelete: "set null",
		// }),
	},
	{
		fkKey: "discountId",
		extraConfig: (cols, tName) => [
			// index(`idx_${tName}_title`).on(cols.title)
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.discountId],
						foreignColumns: [orgDiscount.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
		],
	},
);

const orgDiscountProductTableName = `${orgDiscountTableName}_product`;
/**
 * Discount Product - Product-Level Discount Application
 *
 * @businessLogic Links discount campaigns to specific products enabling targeted
 * promotional strategies and marketing campaigns within org boundaries.
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
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "cascade" }),
		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgDiscountProductTableName,
			cols: [cols.discountId, cols.productId],
		}),
		...multiForeignKeys({
			tName: orgDiscountProductTableName,
			fkGroups: [
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgDiscountProductTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
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
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),
		variantId: textCols.idFk("variant_id").notNull(),
		// .references(() => orgProductVariant.id, { onDelete: "cascade" }),
		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgDiscountProductVariantTableName,
			cols: [cols.discountId, cols.variantId],
		}),
		...multiForeignKeys({
			tName: orgDiscountProductVariantTableName,
			fkGroups: [
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.variantId],
					foreignColumns: [orgProductVariant.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgDiscountProductVariantTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
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
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),

		/**
		 * @collectionLink Target collection receiving the discount
		 */
		collectionId: textCols.idFk("collection_id").notNull(),
		// .references(() => orgProductCollection.id, { onDelete: "cascade" }),
		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgDiscountCollectionTableName,
			cols: [cols.discountId, cols.collectionId],
		}),
		...multiForeignKeys({
			tName: orgDiscountCollectionTableName,
			fkGroups: [
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.collectionId],
					foreignColumns: [orgProductCollection.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgDiscountCollectionTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
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
		id: textCols.idPk().notNull(),
		memberId: orgMemberIdFkCol().notNull(),
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		orderId: textCols.idFk("order_id"), // .references(() => orgMemberOrder.id),
		amountDiscounted: decimal("amount_discounted", { precision: 10, scale: 2 }),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...orgMemberIdExtraConfig({
			tName: orgDiscountUsageTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgDiscountUsageTableName,
			fkGroups: [
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.orderId],
					foreignColumns: [orgMemberOrder.id],
					afterBuild: (fk) => fk.onDelete("set null"),
				},
			],
		}),
		...multiIndexes({
			tName: orgDiscountUsageTableName,
			colsGrps: [
				{ cols: [cols.memberId, cols.discountId] },
				{ cols: [cols.usedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),

		code: textCols.code().notNull(),
		usageLimit: integer("usage_limit"),
		usedCount: integer("used_count").default(0),
		isActive: sharedCols.isActive(),
		startsAt: temporalCols.business.startsAt(),
		endsAt: temporalCols.business.endsAt(),
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgCouponTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgCouponTableName,
			fkGroups: [
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgCouponTableName,
			cols: [cols.orgId, cols.code],
		}),
		...multiIndexes({
			tName: orgCouponTableName,
			colsGrps: [
				{ cols: [cols.isActive] },
				{ cols: [cols.startsAt, cols.endsAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

/**
 * @table coupon_translation
 * @i18nSupport Localized titles and descriptions for coupons
 */
export const orgCouponI18n = buildOrgI18nTable(orgCouponTableName)(
	{
		couponId: textCols.idFk("coupon_id").notNull(),
		// .references(() => orgCoupon.id, { onDelete: "cascade" }),
		title: textCols.title().notNull(),
		description: textCols.shortDescription("description"),

		// seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
		// 	onDelete: "set null",
		// }),
	},
	{
		fkKey: "couponId",
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.couponId],
						foreignColumns: [orgCoupon.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		code: textCols.code().notNull(),
		initialBalance: numericCols.currency.balance().notNull(),
		remainingBalance: numericCols.currency.balance().notNull(),
		currencyCode: currencyCodeFkCol().notNull(),
		// Q: What's the use and the meaning of the issue logic here? is it correct? is this where it should be? something feels off...
		// Who created/issued the gift card
		issuedByEmployeeId: orgEmployeeIdFkCol({ name: "issued_by_employee_id" }).notNull(),
		// Who receives it
		issuedToMemberId: orgMemberIdFkCol({ name: "issued_to_member_id" }),
		issuedToEmail: text("issued_to_email"),
		issuedAt: timestamp("issued_at").defaultNow().notNull(),
		expiresAt: temporalCols.business.expiresAt(),
		isActive: sharedCols.isActive(),
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgGiftCardTableName,
			cols,
		}),
		...currencyCodeExtraConfig({
			tName: orgGiftCardTableName,
			cols,
		}),
		...orgEmployeeIdExtraConfig({
			tName: orgGiftCardTableName,
			cols,
			colFkKey: "issuedByEmployeeId",
		}),
		...orgMemberIdExtraConfig({
			tName: orgGiftCardTableName,
			cols,
			colFkKey: "issuedToMemberId",
		}),
		uniqueIndex({
			tName: orgGiftCardTableName,
			cols: [cols.orgId, cols.code],
		}),
		...multiIndexes({
			tName: orgGiftCardTableName,
			colsGrps: [
				{ cols: [cols.issuedToEmail] },
				{ cols: [cols.isActive] },
				{ cols: [cols.expiresAt] },
				{ cols: [cols.remainingBalance] },
				{ cols: [cols.issuedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

/**
 * @table gift_card_translation
 * @i18nSupport Localization support for gift cards
 * @seoSupport Enables optional SEO visibility for promotional cards
 */
export const orgGiftCardI18n = buildOrgI18nTable(orgGiftCardTableName)(
	{
		giftCardId: textCols.idFk("gift_card_id").notNull(),
		// .references(() => orgGiftCard.id, { onDelete: "cascade" }),
		title: textCols.title().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "giftCardId",
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.giftCardId],
						foreignColumns: [orgGiftCard.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
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
		id: textCols.idPk().notNull(),
		memberId: orgMemberIdFkCol().notNull(),
		giftCardId: textCols.idFk("gift_card_id").notNull(),
		// .references(() => orgGiftCard.id),
		usedAt: timestamp("used_at").defaultNow().notNull(),
		amountUsed: decimal("amount_used", { precision: 10, scale: 2 }).notNull(),
		orderId: textCols.idFk("order_id"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...orgMemberIdExtraConfig({
			tName: orgMemberGiftCardUsageTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgMemberGiftCardUsageTableName,
			fkGroups: [
				{
					cols: [cols.giftCardId],
					foreignColumns: [orgGiftCard.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.orderId],
					foreignColumns: [orgMemberOrder.id],
					afterBuild: (fk) => fk.onDelete("set null"),
				},
			],
		}),
		...multiIndexes({
			tName: orgMemberGiftCardUsageTableName,
			colsGrps: [
				{ cols: [cols.usedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.memberId, cols.giftCardId] },
			],
		}),
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		slug: text("slug").notNull(),
		bannerImage: text("banner_image"),
		startsAt: temporalCols.business.startsAt(),
		endsAt: temporalCols.business.endsAt(),
		isActive: sharedCols.isActive(),
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgPromotionTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgPromotionTableName,
			cols: [cols.orgId, cols.slug],
		}),
		...multiIndexes({
			tName: orgPromotionTableName,
			colsGrps: [
				{ cols: [cols.isActive] },
				{ cols: [cols.startsAt, cols.endsAt] },
				{ cols: [cols.isActive, cols.startsAt, cols.endsAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

/**
 * @table promotion_translation
 * @i18nSupport Localized messaging and SEO for promotions
 */
export const orgPromotionI18n = buildOrgI18nTable(orgPromotionTableName)(
	{
		promotionId: textCols.idFk("promotion_id").notNull(),
		// .references(() => orgPromotion.id, { onDelete: "cascade" }),
		title: textCols.title().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "promotionId",
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.promotionId],
						foreignColumns: [orgPromotion.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
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
		promotionId: textCols.idFk("promotion_id").notNull(),
		// .references(() => orgPromotion.id, { onDelete: "cascade" }),
		discountId: textCols.idFk("discount_id").notNull(),
		// .references(() => orgDiscount.id, { onDelete: "cascade" }),
		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgPromotionDiscountTableName,
			cols: [cols.promotionId, cols.discountId],
		}),
		...multiForeignKeys({
			tName: orgPromotionDiscountTableName,
			fkGroups: [
				{
					cols: [cols.promotionId],
					foreignColumns: [orgPromotion.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.discountId],
					foreignColumns: [orgDiscount.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgPromotionDiscountTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
	],
);
