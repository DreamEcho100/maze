// ## org -> product

import { relations } from "drizzle-orm";
import { locale } from "../../0-local/00-schema.js";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgDiscountProduct, orgDiscountProductVariant } from "../5-offers/schema.js";
import { orgMemberOrder } from "../6-orders/schema.js";
import { org } from "../00-schema.js";
import {
	orgEmployeeProductAttribution,
	orgProductBrandAttribution,
	orgProductRevenuePool,
} from "./1-approval-revenue-and-attribution/schema.js";
import { orgProductCourse } from "./1-by-type/course/schema.js";
import { orgProductCollectionProduct } from "./1-collection/schema.js";
import {
	orgProduct,
	orgProductI18n,
	orgProductVariant,
	orgProductVariantI18n,
} from "./00-schema.js";
import { orgProductVariantPaymentPlan } from "./payment/schema.js";

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

// -- org -> product
