/**
 * @fileoverview Product Relations - Multi-Tenant E-commerce Integration with Creator Attribution
 *
 * @integrationPattern Professional Attribution + Brand Integration + Payment Plan Integration + E-commerce Relations
 * Enables comprehensive product relationships supporting creator economy workflows, organizational
 * brand identity, sophisticated e-commerce scenarios, and integrated payment strategies. Relations
 * facilitate professional content attribution, revenue sharing, cross-organizational collaboration,
 * and comprehensive promotional campaign management.
 *
 * @businessContext
 * Product relations support creator economy workflows where instructors create educational
 * content within organizational boundaries while maintaining professional attribution, enabling
 * revenue sharing, and supporting brand identity integration. Payment plan integration eliminates
 * pricing table redundancy while maintaining sophisticated pricing and promotional strategies.
 *
 * @scalabilityContext
 * Professional attribution patterns can be replicated for other creator types (consultants,
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

import { org, orgBrand } from "../org/schema.js";
import { locale } from "../system/locale-currency-market/schema.js";
import { seoMetadata } from "../system/seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { productCourse } from "./by-type/course/schema.js";
import { productCollection } from "./collection/schema.js";
import { discount } from "./offers/schema.js";
import { productVariantPaymentPlan } from "./payment/schema.js";
import {
	discountProduct,
	discountVariant,
	product,
	productBrandAttribution,
	productInstructorAttribution,
	// productPrice,
	productTranslation,
	productVariant,
	productVariantTranslation,
	// productZonePrice,
} from "./schema.js";

/**
 * Product Relations (E-commerce Foundation)
 *
 * @integrationRole Central product relationships for organizational e-commerce
 * Connects products to organizational boundaries, professional attribution, brand identity,
 * payment plan strategies, and e-commerce infrastructure while supporting creator economy
 * revenue workflows and comprehensive promotional campaign management.
 *
 * @businessRelationships
 * - Organizational product catalog management and multi-tenant isolation
 * - Professional creator attribution for educational content and revenue sharing workflows
 * - Brand identity integration for consistent marketing and customer recognition strategies
 * - Payment plan integration through variants for sophisticated pricing and promotional strategies
 * - E-commerce infrastructure including promotional campaigns and customer acquisition workflows
 *
 * @scalabilityPattern
 * Attribution patterns enable adding new professional types while maintaining consistent
 * revenue sharing and professional identity workflows across organizational boundaries.
 * Payment plan integration scales across product types while maintaining promotional compatibility.
 */
export const productRelations = relations(product, ({ one, many }) => ({
	/**
	 * @organizationScope Org that owns and manages this product
	 * @businessContext Multi-tenant product catalog within organizational boundaries
	 * @creatorEconomy Organizational context for professional attribution and revenue workflows
	 */
	org: one(org, {
		fields: [product.organizationId],
		references: [org.id],
	}),

	/**
	 * @translationSupport Multi-language product content for international markets
	 * @marketingLocalization Enables region-specific product marketing and SEO optimization
	 * @globalExpansion Essential for international product catalog expansion strategies
	 */
	translations: many(productTranslation),

	/**
	 * @ecommerceFoundation Product variations enabling sophisticated pricing strategies
	 * @businessModel Variants define purchasable variations with different features and pricing
	 * @paymentIntegration Variants connect directly to payment plans for integrated commerce
	 */
	variants: many(productVariant),

	/**
	 * @catalogManagement Product collection membership for organizational catalog structure
	 * @businessContext Enables product categorization and promotional bundling strategies
	 * @marketingStrategy Supports product discovery and cross-selling workflows
	 */
	collections: many(productCollection),

	/**
	 * @promotionalStrategy Product-specific discount campaign integration
	 * @businessContext Enables targeted promotional strategies and revenue optimization
	 * @paymentCompatibility Promotional campaigns integrate with payment plan pricing
	 */
	discountProducts: many(discountProduct),

	/**
	 * @brandAttribution Brand identity attributions for this product
	 * @marketplacePresentation Brand-based product presentation and customer recognition
	 * @organizationalStrategy Supports multi-brand and white-label product strategies
	 */
	brandAttributions: many(productBrandAttribution),

	/**
	 * @professionalAttribution Instructor creator attributions for this product
	 * @creatorEconomy Creator revenue sharing and professional collaboration tracking
	 * @revenueIntegration Professional attribution integrates with payment plan revenue calculations
	 */
	instructorAttributions: many(productInstructorAttribution),

	courseSpecialization: one(productCourse, {
		fields: [product.id],
		references: [productCourse.productId],
	}),
}));

/**
 * Product Translation Relations
 *
 * @integrationRole Multi-language support for product marketing content
 * Enables organizations to localize product presentations for different markets
 * while maintaining consistent underlying product catalog and business logic.
 *
 * @marketingStrategy Localized content improves conversion rates and customer experience
 * in international markets while supporting region-specific SEO optimization and
 * cultural adaptation for global expansion strategies.
 */
export const productTranslationRelations = relations(productTranslation, ({ one }) => ({
	/**
	 * @translationTarget Product this localized content applies to
	 * @businessContext Enables multi-language product marketing and conversion optimization
	 * @globalStrategy Region-specific messaging for international market penetration
	 */
	product: one(product, {
		fields: [productTranslation.productId],
		references: [product.id],
	}),

	/**
	 * @seoOptimization Optional SEO metadata for localized product landing pages
	 * @marketingStrategy Enables search optimization for region-specific product content
	 * @organicGrowth Improves product discoverability in international search engines
	 */
	seoMetadata: one(seoMetadata, {
		fields: [productTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [productTranslation.localeKey],
		references: [locale.key],
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
export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
	/**
	 * @ecommerceIntegration Parent product this variant belongs to
	 * @businessContext Variants provide purchasable variations of core product content
	 * @contentSeparation Product handles marketing, variant handles commerce and pricing
	 */
	product: one(product, {
		fields: [productVariant.productId],
		references: [product.id],
	}),

	translations: many(productVariantTranslation),

	/**
	 * @paymentPlanIntegration Payment plan pricing for this variant
	 * @businessContext Direct integration with payment plans for variant pricing
	 * @ecommerceStrategy Enables sophisticated pricing strategies without separate pricing tables
	 * @revenueOptimization Supports subscription, one-time purchase, and free access models
	 * @multiCurrencySupport Maintains multi-currency pricing for global markets
	 */
	paymentPlans: many(productVariantPaymentPlan),

	/**
	 * @promotionalStrategy Variant-specific discount campaign integration
	 * @businessContext Enables granular promotional strategies for different access levels
	 * @revenueOptimization Supports targeted promotional campaigns for conversion optimization
	 */
	discountVariants: many(discountVariant),
}));

export const productVariantTranslationRelations = relations(
	productVariantTranslation,
	({ one }) => ({
		productVariant: one(productVariant, {
			fields: [productVariantTranslation.productVariantId],
			references: [productVariant.id],
		}),

		seoMetadata: one(seoMetadata, {
			fields: [productVariantTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),

		locale: one(locale, {
			fields: [productVariantTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Product Instructor Attribution Relations (Creator Economy)
 *
 * @integrationRole Professional attribution relationships for creator economy
 * Connects instructor profiles to product content attribution enabling revenue sharing,
 * professional recognition, and cross-organizational collaboration workflows within
 * organizational boundaries and business policies.
 *
 * @professionalContext Instructors maintain professional identity across organizations
 * while content attribution operates within organizational boundaries for revenue sharing
 * and professional collaboration workflows that respect organizational business models.
 *
 * @revenueIntegration Professional attribution integrates with payment plan revenue
 * calculations to ensure accurate creator compensation based on actual subscription and
 * purchase revenue generated by attributed content.
 */
export const productInstructorAttributionRelations = relations(
	productInstructorAttribution,
	({ one }) => ({
		/**
		 * @professionalIdentity Instructor profile for content attribution and revenue sharing
		 * @businessContext Links professional identity to content creation and compensation workflows
		 * @crossOrganizational Professional identity maintained across organizational boundaries
		 */
		instructorProfile: one(userInstructorProfile, {
			fields: [productInstructorAttribution.instructorProfileId],
			references: [userInstructorProfile.id],
		}),

		/**
		 * @contentAttribution Product this professional attribution applies to
		 * @businessContext Links professional contribution to specific content for revenue tracking
		 * @revenueCalculation Basis for creator compensation and professional recognition workflows
		 */
		product: one(product, {
			fields: [productInstructorAttribution.productId],
			references: [product.id],
		}),

		/**
		 * @organizationContext Org context for professional attribution
		 * @businessRule Ensures attribution operates within organizational boundaries
		 * @multiTenant Maintains organizational isolation while enabling professional collaboration
		 */
		org: one(org, {
			fields: [productInstructorAttribution.organizationId],
			references: [org.id],
		}),
	}),
);

/**
 * Product Brand Attribution Relations (Brand Identity Integration)
 *
 * @integrationRole Brand identity attribution relationships for marketing consistency
 * Connects organizational brands to product content enabling consistent brand presentation,
 * marketing campaigns, and customer recognition across product catalogs and promotional strategies.
 *
 * @brandStrategy Enables organizations to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing consistency and customer experience
 * across diverse product catalogs and promotional campaigns.
 */
export const productBrandAttributionRelations = relations(productBrandAttribution, ({ one }) => ({
	/**
	 * @brandIdentity Org brand this attribution applies to
	 * @businessContext Links brand identity to product presentation and marketing consistency
	 * @customerExperience Ensures consistent brand presentation across product discovery workflows
	 */
	brand: one(orgBrand, {
		fields: [productBrandAttribution.brandId],
		references: [orgBrand.id],
	}),

	/**
	 * @productAttribution Product this brand attribution applies to
	 * @businessContext Links brand identity to specific product for marketing consistency
	 * @marketingStrategy Enables brand-specific product presentation and promotional campaigns
	 */
	product: one(product, {
		fields: [productBrandAttribution.productId],
		references: [product.id],
	}),
}));

/**
 * Discount Product Relations (Promotional Integration)
 *
 * @integrationRole Product-level discount campaign relationships
 * Connects discount campaigns to products enabling targeted promotional strategies
 * while maintaining compatibility with payment plan pricing and e-commerce workflows.
 *
 * @promotionalStrategy Enables product-specific promotional campaigns for revenue
 * optimization and customer acquisition while integrating with payment plan pricing
 * for comprehensive promotional campaign management.
 */
export const discountProductRelations = relations(discountProduct, ({ one }) => ({
	/**
	 * @promotionalCampaign Discount campaign this product application belongs to
	 * @businessContext Links product to specific promotional strategy and revenue optimization
	 * @marketingStrategy Enables targeted promotional campaigns for customer acquisition
	 */
	discount: one(discount, {
		fields: [discountProduct.discountId],
		references: [discount.id],
	}),

	/**
	 * @productTarget Product this discount campaign applies to
	 * @businessContext Links promotional strategy to specific product for targeted marketing
	 * @revenueStrategy Enables product-specific promotional pricing and conversion optimization
	 */
	product: one(product, {
		fields: [discountProduct.productId],
		references: [product.id],
	}),
}));

/**
 * Discount Variant Relations (Granular Promotional Integration)
 *
 * @integrationRole Variant-level discount campaign relationships
 * Connects discount campaigns to specific product variants enabling granular promotional
 * strategies for different pricing tiers and access levels while maintaining payment
 * plan pricing compatibility.
 *
 * @promotionalStrategy Enables variant-specific promotional campaigns for precise revenue
 * optimization and customer conversion strategies while integrating with payment plan
 * pricing for sophisticated promotional campaign workflows.
 */
export const discountVariantRelations = relations(discountVariant, ({ one }) => ({
	/**
	 * @promotionalCampaign Discount campaign this variant application belongs to
	 * @businessContext Links variant to specific promotional strategy for granular pricing control
	 * @conversionStrategy Enables targeted promotional campaigns for specific access levels
	 */
	discount: one(discount, {
		fields: [discountVariant.discountId],
		references: [discount.id],
	}),

	/**
	 * @variantTarget Product variant this discount campaign applies to
	 * @businessContext Links promotional strategy to specific variant for granular marketing
	 * @revenueOptimization Enables variant-specific promotional pricing and conversion strategies
	 */
	variant: one(productVariant, {
		fields: [discountVariant.variantId],
		references: [productVariant.id],
	}),
}));
