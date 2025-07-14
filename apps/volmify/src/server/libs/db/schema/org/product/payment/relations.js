/**
 * @fileoverview Product Payment Relations - Variant-Level Payment Integration
 *
 * @integrationPattern Variant-Based Payment Relations + CTI + Creator Economy Integration
 * Enables comprehensive payment plan relationships with product variants, organizational
 * boundaries, and customer subscriptions while maintaining optimal query performance through
 * CTI pattern and specialized relation definitions for e-commerce monetization workflows.
 *
 * @businessContext
 * Payment relations support variant-level e-commerce monetization workflows including
 * organizational pricing strategies, creator economy revenue attribution, multi-currency
 * international expansion, and customer subscription lifecycle management for sophisticated
 * product monetization and comprehensive business analytics.
 *
 * @scalabilityContext
 * CTI relations pattern enables adding new payment types (freemium, corporate, enterprise)
 * without affecting existing payment workflows or requiring relation migrations, supporting
 * platform growth and new monetization strategies while maintaining creator attribution.
 *
 * @creatorEconomyIntegration
 * Payment relations integrate with instructor attribution systems enabling revenue sharing
 * calculations and creator compensation workflows within organizational boundaries while
 * supporting cross-organizational professional collaboration patterns.
 *
 * @variantIntegration
 * Deep integration with productVariant system maintains consistency with established
 * e-commerce patterns while adding sophisticated payment plan capabilities for modern
 * subscription economy and usage-based business models.
 */

import { relations } from "drizzle-orm";
import { currency, locale } from "../../../system/locale-currency-market/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { user } from "../../../user/schema.js";
import { org, orgMarket, orgMember, orgPricingZone } from "../../schema.js";
import { productVariant } from "../schema.js";
import {
	oneTimePaymentPlan,
	oneTimePaymentPlanTranslation,
	productVariantPaymentPlan,
	productVariantPaymentPlanTranslation,
	subscriptionPaymentPlan,
	subscriptionPaymentPlanTranslation,
	usageBasedPaymentPlan,
	usageBasedPaymentPlanTranslation,
	userSubscription,
} from "./schema.js";

/**
 * Product Variant Payment Plan Relations (CTI Root)
 *
 * @integrationRole Central payment plan relationships for variant-level monetization
 * Connects payment plans to product variants, organizational boundaries, currencies, and
 * specialized payment types while supporting comprehensive pricing strategies, international
 * expansion, and creator economy revenue attribution workflows.
 *
 * @businessRelationships
 * - Product variant monetization through sophisticated payment strategies per variant
 * - Organizational payment plan management with multi-tenant isolation and analytics
 * - Multi-currency international pricing with regional market optimization strategies
 * - Customer subscription management with comprehensive lifecycle and access control
 * - Creator economy revenue tracking for instructor attribution and compensation
 *
 * @scalabilityPattern
 * CTI pattern enables type-specific payment relationships while maintaining common payment
 * plan foundation, supporting new payment types and monetization strategies without
 * disrupting existing e-commerce workflows or customer subscription management.
 *
 * @performanceCritical
 * Relations optimized for high-frequency pricing queries, subscription status checks,
 * and revenue attribution calculations essential for e-commerce and creator economy workflows.
 */
export const productVariantPaymentPlanRelations = relations(
	productVariantPaymentPlan,
	({ one, many }) => ({
		/**
		 * @variantIntegration Product variant this payment plan provides monetization strategy for
		 * @businessContext Multiple payment strategies per variant enable sophisticated pricing tiers
		 * @ecommerceFoundation Maintains consistency with established variant-based e-commerce architecture
		 */
		productVariant: one(productVariant, {
			fields: [productVariantPaymentPlan.variantId],
			references: [productVariant.id],
		}),

		/**
		 * @organizationScope Org that owns and manages this payment strategy
		 * @multiTenant Enables org-specific pricing approaches and business model independence
		 * @creatorEconomy Organizational context for instructor attribution and revenue sharing workflows
		 */
		org: one(org, {
			fields: [productVariantPaymentPlan.orgId],
			references: [org.id],
		}),

		/**
		 * @regionalPricing Optional market for region-specific pricing strategies
		 * @internationalExpansion Enables purchasing power parity and market-specific monetization
		 * @businessStrategy Regional pricing optimization for competitive positioning and local economics
		 */
		market: one(orgMarket, {
			fields: [productVariantPaymentPlan.marketId],
			references: [orgMarket.id],
		}),

		/**
		 * @currencySupport Target currency for this payment plan pricing
		 * @internationalCommerce Essential for global e-commerce expansion and revenue tracking
		 * @multiCurrencyManagement Enables sophisticated international pricing and billing strategies
		 */
		currency: one(currency, {
			fields: [productVariantPaymentPlan.currencyCode],
			references: [currency.code],
		}),

		/**
		 * @pricingZoneIntegration Optional pricing zone for specialized regional pricing
		 * @businessFlexibility Enables complex regional pricing strategies beyond standard markets
		 * @organizationalStrategy Advanced pricing control for sophisticated market segmentation
		 */
		pricingZone: one(orgPricingZone, {
			fields: [productVariantPaymentPlan.pricingZoneId],
			references: [orgPricingZone.id],
		}),

		/**
		 * @ctiExtensions Type-specific payment plan specializations with business logic
		 * @performanceOptimization Only one populated based on payment plan type for efficient queries
		 * @businessModelFlexibility Each payment type enables different monetization strategies
		 */
		oneTimePlan: one(oneTimePaymentPlan, {
			fields: [productVariantPaymentPlan.id],
			references: [oneTimePaymentPlan.planId],
		}),
		subscriptionPlan: one(subscriptionPaymentPlan, {
			fields: [productVariantPaymentPlan.id],
			references: [subscriptionPaymentPlan.planId],
		}),
		usageBasedPlan: one(usageBasedPaymentPlan, {
			fields: [productVariantPaymentPlan.id],
			references: [usageBasedPaymentPlan.planId],
		}),

		/**
		 * @translationSupport Multi-language payment plan content for international markets
		 * @marketingLocalization Enables region-specific payment plan marketing and conversion optimization
		 * @globalExpansion Essential for international product sales and market penetration strategies
		 */
		translations: many(productVariantPaymentPlanTranslation),

		/**
		 * @subscriptionManagement Customer subscriptions using this payment plan
		 * @revenueTracking Links organizational pricing strategies to actual subscription revenue
		 * @creatorEconomy Revenue data for instructor attribution and compensation calculations
		 */
		subscriptions: many(userSubscription),
	}),
);

/**
 * Product Variant Payment Plan Translation Relations
 *
 * @integrationRole Multi-language support for payment plan marketing content
 * Enables organizations to localize payment plan presentations for different markets
 * while maintaining consistent underlying pricing and business logic for international expansion.
 *
 * @marketingStrategy Localized content improves conversion rates and customer experience
 * in international markets while supporting region-specific pricing campaigns and
 * promotional strategies for optimal market penetration.
 *
 * @businessContext Essential for organizations expanding into international markets with
 * region-specific marketing messages, pricing explanations, and value propositions
 * tailored to local market conditions and customer preferences.
 */
export const productVariantPaymentPlanTranslationRelations = relations(
	productVariantPaymentPlanTranslation,
	({ one }) => ({
		/**
		 * @translationTarget Payment plan this localized content applies to
		 * @businessContext Enables multi-language payment plan marketing and conversion optimization
		 * @internationalStrategy Region-specific messaging for improved market penetration
		 */
		paymentPlan: one(productVariantPaymentPlan, {
			fields: [productVariantPaymentPlanTranslation.planId],
			references: [productVariantPaymentPlan.id],
		}),

		/**
		 * @seoOptimization Optional SEO metadata for payment plan landing pages
		 * @marketingStrategy Enables search optimization for pricing and promotional content
		 * @organicGrowth Improves discoverability of payment plans in search engines for organic traffic
		 */
		seoMetadata: one(seoMetadata, {
			fields: [productVariantPaymentPlanTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(locale, {
			fields: [productVariantPaymentPlanTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * One-Time Payment Plan Relations (CTI Specialization)
 *
 * @integrationRole Traditional e-commerce purchase model with lifetime access features
 * Extends base payment plan with one-time purchase capabilities including gift purchases,
 * access transfers, and configurable access duration for flexible monetization strategies.
 *
 * @businessModel Supports traditional e-commerce patterns where customers make single
 * payments for permanent or time-limited access to products, services, or content with
 * sophisticated access management and customer service capabilities.
 *
 * @ecommerceFeatures Gift purchasing and transfer capabilities expand market reach and
 * support viral growth through gift economy while enabling corporate training scenarios
 * and family sharing arrangements for enhanced customer value.
 */
export const oneTimePaymentPlanRelations = relations(oneTimePaymentPlan, ({ one, many }) => ({
	/**
	 * @ctiParent Links to base payment plan attributes and relationships
	 * @businessContext Provides access to common payment plan fields, pricing, and organizational context
	 * @dataConsistency Ensures CTI pattern integrity and optimal query performance
	 */
	paymentPlan: one(productVariantPaymentPlan, {
		fields: [oneTimePaymentPlan.planId],
		references: [productVariantPaymentPlan.id],
	}),

	/**
	 * @translationSupport Multi-language one-time payment plan content
	 * @marketingLocalization Enables region-specific gift messaging, access policies, and transfer procedures
	 * @customerExperience Localized policies and messaging improve customer understanding and satisfaction
	 */
	translations: many(oneTimePaymentPlanTranslation),
}));

/**
 * One-Time Payment Plan Translation Relations
 *
 * @integrationRole Multi-language support for one-time payment plan specific content
 * Enables organizations to localize gift messaging, access policies, and transfer procedures
 * for different markets while addressing regional legal requirements and cultural preferences.
 *
 * @businessContext Essential for organizations offering gift purchases and account transfers
 * in international markets with different legal frameworks and cultural expectations around
 * digital product ownership and sharing.
 */
export const oneTimePaymentPlanTranslationRelations = relations(
	oneTimePaymentPlanTranslation,
	({ one }) => ({
		/**
		 * @translationTarget One-time payment plan this localized content applies to
		 * @businessContext Enables multi-language one-time payment plan marketing and policy communication
		 */
		oneTimePaymentPlan: one(oneTimePaymentPlan, {
			fields: [oneTimePaymentPlanTranslation.planId],
			references: [oneTimePaymentPlan.planId],
		}),
		locale: one(locale, {
			fields: [oneTimePaymentPlanTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Subscription Payment Plan Relations (CTI Specialization)
 *
 * @integrationRole Recurring billing product access with comprehensive subscription lifecycle
 * Extends base payment plan with subscription-specific features including billing intervals,
 * trial periods, and setup fees for sophisticated SaaS-style product monetization strategies.
 *
 * @businessModel Supports modern subscription economy patterns where customers pay recurring
 * fees for continued access to products, services, or content with comprehensive lifecycle
 * management and customer acquisition optimization through trial periods.
 *
 * @subscriptionEconomy Trial periods and flexible billing intervals enable sophisticated
 * customer acquisition strategies while setup fees provide additional revenue streams for
 * comprehensive subscription monetization optimization.
 */
export const subscriptionPaymentPlanRelations = relations(
	subscriptionPaymentPlan,
	({ one, many }) => ({
		/**
		 * @ctiParent Links to base payment plan attributes and relationships
		 * @businessContext Provides access to common payment plan fields, pricing, and organizational context
		 * @dataConsistency Ensures CTI pattern integrity and optimal query performance
		 */
		paymentPlan: one(productVariantPaymentPlan, {
			fields: [subscriptionPaymentPlan.planId],
			references: [productVariantPaymentPlan.id],
		}),

		/**
		 * @translationSupport Multi-language subscription payment plan content
		 * @marketingLocalization Enables region-specific billing descriptions, trial messaging, and cancellation policies
		 * @legalCompliance Localized terms and policies for regulatory compliance in different markets
		 */
		translations: many(subscriptionPaymentPlanTranslation),
	}),
);

/**
 * Subscription Payment Plan Translation Relations
 *
 * @integrationRole Multi-language support for subscription payment plan specific content
 * Enables organizations to localize billing descriptions, trial messaging, and cancellation
 * policies for different markets while addressing regional legal and regulatory requirements.
 *
 * @businessContext Essential for organizations offering subscription services in international
 * markets with different regulatory frameworks around recurring billing, trial periods, and
 * subscription cancellation policies.
 */
export const subscriptionPaymentPlanTranslationRelations = relations(
	subscriptionPaymentPlanTranslation,
	({ one }) => ({
		/**
		 * @translationTarget Subscription payment plan this localized content applies to
		 * @businessContext Enables multi-language subscription payment plan marketing and policy communication
		 */
		subscriptionPaymentPlan: one(subscriptionPaymentPlan, {
			fields: [subscriptionPaymentPlanTranslation.planId],
			references: [subscriptionPaymentPlan.planId],
		}),
		locale: one(locale, {
			fields: [subscriptionPaymentPlanTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Usage-Based Payment Plan Relations (CTI Specialization)
 *
 * @integrationRole Consumption-based billing with usage tracking and metered access control
 * Extends base payment plan with usage-based features for sophisticated revenue optimization
 * based on actual product consumption and customer engagement with complex pricing models.
 *
 * @businessModel Supports usage-based pricing models where customers pay based on consumption,
 * similar to cloud services, API usage, or metered product access with sophisticated revenue
 * optimization through tiered pricing and freemium models.
 *
 * @revenueOptimization Usage-based billing enables revenue scaling with customer success while
 * providing predictable minimum revenue through freemium allowances and base charges for
 * sophisticated monetization aligned with customer value realization.
 */
export const usageBasedPaymentPlanRelations = relations(usageBasedPaymentPlan, ({ one, many }) => ({
	/**
	 * @ctiParent Links to base payment plan attributes and relationships
	 * @businessContext Provides access to common payment plan fields, pricing, and organizational context
	 * @dataConsistency Ensures CTI pattern integrity and optimal query performance
	 */
	paymentPlan: one(productVariantPaymentPlan, {
		fields: [usageBasedPaymentPlan.planId],
		references: [productVariantPaymentPlan.id],
	}),

	/**
	 * @translationSupport Multi-language usage-based payment plan content
	 * @marketingLocalization Enables region-specific usage descriptions and pricing explanations
	 * @customerEducation Localized explanations of complex usage billing models for customer clarity
	 */
	translations: many(usageBasedPaymentPlanTranslation),
}));

/**
 * Usage-Based Payment Plan Translation Relations
 *
 * @integrationRole Multi-language support for usage-based payment plan specific content
 * Enables organizations to localize usage descriptions, pricing explanations, and billing
 * policies for different markets while explaining complex usage-based billing models clearly.
 *
 * @businessContext Essential for organizations offering usage-based services in international
 * markets where complex pricing models require clear explanation and customer education for
 * optimal adoption and customer satisfaction.
 */
export const usageBasedPaymentPlanTranslationRelations = relations(
	usageBasedPaymentPlanTranslation,
	({ one }) => ({
		/**
		 * @translationTarget Usage-based payment plan this localized content applies to
		 * @businessContext Enables multi-language usage-based payment plan marketing and education
		 */
		usageBasedPaymentPlan: one(usageBasedPaymentPlan, {
			fields: [usageBasedPaymentPlanTranslation.planId],
			references: [usageBasedPaymentPlan.planId],
		}),
		locale: one(locale, {
			fields: [usageBasedPaymentPlanTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * User Subscription Relations
 *
 * @integrationRole Customer subscription instances with comprehensive lifecycle tracking
 * Links customer payments to organizational payment plans while maintaining access control,
 * subscription management, and creator economy revenue attribution for comprehensive customer
 * and business relationship management.
 *
 * @businessContext Manages customer relationships and subscription lifecycles while integrating
 * with organizational payment strategies, creator economy revenue sharing, and international
 * currency management for comprehensive subscription commerce and creator compensation.
 *
 * @creatorEconomyIntegration Revenue tracking enables instructor attribution calculations and
 * organizational analytics for creator compensation workflows while maintaining clear
 * organizational boundaries and professional attribution patterns.
 *
 * @performanceCritical Relations optimized for high-frequency subscription status checks,
 * access control queries, and revenue attribution calculations essential for customer
 * experience and creator economy workflows.
 */
export const userSubscriptionRelations = relations(userSubscription, ({ one }) => ({
	/**
	 * @customerReference Customer who owns this subscription instance
	 * @accessControl Primary relationship for content access permissions and customer service workflows
	 * @businessCritical Essential for subscription management and customer experience optimization
	 */
	user: one(user, {
		fields: [userSubscription.userId],
		references: [user.id],
	}),

	/**
	 * @paymentPlanReference Org's payment plan this subscription follows
	 * @businessContext Determines pricing, features, billing cycle, and access permissions
	 * @revenueAttribution Links subscription revenue to specific organizational payment strategies
	 */
	paymentPlan: one(productVariantPaymentPlan, {
		fields: [userSubscription.planId],
		references: [productVariantPaymentPlan.id],
	}),

	/**
	 * @organizationScope Org context for subscription management and analytics
	 * @multiTenant Enables org-specific subscription reporting and business intelligence
	 * @creatorEconomy Organizational context for instructor attribution and revenue sharing workflows
	 */
	org: one(org, {
		fields: [userSubscription.orgId],
		references: [org.id],
	}),

	/**
	 * @memberContext Optional org member context for internal subscriptions
	 * @businessRule When present, indicates internal organizational member subscription access
	 * @accessControl Enables different access patterns and policies for internal vs external customers
	 */
	organizationMember: one(orgMember, {
		fields: [userSubscription.organizationMemberId],
		references: [orgMember.id],
	}),

	/**
	 * @currencyTracking Currency used for subscription billing and revenue tracking
	 * @internationalCommerce Essential for multi-currency subscription revenue analytics
	 * @financialReporting Critical for accurate revenue reporting and creator economy compensation
	 */
	currency: one(currency, {
		fields: [userSubscription.currencyCode],
		references: [currency.code],
	}),
}));
