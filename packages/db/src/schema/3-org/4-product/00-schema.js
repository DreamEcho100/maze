import { eq, sql } from "drizzle-orm";
import { boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { seoMetadataIdFkCol, seoMetadataIdFkExtraConfig } from "../../0-seo/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";
import { buildOrgI18nTable } from "../0-locale/0_utils/index.js";
import { orgCategory } from "../1-category/schema.js";
import { orgProductVariantPaymentUsageTypeEnum, orgProductVariantTable } from "./_utils/index.js";

export { orgProductVariantPaymentUsageTypeEnum };
// ## org -> product
const orgProductTableName = `${orgTableName}_product`;

// -------------------------------------
// PRODUCT ENUMS
// -------------------------------------

/**
 * Product Types - E-commerce Product Categories
 *
 * @businessLogic Determines product behavior and available features:
 * - physical: Traditional physical goods requiring shipping and inventory management
 * - digital: Digital downloads and software products with instant delivery
 * - course: Educational content with Org Member attribution and creator economy workflows
 * - service: Job services and consultations with booking and delivery workflows
 */
export const productTypeEnum = pgEnum(`${orgProductTableName}_type`, [
	"physical",
	"digital",
	"course",
	"service",
]);

/**
 * Product Status - Content Lifecycle Management
 *
 * @businessLogic Controls product visibility and availability in org catalogs:
 * - draft: Under development, not visible to customers or searchable
 * - active: Published and available for purchase through all channels
 * - archived: Discontinued but existing purchases and subscriptions remain valid
 */
export const productStatusEnum = pgEnum(`${orgProductTableName}_status`, [
	"draft",
	"active",
	"archived",
	"pending_approval", // Pending approval by org admin or who have the permission to approve products
	"rejected", // Rejected by org admin or who have the permission to approve products
	// "pending_review", // Pending review by org admin or who have the permission to review products
]);

// -------------------------------------
// CORE PRODUCT CATALOG
// -------------------------------------

/**
 * Product - Multi-Tenant E-commerce Product Foundation
 *
 * @businessLogic Core product catalog supporting diverse product types within org
 * boundaries. Every product belongs to an org and can have multiple variants for
 * different pricing strategies, access levels, or physical variations. Products serve as
 * the marketing and content foundation while variants handle pricing and commerce transactions.
 *
 * @professionalContext Course products connect to Org Member profiles for creator economy
 * workflows including content attribution, revenue sharing calculations, and cross-org
 * professional collaboration while maintaining clear org boundaries.
 *
 * @orgScope All products are org-scoped ensuring multi-tenant isolation
 * while enabling sophisticated product catalog management per org with brand attribution
 * and professional creator recognition.
 *
 * @architecturalDecision Product-variant separation enables flexible pricing strategies
 * where products define "what" customers purchase (content, features, brand) and variants
 * define "how" customers can purchase it (pricing tiers, access levels, payment strategies).
 *
 * @paymentIntegration Products connect to payment plans through variants, eliminating the need
 * for separate pricing tables while maintaining sophisticated pricing strategies and promotional
 * campaign compatibility.
 */
export const orgProduct = table(
	orgProductTableName,
	{
		id: textCols.idPk().notNull(),

		/**
		 * @orgScope Org that owns and manages this product
		 * @businessRule All product operations must respect to org boundaries
		 * @multiTenant Enables independent product catalog management per org
		 */
		orgId: orgIdFkCol().notNull(),

		/**
		 * @businessRule URL-safe identifier unique within org
		 * @seoOptimization Used for product page URLs and SEO-friendly links
		 * @marketingStrategy Enables memorable and brandable product URLs
		 */
		slug: textCols.slug().notNull(),

		/**
		 * @businessRule Controls product visibility and purchase availability
		 * @workflowControl Enables draft → active → archived lifecycle management
		 * @orgalControl Allows orgs to manage product availability independently
		 */
		status: productStatusEnum("status").default("draft").notNull(),

		/**
		 * @businessRule Determines available features and behavior patterns
		 * @courseContext When type='course', enables Org Member attribution and educational workflows
		 * @paymentContext Different types may have different payment plan capabilities and features
		 */
		type: productTypeEnum("type").default("physical").notNull(),

		// TODO: media connection with resource table for product images, videos, etc
		// thumbnail: varchar("thumbnail", { length: 1024 }),
		// featuredThumbnailId
		// featuredResourceId

		// /**
		//  * @extensibility Type-specific configuration and feature flags
		//  * @courseExample {"certificate_available": true, "downloadable_resources": true}
		//  * @businessFlexibility Enables product-specific features without schema changes
		//  */
		// metadata: jsonb("metadata"),
		hasPendingApproval: boolean("has_pending_approval").default(false),
		// approvalId: textCols.idFk("approval_id").references(() => orgProductApproval.id),
		approvedAt: temporalCols.business.approvedAt("approved_at"),
		rejectedAt: temporalCols.business.rejectedAt("rejected_at"), // Reusing approvedAt for rejected
		// approvedBy: textCols.idFk("approved_by").references(() => orgEmployee.id, {
		// 	onDelete: "set null",

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		...orgIdFkExtraConfig({
			tName: orgProductTableName,
			cols: t,
		}),
		uniqueIndex({
			tName: orgProductTableName,
			cols: [t.orgId, t.slug],
		}),
		...multiIndexes({
			tName: orgProductTableName,
			colsGrps: [
				{ cols: [t.orgId, t.status] },
				{ cols: [t.orgId, t.type] },
				{ cols: [t.status] },
				{ cols: [t.type] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
				{ cols: [t.deletedAt] },
			],
		}),
	],
);

// -------------------------------------
// PRODUCT INTERNATIONALIZATION
// -------------------------------------

/**
 * Product Translation - Multi-language Product Content
 *
 * @businessLogic Enables orgs to localize product content for international
 * markets while maintaining consistent product catalog structure and business logic.
 * Essential for global expansion and region-specific marketing strategies.
 *
 * @marketingLocalization Localized titles and descriptions improve conversion rates
 * in international markets while supporting region-specific SEO optimization and
 * cultural adaptation of product messaging.
 *
 * @orgalStrategy Supports orgs expanding into international markets
 * with localized product presentations while maintaining centralized product management
 * and creator attribution workflows.
 */
export const orgProductI18n = buildOrgI18nTable(orgProductTableName)(
	{
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "cascade" }),
		seoMetadataId: seoMetadataIdFkCol().notNull(),

		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "productId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.productId],
						foreignColumns: [orgProduct.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
		],
	},
);

// -------------------------------------
// PRODUCT VARIANTS (E-COMMERCE FOUNDATION)
// -------------------------------------

/**
 * Product Variant - E-commerce Variation and Commerce Foundation
 *
 * @businessLogic Product variants define purchasable variations of products including
 * different access levels, features, physical attributes, or service tiers. Every
 * product must have at least one variant to be purchasable, following standard
 * e-commerce patterns where variants handle commerce while products handle content.
 *
 * @ecommercePattern Standard e-commerce pattern where variants handle pricing strategies
 * and inventory while products handle content and marketing. Enables sophisticated
 * pricing strategies through multiple variants per product with independent payment plans.
 *
 * @paymentIntegration Variants connect directly to payment plans, eliminating separate
 * pricing tables while enabling sophisticated pricing strategies, promotional campaigns,
 * and multi-currency support through integrated payment plan pricing.
 *
 * @courseContext For course products, variants might represent different access levels
 * (basic, premium, VIP) with different features and Org Member interaction levels while
 * maintaining consistent content attribution to Org Member profiles.
 *
 * @scalabilityPattern Variant-based commerce scales across all product types while
 * maintaining consistent pricing and payment workflows regardless of product complexity
 * or org business model.
 */
export const orgProductVariant = table(
	orgProductVariantTable,
	{
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		/**
		 * @ecommerceIntegration Parent product this variant belongs to
		 * @businessContext Variants provide purchasable variations of core product content
		 * @contentSeparation Product handles content/marketing, variant handles commerce/pricing
		 */
		productId: textCols.idFk("product_id").notNull(),
		// .references(() => orgProduct.id, { onDelete: "cascade" }),

		/**
		 * @businessRule URL-safe identifier unique within product
		 * @ecommerceStandard Standard e-commerce variant identification pattern
		 * @customerExperience Used for variant-specific URLs and customer communication
		 */
		slug: textCols.slug().notNull(),

		/**
		 * @businessRule Controls variant availability for purchase
		 * @commerceControl Enables independent variant lifecycle management
		 * @inventoryManagement For physical products, controls stock availability
		 */
		isActive: sharedCols.isActive(),

		/**
		 * @businessRule Default variant shown first in product selection
		 * @constraint Exactly one default variant per product enforced by unique index
		 * @customerExperience Ensures customers always have a primary purchasing option
		 */
		isDefault: sharedCols.isDefault(),

		/**
		 * @marketingStrategy Highlighted plan in pricing tables (typically "best value")
		 * @conversionOptimization Draws customer attention to preferred monetization tier
		 */
		isFeatured: sharedCols.isFeatured(),

		/**
		 * @displayOrder Controls variant sequence in product selection interfaces
		 * @customerExperience Typically ordered from basic to premium pricing tiers
		 * @marketingStrategy Enables strategic variant presentation for conversion optimization
		 */
		sortOrder: numericCols.sortOrder(),

		/**
		 * @ctiDiscriminator Payment type determines specialized table for type-specific features
		 * @templatePattern Determines downstream plan table extensions
		 */
		type: orgProductVariantPaymentUsageTypeEnum("type").notNull(),

		// /**
		//  * @regionalPricing Optional market for regional pricing strategies
		//  * @businessRule null = global pricing, marketId = region-specific pricing
		//  * @multiRegionSupport Enables localized pricing overrides
		//  */
		// marketId: textCols.idFk("market_id").references(() => orgMarket.id),

		// NOTE: The price for the product variant will be through the 1-m `orgProductVariantPaymentPlan`
		// /**
		//  * @currencySupport Currency for this payment plan instance
		//  * @internationalCommerce Required for all payment plans to support global expansion
		//  */
		// currencyCode: text("currency_code")
		// 	.notNull()
		// 	.references(() => currency.code),

		// /**
		//  * @pricing Main price customers pay for this payment plan
		//  * @revenueFoundation Core pricing amount for revenue calculations and billing
		//  */
		// price: decimal("price", { precision: 10, scale: 2 }).notNull(),

		// /**
		//  * @promotionalPricing Original price for "save X%" marketing displays
		//  * @marketingStrategy Shows discount value to increase conversion rates
		//  */
		// compareAtPrice: decimal("compare_at_price", {
		// 	precision: 10,
		// 	scale: 2,
		// }),

		// IMP: Add an API level category scope validation _(of value `org_tax_category`)_ instead of a DB check constraint
		// Q: Should the `tax_category_id` be here or in the `orgProductVariantPaymentPlan`
		taxCategoryId: textCols.idFk("tax_category_id").notNull(),

		// /**
		//  * @taxation Tax rate for this payment plan region/market
		//  * @legalCompliance Required for proper tax calculation and reporting
		//  */
		// taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),

		// /**
		//  * @pricingZoneOverride Optional pricing zone override for specialized regional pricing
		//  * @businessFlexibility Enables complex regional pricing strategies
		//  */
		// pricingZoneId: textCols.idFk("pricing_zone_id").references(() => orgPricingZone.id),

		/**
		 * @featureControl JSON defining payment plan specific capabilities and limitations
		 * @businessFlexibility Enables sophisticated feature differentiation between payment tiers
		 * @templatePattern Extensible per-plan entitlements
		 * @permissionResolution Drives runtime access decisions
		 */
		features: jsonb("features"),
		/**
		 * @campaignManagement When this pricing becomes effective
		 * @promotionalStrategy Enables scheduled pricing changes and campaigns
		 */
		startsAt: temporalCols.business.startsAt(),

		/**
		 * @campaignManagement When this pricing expires (null = permanent)
		 * @promotionalStrategy Supports time-limited promotional pricing
		 */
		endsAt: temporalCols.business.endsAt(),

		// /**
		//  * @extensibility Variant-specific configuration and feature definitions
		//  * @courseExample {"support_level": "email", "max_downloads": 5, "certificate": true}
		//  * @businessFlexibility Enables variant-specific features without schema changes
		//  */
		// metadata: jsonb("metadata"),
	},
	(t) => [
		...multiForeignKeys({
			tName: orgProductVariantTable,
			fkGroups: [
				{
					cols: [t.productId],
					foreignColumns: [orgProduct.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					// IMP: Add an API level category scope validation _(of value `org_brand_category`)_ instead of a DB check constraint
					cols: [t.taxCategoryId],
					foreignColumns: [orgCategory.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgProductVariantTable,
			cols: [t.productId, t.slug],
		}),
		uniqueIndex({
			tName: orgProductVariantTable,
			cols: [t.productId, t.isDefault],
		}).where(eq(t.isDefault, sql`TRUE`)),
		...multiIndexes({
			tName: orgProductVariantTable,
			colsGrps: [
				{ cols: [t.productId, t.isActive] },
				{ cols: [t.productId, t.type] },
				{ cols: [t.isActive] },
				{ cols: [t.type] },
				{ cols: [t.isDefault] },
				{ cols: [t.isFeatured] },
				{ cols: [t.sortOrder] },
				{ cols: [t.startsAt] },
				{ cols: [t.endsAt] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
				{ cols: [t.deletedAt] },
			],
		}),
	],
);

export const orgProductVariantI18n = buildOrgI18nTable(orgProductVariantTable)(
	{
		variantId: textCols.idFk("variant_id").notNull(),
		// .references(() => orgProductVariant.id, { onDelete: "cascade" }),
		seoMetadataId: seoMetadataIdFkCol().notNull(),

		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "variantId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.variantId],
						foreignColumns: [orgProductVariant.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.title] }],
			}),
		],
	},
);

// -- org -> product

// IMP: The `review` table will be connected to the `product` table, and should it consider the `market` or `org`?
// IMP: The `order` table will be connected to the `product` table, which will handled the different types of product pricing/billing/payment models
// IMP: The `vendorRevenue` table will be connected to the `vendor` connection table that is connected to the `product` table vendors

// ----- org -> product -> by-type -> course

// ---- org -> product -> by-type

// #### org -> product -> collection
