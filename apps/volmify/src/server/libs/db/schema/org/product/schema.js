/**
 * @fileoverview Product Schema - Multi-Tenant E-commerce Product Catalog with Creator Attribution
 *
 * @architecture Multi-Tenant Product Catalog + Professional Attribution + Payment Plan Integration
 * E-commerce product system supporting multiple product types (physical, digital, course, service)
 * with org boundaries, professional content attribution, and integrated payment strategies.
 * Designed for creator economy where Org Members create educational content within org contexts
 * while maintaining clear revenue attribution and brand identity integration.
 *
 * @designPattern CTI + Professional Attribution + Brand Attribution + Variant-Based Commerce + Payment Integration
 * - CTI Pattern: Course-specific tables extend base product for educational content specialization
 * - Professional Attribution: Org Member-product attribution for creator economy revenue sharing workflows
 * - Brand Attribution: Org brand identity integration for consistent marketing strategies
 * - Variant-Based Commerce: Product variations (access levels, features) with independent pricing strategies
 * - Payment Integration: Direct integration with payment plans eliminating separate pricing table redundancy
 *
 * @integrationPoints
 * - Professional Attribution: Org Member revenue sharing and content creation workflows
 * - Brand Integration: Org brand identity and marketing attribution systems
 * - Payment Integration: Product variants connect directly to sophisticated payment plan strategies
 * - Course System: Educational content creation and delivery for Org Member economy
 * - Promotional Integration: Discount campaigns and promotional strategies for revenue optimization
 *
 * @businessValue
 * Enables orgs to create and monetize diverse product catalogs while maintaining
 * clear attribution to professional creators and brand identity. Supports sophisticated
 * e-commerce scenarios from simple physical products to complex educational content with
 * comprehensive creator economy revenue sharing and promotional campaign management.
 *
 * @scalingDesign
 * CTI pattern enables adding new product types without affecting existing commerce workflows.
 * Professional attribution system scales to support multiple creator types and revenue models.
 * Payment plan integration eliminates pricing table redundancy while maintaining sophisticated
 * pricing strategies and promotional campaign compatibility.
 */

import { eq } from "drizzle-orm";
import { index, jsonb, pgEnum, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

import { numericCols, sharedCols, table, temporalCols, textCols } from "../../_utils/helpers.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
import { orgBrand } from "../schema.js";
import { orgTaxCategory } from "../tax/schema.js";
import { orgProductVariantPaymentTypeEnum } from "./payment/schema.js";

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
 * - service: Professional services and consultations with booking and delivery workflows
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
		id: textCols.id().notNull(),

		/**
		 * @orgScope Org that owns and manages this product
		 * @businessRule All product operations must respect to org boundaries
		 * @multiTenant Enables independent product catalog management per org
		 */
		orgId: sharedCols.orgIdFk().notNull(),

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

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		// Business Constraints
		uniqueIndex(`uq_${orgProductTableName}_slug_org`).on(t.orgId, t.slug),

		// Performance Indexes
		index(`idx_${orgProductTableName}_org_id`).on(t.orgId),
		index(`idx_${orgProductTableName}_status`).on(t.status),
		index(`idx_${orgProductTableName}_type`).on(t.type),
		index(`idx_${orgProductTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${orgProductTableName}_deleted_at`).on(t.deletedAt),

		// Composite Indexes for Common Queries
		index(`idx_${orgProductTableName}_status_type`).on(t.status, t.type),
		index(`idx_${orgProductTableName}_org_status`).on(t.orgId, t.status),
		index(`idx_${orgProductTableName}_org_type`).on(t.orgId, t.type),
	],
);

// -------------------------------------
// PRODUCT INTERNATIONALIZATION
// -------------------------------------

const orgProductI18nTableName = `${orgProductTableName}_i18n`;
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
export const orgProductI18n = buildOrgI18nTable(orgProductI18nTableName)(
	{
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "cascade" }),
		seoMetadataId: sharedCols.seoMetadataIdFk().notNull(),

		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "productId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_title`).on(t.title),
			index(`idx_${tableName}_product_id`).on(t.productId),
		],
	},
);

// -------------------------------------
// PRODUCT VARIANTS (E-COMMERCE FOUNDATION)
// -------------------------------------

const orgProductVariantTable = `${orgProductTableName}_variant`;
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
		id: textCols.id().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		/**
		 * @ecommerceIntegration Parent product this variant belongs to
		 * @businessContext Variants provide purchasable variations of core product content
		 * @contentSeparation Product handles content/marketing, variant handles commerce/pricing
		 */
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "cascade" }),

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
		type: orgProductVariantPaymentTypeEnum("type").notNull(),

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

		// Q: Should the `tax_category_id` be here or in the `orgProductVariantPaymentPlan`
		taxCategoryId: textCols
			.idFk("tax_category_id")
			.references(() => orgTaxCategory.id)
			.notNull(),

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
		// Business Constraints
		uniqueIndex(`uq_${orgProductVariantTable}_slug`).on(t.productId, t.slug),
		uniqueIndex(`uq_${orgProductVariantTable}_default`)
			.on(t.productId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index(`idx_${orgProductVariantTable}_product_id`).on(t.productId),
		index(`idx_${orgProductVariantTable}_active`).on(t.isActive),
		index(`idx_${orgProductVariantTable}_sort`).on(t.sortOrder),
		index(`idx_${orgProductVariantTable}_default`).on(t.isDefault),
		index(`idx_${orgProductVariantTable}_featured`).on(t.isFeatured),
		index(`idx_${orgProductVariantTable}_type`).on(t.type),
		// index(`idx_${orgProductVariantTable}_currency_code`).on(t.currencyCode),
		index(`idx_${orgProductVariantTable}_starts_at`).on(t.startsAt),
		index(`idx_${orgProductVariantTable}_ends_at`).on(t.endsAt),
		index(`idx_${orgProductVariantTable}_created_at`).on(t.createdAt),
		index(`idx_${orgProductVariantTable}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${orgProductVariantTable}_deleted_at`).on(t.deletedAt),
		index(`idx_${orgProductVariantTable}_tax_category_id`).on(t.taxCategoryId),
	],
);

const orgProductVariantI18nTableName = `${orgProductVariantTable}_i18n`;
export const orgProductVariantI18n = buildOrgI18nTable(orgProductVariantI18nTableName)(
	{
		variantId: textCols
			.idFk("variant_id")
			.notNull()
			.references(() => orgProductVariant.id, { onDelete: "cascade" }),
		seoMetadataId: sharedCols.seoMetadataIdFk().notNull(),

		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "variantId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_title`).on(t.title),
			index(`idx_${tableName}_variant_id`).on(t.variantId),
		],
	},
);

const orgProductBrandTableName = `${orgProductTableName}_brand_attribution`;
/**
 * Product Brand Attribution - Org Brand Identity Integration
 *
 * @businessLogic Links products to org brand identity for consistent marketing
 * and brand presentation across product catalogs. Supports orgs with multiple
 * brands or white-label scenarios where products need clear brand attribution for
 * customer recognition and marketing consistency.
 *
 * @brandStrategy Enables orgs to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing campaigns, customer communication,
 * and brand identity consistency across diverse product catalogs.
 *
 * @orgScope Brand attribution operates within org boundaries enabling
 * sophisticated brand management strategies while maintaining multi-tenant isolation and
 * org control over brand identity and product presentation.
 *
 * @marketingIntegration Brand attribution integrates with product marketing, promotional
 * campaigns, and customer communication to ensure consistent brand presentation and
 * customer experience across all product touchpoints and marketing channels.
 */
export const orgProductBrandAttribution = table(
	orgProductBrandTableName,
	{
		/**
		 * @brandIdentity Org brand this product is attributed to
		 * @businessRule Links product presentation to specific org brand identity
		 * @marketingStrategy Enables consistent brand presentation across product catalog
		 */
		brandId: textCols
			.idFk("brand_id")
			.notNull()
			.references(() => orgBrand.id),

		/**
		 * @productAttribution Product this brand attribution applies to
		 * @businessRule Links brand identity to specific product for marketing consistency
		 * @customerExperience Ensures consistent brand presentation in product discovery
		 */
		productId: textCols
			.idFk("product_id")
			.notNull()
			.references(() => orgProduct.id, { onDelete: "cascade" }),

		// /**
		//  * @brandHierarchy Primary brand attribution for main brand presentation
		//  * @businessRule One primary brand per product for clear customer brand recognition
		//  * @marketingStrategy Primary brand used in product marketing and customer communication
		//  */
		// isPrimary: boolean("is_primary").default(true),

		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		// Business Constraints
		primaryKey({ columns: [t.brandId, t.productId] }),
		// uniqueIndex("uq_product_brand_primary")
		// 	.on(t.productId, t.isPrimary)
		// 	.where(eq(t.isPrimary, true)),

		// Performance Indexes
		index(`idx_${orgProductBrandTableName}_created_at`).on(t.createdAt),
	],
);
