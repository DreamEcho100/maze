/**
 * @fileoverview Product Schema - Multi-Tenant E-commerce Product Catalog with Creator Attribution
 *
 * @architecture Multi-Tenant Product Catalog + Professional Attribution + Payment Plan Integration
 * E-commerce product system supporting multiple product types (physical, digital, course, service)
 * with organizational boundaries, professional content attribution, and integrated payment strategies.
 * Designed for creator economy where instructors create educational content within organizational contexts
 * while maintaining clear revenue attribution and brand identity integration.
 *
 * @designPattern CTI + Professional Attribution + Brand Attribution + Variant-Based Commerce + Payment Integration
 * - CTI Pattern: Course-specific tables extend base product for educational content specialization
 * - Professional Attribution: Instructor-product attribution for creator economy revenue sharing workflows
 * - Brand Attribution: Organizational brand identity integration for consistent marketing strategies
 * - Variant-Based Commerce: Product variations (access levels, features) with independent pricing strategies
 * - Payment Integration: Direct integration with payment plans eliminating separate pricing table redundancy
 *
 * @integrationPoints
 * - Professional Attribution: Instructor revenue sharing and content creation workflows
 * - Brand Integration: Organizational brand identity and marketing attribution systems
 * - Payment Integration: Product variants connect directly to sophisticated payment plan strategies
 * - Course System: Educational content creation and delivery for instructor economy
 * - Promotional Integration: Discount campaigns and promotional strategies for revenue optimization
 *
 * @businessValue
 * Enables organizations to create and monetize diverse product catalogs while maintaining
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
	varchar,
} from "drizzle-orm/pg-core";

import {
	createdAt,
	deletedAt,
	getLocaleKey,
	id,
	slug,
	table,
	updatedAt,
} from "../_utils/helpers.js";
import { org, orgBrand } from "../org/schema.js";
import { currency, locale } from "../system/locale-currency-market/schema.js";
import { seoMetadata } from "../system/seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { discount } from "./offers/schema.js";
import { paymentPlanTypeEnum } from "./payment/schema.js";

// -------------------------------------
// PRODUCT ENUMS
// -------------------------------------

/**
 * Product Types - E-commerce Product Categories
 *
 * @businessLogic Determines product behavior and available features:
 * - physical: Traditional physical goods requiring shipping and inventory management
 * - digital: Digital downloads and software products with instant delivery
 * - course: Educational content with instructor attribution and creator economy workflows
 * - service: Professional services and consultations with booking and delivery workflows
 */
export const productTypeEnum = pgEnum("product_type", ["physical", "digital", "course", "service"]);

/**
 * Product Status - Content Lifecycle Management
 *
 * @businessLogic Controls product visibility and availability in organizational catalogs:
 * - draft: Under development, not visible to customers or searchable
 * - active: Published and available for purchase through all channels
 * - archived: Discontinued but existing purchases and subscriptions remain valid
 */
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

// -------------------------------------
// CORE PRODUCT CATALOG
// -------------------------------------

/**
 * Product - Multi-Tenant E-commerce Product Foundation
 *
 * @businessLogic Core product catalog supporting diverse product types within organizational
 * boundaries. Every product belongs to an org and can have multiple variants for
 * different pricing strategies, access levels, or physical variations. Products serve as
 * the marketing and content foundation while variants handle pricing and commerce transactions.
 *
 * @professionalContext Course products connect to instructor profiles for creator economy
 * workflows including content attribution, revenue sharing calculations, and cross-organizational
 * professional collaboration while maintaining clear organizational boundaries.
 *
 * @organizationScope All products are org-scoped ensuring multi-tenant isolation
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
export const product = table(
	"product",
	{
		id: id.notNull(),

		/**
		 * @organizationScope Org that owns and manages this product
		 * @businessRule All product operations must respect organizational boundaries
		 * @multiTenant Enables independent product catalog management per org
		 */
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id),

		/**
		 * @businessRule URL-safe identifier unique within org
		 * @seoOptimization Used for product page URLs and SEO-friendly links
		 * @marketingStrategy Enables memorable and brandable product URLs
		 */
		slug: slug.notNull(),

		title: varchar("title", { length: 256 }).notNull(),
		description: text("description"),

		/**
		 * @businessRule Controls product visibility and purchase availability
		 * @workflowControl Enables draft → active → archived lifecycle management
		 * @organizationalControl Allows organizations to manage product availability independently
		 */
		status: productStatusEnum("status").default("draft").notNull(),

		/**
		 * @businessRule Determines available features and behavior patterns
		 * @courseContext When type='course', enables instructor attribution and educational workflows
		 * @paymentContext Different types may have different payment plan capabilities and features
		 */
		type: productTypeEnum("type").default("physical").notNull(),

		thumbnail: varchar("thumbnail", { length: 1024 }),

		/**
		 * @extensibility Type-specific configuration and feature flags
		 * @courseExample {"certificate_available": true, "downloadable_resources": true}
		 * @businessFlexibility Enables product-specific features without schema changes
		 */
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		// Business Constraints
		uniqueIndex("uq_product_slug_org").on(t.organizationId, t.slug),

		// Performance Indexes
		index("idx_product_organization").on(t.organizationId),
		index("idx_product_status").on(t.status),
		index("idx_product_type").on(t.type),
		index("idx_product_deleted_at").on(t.deletedAt),
		index("idx_product_created_at").on(t.createdAt),

		// Composite Indexes for Common Queries
		index("idx_product_status_type").on(t.status, t.type),
		index("idx_product_org_status").on(t.organizationId, t.status),
		index("idx_product_org_type").on(t.organizationId, t.type),
	],
);

// -------------------------------------
// PRODUCT INTERNATIONALIZATION
// -------------------------------------

/**
 * Product Translation - Multi-language Product Content
 *
 * @businessLogic Enables organizations to localize product content for international
 * markets while maintaining consistent product catalog structure and business logic.
 * Essential for global expansion and region-specific marketing strategies.
 *
 * @marketingLocalization Localized titles and descriptions improve conversion rates
 * in international markets while supporting region-specific SEO optimization and
 * cultural adaptation of product messaging.
 *
 * @organizationalStrategy Supports organizations expanding into international markets
 * with localized product presentations while maintaining centralized product management
 * and creator attribution workflows.
 */
export const productTranslation = table(
	"product_translation",
	{
		id: id.notNull(),

		/**
		 * @translationTarget Product this localized content applies to
		 * @cascadeDelete Translation content removed when product is deleted
		 * @businessRule Maintains translation data integrity with product lifecycle
		 */
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),

		/**
		 * @localizationContext Target locale for this translation content
		 * @businessRule Supports region-specific product marketing strategies
		 * @internationalExpansion Enables market-specific product messaging and SEO
		 */
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),

		/**
		 * @translationDefault Primary translation used when locale-specific content unavailable
		 * @constraint Exactly one default translation per product enforced by unique index
		 * @fallbackStrategy Ensures product content always available regardless of locale
		 */
		isDefault: boolean("is_default").default(false),

		// Localized Content
		title: text("title"),
		description: text("description"),

		/**
		 * @seoOptimization Optional SEO metadata for product landing pages
		 * @marketingStrategy Enables search optimization for localized product content
		 * @organicGrowth Improves product discoverability in international search engines
		 */
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Translation Constraints
		uniqueIndex("uq_product_translation_product_locale_key").on(t.productId, t.localeKey),
		uniqueIndex("uq_product_translation_default")
			.on(t.productId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index("idx_product_translation_product").on(t.productId),
		index("idx_product_translation_locale_key").on(t.localeKey),
		index("idx_product_translation_seo").on(t.seoMetadataId),
	],
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
 * (basic, premium, VIP) with different features and instructor interaction levels while
 * maintaining consistent content attribution to instructor profiles.
 *
 * @scalabilityPattern Variant-based commerce scales across all product types while
 * maintaining consistent pricing and payment workflows regardless of product complexity
 * or organizational business model.
 */
export const productVariant = table(
	"product_variant",
	{
		id: id.notNull(),

		/**
		 * @ecommerceIntegration Parent product this variant belongs to
		 * @businessContext Variants provide purchasable variations of core product content
		 * @contentSeparation Product handles content/marketing, variant handles commerce/pricing
		 */
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),

		/**
		 * @businessRule URL-safe identifier unique within product
		 * @ecommerceStandard Standard e-commerce variant identification pattern
		 * @customerExperience Used for variant-specific URLs and customer communication
		 */
		slug: slug.notNull(),

		/**
		 * @businessRule Controls variant availability for purchase
		 * @commerceControl Enables independent variant lifecycle management
		 * @inventoryManagement For physical products, controls stock availability
		 */
		isActive: boolean("is_active").default(true),

		/**
		 * @businessRule Default variant shown first in product selection
		 * @constraint Exactly one default variant per product enforced by unique index
		 * @customerExperience Ensures customers always have a primary purchasing option
		 */
		isDefault: boolean("is_default").default(false),

		/**
		 * @marketingStrategy Highlighted plan in pricing tables (typically "best value")
		 * @conversionOptimization Draws customer attention to preferred monetization tier
		 */
		isFeatured: boolean("is_featured").default(false),

		/**
		 * @displayOrder Controls variant sequence in product selection interfaces
		 * @customerExperience Typically ordered from basic to premium pricing tiers
		 * @marketingStrategy Enables strategic variant presentation for conversion optimization
		 */
		sortOrder: integer("sort_order").default(0),

		/**
		 * @ctiDiscriminator Payment type determines specialized table for type-specific features
		 * @templatePattern Determines downstream plan table extensions
		 */
		type: paymentPlanTypeEnum("type").notNull(),

		// /**
		//  * @regionalPricing Optional market for regional pricing strategies
		//  * @businessRule null = global pricing, marketId = region-specific pricing
		//  * @multiRegionSupport Enables localized pricing overrides
		//  */
		// marketId: text("market_id").references(() => organizationMarket.id),

		/**
		 * @currencySupport Currency for this payment plan instance
		 * @internationalCommerce Required for all payment plans to support global expansion
		 */
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),

		/**
		 * @pricing Main price customers pay for this payment plan
		 * @revenueFoundation Core pricing amount for revenue calculations and billing
		 */
		price: decimal("price", { precision: 10, scale: 2 }).notNull(),

		/**
		 * @promotionalPricing Original price for "save X%" marketing displays
		 * @marketingStrategy Shows discount value to increase conversion rates
		 */
		compareAtPrice: decimal("compare_at_price", {
			precision: 10,
			scale: 2,
		}),

		// /**
		//  * @taxation Tax rate for this payment plan region/market
		//  * @legalCompliance Required for proper tax calculation and reporting
		//  */
		// taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),

		// /**
		//  * @pricingZoneOverride Optional pricing zone override for specialized regional pricing
		//  * @businessFlexibility Enables complex regional pricing strategies
		//  */
		// pricingZoneId: text("pricing_zone_id").references(() => organizationPricingZone.id),

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
		startsAt: timestamp("starts_at").defaultNow(),

		/**
		 * @campaignManagement When this pricing expires (null = permanent)
		 * @promotionalStrategy Supports time-limited promotional pricing
		 */
		endsAt: timestamp("ends_at"),

		/**
		 * @extensibility Variant-specific configuration and feature definitions
		 * @courseExample {"support_level": "email", "max_downloads": 5, "certificate": true}
		 * @businessFlexibility Enables variant-specific features without schema changes
		 */
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Business Constraints
		uniqueIndex("uq_product_variant_slug").on(t.productId, t.slug),
		uniqueIndex("uq_product_variant_default")
			.on(t.productId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index("idx_product_variant_product").on(t.productId),
		index("idx_product_variant_active").on(t.isActive),
		index("idx_product_variant_sort").on(t.sortOrder),
		index("idx_product_variant_default").on(t.isDefault),
	],
);

export const productVariantTranslation = table(
	"product_variant_translation",
	{
		id: id.notNull(),

		/**
		 * @translationTarget Product variant this localized content applies to
		 */
		productVariantId: text("product_variant_id")
			.notNull()
			.references(() => productVariant.id, { onDelete: "cascade" }),

		/**
		 * @localizationContext Target locale for this translation content
		 * @businessRule Supports region-specific payment plan marketing strategies
		 */
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),

		/**
		 * @translationDefault Primary translation used when locale-specific content unavailable
		 * @businessRule Exactly one default translation per payment plan
		 */
		isDefault: boolean("is_default").default(false),

		/**
		 * @localizedContent Region-specific name of plan
		 * @conversionStrategy Enables contextual pricing and positioning across locales
		 */
		name: text("name"),

		/**
		 * @localizedContent Region-specific plan details
		 * @conversionStrategy Boosts international trust and clarity
		 */
		description: text("description"),

		/**
		 * @seoOptimization Optional SEO metadata for payment plan landing pages
		 * @marketingStrategy Enables search optimization for pricing and promotional content
		 */
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Translation Constraints
		uniqueIndex("uq_product_variant_translation").on(t.productVariantId, t.localeKey),
		uniqueIndex("uq_product_variant_translation_default")
			.on(t.productVariantId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index("idx_product_variant_translation_locale_key").on(t.localeKey),
		index("idx_product_variant_translation_seo").on(t.seoMetadataId),
	],
);

// -------------------------------------
// PROFESSIONAL ATTRIBUTION (CREATOR ECONOMY)
// -------------------------------------

/**
 * Product Instructor Attribution - Creator Economy Professional Attribution
 *
 * @businessLogic Links products to instructor profiles for creator economy workflows
 * including content attribution, revenue sharing calculations, and professional recognition.
 * Enables instructors to receive credit and compensation for educational content creation
 * within organizational boundaries while supporting cross-organizational collaboration.
 *
 * @professionalContext Instructors maintain professional identity across organizations
 * while content attribution respects organizational boundaries. Revenue sharing enables
 * fair compensation for content creation within organizational business models.
 *
 * @organizationScope Attribution operates within organizational context ensuring multi-tenant
 * isolation while enabling professional collaboration and revenue sharing workflows that
 * respect organizational business policies and creator compensation structures.
 *
 * @scalabilityPattern This attribution pattern can be replicated for other professional
 * types (consultants, designers, coaches) enabling diverse creator economy scenarios within
 * multi-tenant organizational architecture while maintaining consistent attribution workflows.
 *
 * @revenueIntegration Revenue sharing percentages integrate with payment plan revenue
 * calculations to ensure accurate creator compensation based on actual subscription and
 * purchase revenue generated by attributed content.
 */
export const productInstructorAttribution = table(
	"product_instructor_attribution",
	{
		/**
		 * @professionalIdentity Instructor's professional profile for content attribution
		 * @businessRule Links professional identity to content creation and revenue sharing
		 * @crossOrganizational Professional identity maintained across organizational boundaries
		 */
		instructorProfileId: text("instructor_profile_id")
			.notNull()
			.references(() => userInstructorProfile.id),

		/**
		 * @contentAttribution Product this instructor contributed to creating
		 * @businessRule Links professional contribution to specific organizational content
		 * @revenueTracking Basis for revenue attribution and creator compensation calculations
		 */
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),

		/**
		 * @organizationContext Org context for this professional attribution
		 * @businessRule Ensures attribution operates within organizational boundaries
		 * @multiTenant Maintains organizational isolation while enabling professional attribution
		 */
		organizationId: text("organization_id")
			.notNull()
			.references(() => org.id),

		/**
		 * @revenueSharing Percentage of product revenue attributed to this instructor
		 * @businessRule Enables fair creator compensation based on contribution level
		 * @financialIntegration Integrates with payment plan revenue for accurate calculations
		 */
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}).default("0.00"),

		/**
		 * @professionalRole Instructor's role in content creation and delivery
		 * @businessRule Primary instructors typically handle content creation and student interaction
		 * @attributionHierarchy Enables clear professional responsibility and recognition
		 */
		isPrimary: boolean("is_primary").default(false),

		createdAt,
	},
	(t) => [
		// Business Constraints
		uniqueIndex("uq_product_instructor_org").on(
			t.productId,
			t.instructorProfileId,
			t.organizationId,
		),

		// Performance Indexes for Professional Queries
		index("idx_product_instructor_profile").on(t.instructorProfileId),
		index("idx_product_instructor_org").on(t.organizationId),
		index("idx_product_instructor_product").on(t.productId),
		index("idx_product_instructor_primary").on(t.isPrimary),

		// Revenue Attribution Queries
		index("idx_product_instructor_revenue").on(t.productId, t.revenueSharePercentage),
	],
);

/**
 * Product Brand Attribution - Organizational Brand Identity Integration
 *
 * @businessLogic Links products to org brand identity for consistent marketing
 * and brand presentation across product catalogs. Supports organizations with multiple
 * brands or white-label scenarios where products need clear brand attribution for
 * customer recognition and marketing consistency.
 *
 * @brandStrategy Enables organizations to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing campaigns, customer communication,
 * and brand identity consistency across diverse product catalogs.
 *
 * @organizationScope Brand attribution operates within organizational boundaries enabling
 * sophisticated brand management strategies while maintaining multi-tenant isolation and
 * organizational control over brand identity and product presentation.
 *
 * @marketingIntegration Brand attribution integrates with product marketing, promotional
 * campaigns, and customer communication to ensure consistent brand presentation and
 * customer experience across all product touchpoints and marketing channels.
 */
export const productBrandAttribution = table(
	"product_brand_attribution",
	{
		/**
		 * @brandIdentity Org brand this product is attributed to
		 * @businessRule Links product presentation to specific organizational brand identity
		 * @marketingStrategy Enables consistent brand presentation across product catalog
		 */
		brandId: text("brand_id")
			.notNull()
			.references(() => orgBrand.id),

		/**
		 * @productAttribution Product this brand attribution applies to
		 * @businessRule Links brand identity to specific product for marketing consistency
		 * @customerExperience Ensures consistent brand presentation in product discovery
		 */
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),

		/**
		 * @brandHierarchy Primary brand attribution for main brand presentation
		 * @businessRule One primary brand per product for clear customer brand recognition
		 * @marketingStrategy Primary brand used in product marketing and customer communication
		 */
		isPrimary: boolean("is_primary").default(false),

		createdAt,
	},
	(t) => [
		// Business Constraints
		primaryKey({ columns: [t.brandId, t.productId] }),
		uniqueIndex("uq_product_brand_primary")
			.on(t.productId, t.isPrimary)
			.where(eq(t.isPrimary, true)),

		// Performance Indexes
		index("idx_product_brand_product").on(t.productId),
		index("idx_product_brand_brand").on(t.brandId),
		index("idx_product_brand_primary").on(t.isPrimary),
	],
);

// -------------------------------------
// DISCOUNT INTEGRATION TABLES
// -------------------------------------

/**
 * Discount Product - Product-Level Discount Application
 *
 * @businessLogic Links discount campaigns to specific products enabling targeted
 * promotional strategies and marketing campaigns within organizational boundaries.
 * Supports product-specific promotional campaigns for revenue optimization and
 * customer acquisition strategies.
 *
 * @promotionalStrategy Enables organizations to create product-specific promotional
 * campaigns while maintaining compatibility with payment plan pricing and variant-based
 * commerce workflows for comprehensive promotional campaign management.
 */
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
	(t) => [
		primaryKey({ columns: [t.discountId, t.productId] }),

		// Performance Indexes
		index("idx_discount_product_discount").on(t.discountId),
		index("idx_discount_product_product").on(t.productId),
	],
);

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
	(t) => [
		primaryKey({ columns: [t.discountId, t.variantId] }),

		// Performance Indexes
		index("idx_discount_variant_discount").on(t.discountId),
		index("idx_discount_variant_variant").on(t.variantId),
	],
);
