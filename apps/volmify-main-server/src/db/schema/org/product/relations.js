/**
 * @fileoverview Product Relations - Multi-Tenant E-commerce Integration with Creator Attribution
 *
 * @integrationPattern Job Attribution + Brand Integration + Payment Plan Integration + E-commerce Relations
 * Enables comprehensive product relationships supporting creator economy workflows, org
 * brand identity, sophisticated e-commerce scenarios, and integrated payment strategies. Relations
 * facilitate professional content attribution, revenue sharing, cross-org collaboration,
 * and comprehensive promotional campaign management.
 *
 * @businessContext
 * Product relations support creator economy workflows where Org Members create educational
 * content within org boundaries while maintaining professional attribution, enabling
 * revenue sharing, and supporting brand identity integration. Payment plan integration eliminates
 * pricing table redundancy while maintaining sophisticated pricing and promotional strategies.
 *
 * @scalabilityContext
 * Job attribution patterns can be replicated for other creator types (consultants,
 * designers, coaches) enabling diverse creator economy scenarios within multi-tenant architecture.
 * Payment plan integration scales across all product types while maintaining consistent commerce
 * workflows and promotional campaign compatibility.
 *
 * @paymentIntegration
 * Direct integration with payment plans through variants eliminates separate pricing table
 * complexity while maintaining sophisticated pricing strategies, multi-currency support, and
 * promotional campaign compatibility for comprehensive e-commerce monetization.
 */

import { relations } from "drizzle-orm";
import { locale } from "../../general/locale-and-currency/schema.js";
import { seoMetadata } from "../../general/seo/schema.js";
import { orgBrand } from "../brand/schema.js";
// import { orgMemberProductAttribution } from "../../user/profile/schema.js";
import { orgLocale } from "../locale-region/schema.js";
import { orgEmployee, orgEmployeeProductAttribution } from "../member/employee/schema.js";
import { org } from "../schema.js";
import { orgProductCourse } from "./by-type/course/schema.js";
import { orgProductCollectionProduct } from "./collection/schema.js";
import { orgDiscountProduct, orgDiscountProductVariant } from "./offers/schema.js";
import { orgMemberOrder } from "./orders/schema.js";
import { orgProductVariantPaymentPlan } from "./payment/schema.js";
import {
	// discountProduct,
	// discountVariant,
	orgProduct,
	orgProductBrandAttribution,
	// productPrice,
	orgProductI18n,
	orgProductRevenuePool,
	orgProductVariant,
	orgProductVariantI18n,
	// productZonePrice,
} from "./schema.js";

/**
 * Product Relations (E-commerce Foundation)
 *
 * @integrationRole Central product relationships for org e-commerce
 * Connects products to org boundaries, professional attribution, brand identity,
 * payment plan strategies, and e-commerce infrastructure while supporting creator economy
 * revenue workflows and comprehensive promotional campaign management.
 *
 * @businessRelationships
 * - Org product catalog management and multi-tenant isolation
 * - Job creator attribution for educational content and revenue sharing workflows
 * - Brand identity integration for consistent marketing and customer recognition strategies
 * - Payment plan integration through variants for sophisticated pricing and promotional strategies
 * - E-commerce infrastructure including promotional campaigns and customer acquisition workflows
 *
 * @scalabilityPattern
 * Attribution patterns enable adding new professional types while maintaining consistent
 * revenue sharing and professional identity workflows across org boundaries.
 * Payment plan integration scales across product types while maintaining promotional compatibility.
 */
export const productRelations = relations(orgProduct, ({ one, many }) => ({
	/**
	 * @orgScope Org that owns and manages this product
	 * @businessContext Multi-tenant product catalog within org boundaries
	 * @creatorEconomy Org context for professional attribution and revenue workflows
	 */
	org: one(org, {
		fields: [orgProduct.orgId],
		references: [org.id],
	}),

	/**
	 * @translationSupport Multi-language product content for international markets
	 * @marketingLocalization Enables region-specific product marketing and SEO optimization
	 * @globalExpansion Essential for international product catalog expansion strategies
	 */
	translations: many(orgProductI18n),

	/**
	 * @ecommerceFoundation Product variations enabling sophisticated pricing strategies
	 * @businessModel Variants define purchasable variations with different features and pricing
	 * @paymentIntegration Variants connect directly to payment plans for integrated commerce
	 */
	variants: many(orgProductVariant),

	/**
	 * @catalogManagement Product collection membership for org catalog structure
	 * @businessContext Enables product categorization and promotional bundling strategies
	 * @marketingStrategy Supports product discovery and cross-selling workflows
	 */
	collections: many(orgProductCollectionProduct),

	/**
	 * @promotionalStrategy Product-specific discount campaign integration
	 * @businessContext Enables targeted promotional strategies and revenue optimization
	 * @paymentCompatibility Promotional campaigns integrate with payment plan pricing
	 */
	discountProducts: many(orgDiscountProduct),

	/**
	 * @brandAttribution Brand identity attributions for this product
	 * @marketplacePresentation Brand-based product presentation and customer recognition
	 * @orgalStrategy Supports multi-brand and white-label product strategies
	 */
	brandAttributions: many(orgProductBrandAttribution),

	courseSpecialization: one(orgProductCourse, {
		fields: [orgProduct.id],
		references: [orgProductCourse.productId],
	}),

	discounts: many(orgDiscountProduct),
	orders: many(orgMemberOrder),

	employeeAttributions: many(orgEmployeeProductAttribution),

	revenuePools: many(orgProductRevenuePool),
}));

/**
 * Product Translation Relations
 *
 * @integrationRole Multi-language support for product marketing content
 * Enables orgs to localize product presentations for different markets
 * while maintaining consistent underlying product catalog and business logic.
 *
 * @marketingStrategy Localized content improves conversion rates and customer experience
 * in international markets while supporting region-specific SEO optimization and
 * cultural adaptation for global expansion strategies.
 */
export const productTranslationRelations = relations(orgProductI18n, ({ one }) => ({
	/**
	 * @translationTarget Product this localized content applies to
	 * @businessContext Enables multi-language product marketing and conversion optimization
	 * @globalStrategy Region-specific messaging for international market penetration
	 */
	product: one(orgProduct, {
		fields: [orgProductI18n.productId],
		references: [orgProduct.id],
	}),

	/**
	 * @seoOptimization Optional SEO metadata for localized product landing pages
	 * @marketingStrategy Enables search optimization for region-specific product content
	 * @organicGrowth Improves product discoverability in international search engines
	 */
	seoMetadata: one(seoMetadata, {
		fields: [orgProductI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(orgLocale, {
		fields: [orgProductI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));

/**
 * Product Variant Relations (E-commerce Variations)
 *
 * @integrationRole Product variation relationships for e-commerce functionality
 * Connects product variants to payment plan strategies, discount campaigns, and
 * e-commerce infrastructure enabling sophisticated monetization and promotional workflows.
 *
 * @paymentIntegration Direct connection to payment plans eliminates separate pricing
 * table complexity while maintaining sophisticated pricing strategies and promotional
 * campaign compatibility for comprehensive e-commerce monetization.
 */
export const productVariantRelations = relations(orgProductVariant, ({ one, many }) => ({
	/**
	 * @ecommerceIntegration Parent product this variant belongs to
	 * @businessContext Variants provide purchasable variations of core product content
	 * @contentSeparation Product handles marketing, variant handles commerce and pricing
	 */
	product: one(orgProduct, {
		fields: [orgProductVariant.productId],
		references: [orgProduct.id],
	}),

	translations: many(orgProductVariantI18n),

	/**
	 * @paymentPlanIntegration Payment plan pricing for this variant
	 * @businessContext Direct integration with payment plans for variant pricing
	 * @ecommerceStrategy Enables sophisticated pricing strategies without separate pricing tables
	 * @revenueOptimization Supports subscription, one-time purchase, and free access models
	 * @multiCurrencySupport Maintains multi-currency pricing for global markets
	 */
	paymentPlans: many(orgProductVariantPaymentPlan),

	/**
	 * @promotionalStrategy Variant-specific discount campaign integration
	 * @businessContext Enables granular promotional strategies for different access levels
	 * @revenueOptimization Supports targeted promotional campaigns for conversion optimization
	 */
	discounts: many(orgDiscountProductVariant),
}));

export const productVariantTranslationRelations = relations(orgProductVariantI18n, ({ one }) => ({
	productVariant: one(orgProductVariant, {
		fields: [orgProductVariantI18n.variantId],
		references: [orgProductVariant.id],
	}),

	seoMetadata: one(seoMetadata, {
		fields: [orgProductVariantI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),

	locale: one(locale, {
		fields: [orgProductVariantI18n.localeKey],
		references: [locale.key],
	}),
}));

/**
 * Product Brand Attribution Relations (Brand Identity Integration)
 *
 * @integrationRole Brand identity attribution relationships for marketing consistency
 * Connects org brands to product content enabling consistent brand presentation,
 * marketing campaigns, and customer recognition across product catalogs and promotional strategies.
 *
 * @brandStrategy Enables orgs to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing consistency and customer experience
 * across diverse product catalogs and promotional campaigns.
 */
export const productBrandAttributionRelations = relations(
	orgProductBrandAttribution,
	({ one }) => ({
		/**
		 * @brandIdentity Org brand this attribution applies to
		 * @businessContext Links brand identity to product presentation and marketing consistency
		 * @customerExperience Ensures consistent brand presentation across product discovery workflows
		 */
		brand: one(orgBrand, {
			fields: [orgProductBrandAttribution.brandId],
			references: [orgBrand.id],
		}),

		/**
		 * @productAttribution Product this brand attribution applies to
		 * @businessContext Links brand identity to specific product for marketing consistency
		 * @marketingStrategy Enables brand-specific product presentation and promotional campaigns
		 */
		product: one(orgProduct, {
			fields: [orgProductBrandAttribution.productId],
			references: [orgProduct.id],
		}),
	}),
);

export const orgProductRevenuePoolRelations = relations(orgProductRevenuePool, ({ one }) => ({
	lastAllocatedByEmployee: one(orgEmployee, {
		fields: [orgProductRevenuePool.lastAllocationByEmployeeId],
		references: [orgEmployee.id],
	}),
	product: one(orgProduct, {
		fields: [orgProductRevenuePool.productId],
		references: [orgProduct.id],
	}),
}));
