/**
 * @fileoverview Product Payment Plans - Variant-Level Payment Strategies with Integrated Pricing
 *
 * @architecture Variant-Based Payment Plans with CTI + Integrated Market/Currency Pricing
 * Payment plan system attached to productVariant (e-commerce atomic unit) with integrated
 * market/currency pricing eliminating productPrice redundancy. Supports sophisticated payment
 * strategies including one-time purchases, subscriptions, and usage-based billing within
 * organizational boundaries while maintaining creator economy revenue attribution workflows.
 *
 * @designPattern CTI + Integrated Pricing + Translation + Multi-Tenant + Creator Attribution
 * - Variant-Level Attachment: Payment plans define HOW customers pay for specific product variants
 * - Integrated Pricing: Market/currency pricing built directly into payment plans
 * - CTI Specialization: One-time, subscription, usage-based extensions with type-specific features
 * - Creator Attribution: Revenue tracking for instructor attribution and organizational analytics
 * - No ProductPrice: Eliminates redundant pricing tables for simplified architecture
 *
 * @integrationPoints
 * - ProductVariant Integration: Payment strategies attached to e-commerce foundation
 * - Organizational Revenue: Creator economy revenue sharing and instructor attribution
 * - Multi-Currency Commerce: International market expansion with currency localization
 * - Customer Lifecycle: Subscription management and access control workflows
 * - Translation System: Localized payment marketing for international expansion
 *
 * @businessValue
 * Enables organizations to implement sophisticated monetization strategies for their product
 * variants while maintaining clear creator attribution, supporting international markets,
 * and providing comprehensive subscription lifecycle management for modern e-commerce.
 *
 * @scalingDesign
 * CTI pattern enables adding new payment types (freemium, corporate, enterprise) without
 * affecting existing payment workflows. Variant-level attachment scales with product catalog
 * growth while maintaining consistent pricing architecture across all product types.
 */

import { eq, isNotNull, isNull } from "drizzle-orm";
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

import { createdAt, id, table, updatedAt } from "../../_utils/helpers.js";
import { currency } from "../../currency-and-market/schema.js";
import {
	organization,
	organizationMarket,
	organizationMember,
	organizationPricingZone,
} from "../../organization/schema.js";
import { seoMetadata } from "../../seo/schema.js";
import { user } from "../../user/schema.js";
import { productVariant } from "../schema.js";

// -------------------------------------
// PAYMENT PLAN ENUMS
// -------------------------------------

/**
 * Payment Plan Types - E-commerce Monetization Strategies
 *
 * @businessLogic Organizations can offer different payment approaches for their product variants:
 * - one_time: Traditional e-commerce purchase with immediate access (courses, digital products)
 * - subscription: Recurring billing for continued access (SaaS, premium memberships)
 * - usage_based: Pay-per-consumption billing (API calls, content downloads, processing time)
 */
export const paymentPlanTypeEnum = pgEnum("payment_plan_type", [
	"one_time",
	"subscription",
	"usage_based",
]);

/**
 * Billing Intervals - Recurring Payment Frequency
 *
 * @businessLogic Subscription and usage billing cycle options:
 * - daily: Short-term access or promotional campaigns
 * - weekly: Weekly subscription cycles for intensive programs
 * - monthly: Most common subscription model for ongoing access
 * - quarterly: 3-month billing cycles for seasonal programs
 * - yearly: Annual subscriptions typically offering cost savings
 */
export const billingIntervalEnum = pgEnum("billing_interval", [
	"daily",
	"weekly",
	"monthly",
	"quarterly",
	"yearly",
]);

/**
 * Subscription Status - Customer Subscription Lifecycle
 *
 * @businessLogic Subscription state management for access control and billing:
 * - incomplete: Payment method setup in progress, no access granted
 * - incomplete_expired: Payment setup failed or expired, cleanup required
 * - trialing: Free trial period active, access granted but no billing
 * - active: Active subscription with valid payment and full access
 * - past_due: Payment failed but grace period access maintained
 * - canceled: Subscription canceled, access until current period ends
 * - unpaid: Multiple payment failures, access suspended
 * - paused: Temporarily suspended subscription with access preserved
 */
export const subscriptionStatusEnum = pgEnum("subscription_status", [
	"incomplete",
	"incomplete_expired",
	"trialing",
	"active",
	"past_due",
	"canceled",
	"unpaid",
	"paused",
]);

/**
 * Usage Types - Measurable Consumption Metrics
 *
 * @businessLogic Different consumption patterns for usage-based billing:
 * - api_calls: API access billing for developer-focused products
 * - downloads: Download count billing for digital content
 * - storage_usage: Storage space consumption for content hosting
 * - bandwidth_usage: Data transfer consumption for media delivery
 * - course_completions: Educational completion billing (when product.type = 'course')
 * - lesson_views: Content consumption billing for educational products
 * - processing_time: Computation time billing for service-based products
 */
export const usageTypeEnum = pgEnum("usage_type", [
	"api_calls",
	"downloads",
	"storage_usage",
	"bandwidth_usage",
	"course_completions",
	"lesson_views",
	"processing_time",
]);

/**
 * Usage Pricing Models - Consumption-to-Revenue Strategies
 *
 * @businessLogic How usage metrics translate to billing amounts:
 * - per_unit: Fixed price per individual usage unit (simple linear pricing)
 * - tiered: Different prices for different usage volume tiers (volume incentives)
 * - volume: Bulk pricing based on total usage volume (enterprise scaling)
 */
export const usagePricingModelEnum = pgEnum("usage_pricing_model", [
	"per_unit",
	"tiered",
	"volume",
]);

// -------------------------------------
// VARIANT PAYMENT PLANS (WITH INTEGRATED PRICING)
// -------------------------------------

/**
 * Product Variant Payment Plan - Integrated Payment Strategy with Pricing
 *
 * @businessLogic Payment plans define HOW customers pay for specific product variants
 * with integrated market/currency pricing, eliminating the need for separate productPrice
 * tables. Combines payment strategy (one-time, subscription, usage) with regional pricing
 * in a single coherent system for simplified e-commerce management.
 *
 * @variantLevelAttachment Payment plans are variant-specific because variants define WHAT
 * customers purchase (features, access levels) while payment plans define HOW they pay for it.
 * This separation enables sophisticated pricing strategies with multiple payment options per variant.
 *
 * @integratedPricing Includes all market/currency pricing features directly in payment plans,
 * eliminating productPrice table redundancy and simplifying pricing management workflows.
 * Regional pricing, currency support, tax rates, and promotional pricing all integrated.
 *
 * @organizationalRevenue Revenue tracking supports creator economy workflows with instructor
 * attribution and organizational analytics for comprehensive financial reporting and
 * creator compensation calculations.
 */
export const productVariantPaymentPlan = table(
	"product_variant_payment_plan",
	{
		id,

		/**
		 * @variantIntegration Product variant this payment plan applies to
		 * @businessRule Multiple payment strategies per variant enable pricing tier flexibility
		 */
		variantId: text("variant_id")
			.notNull()
			.references(() => productVariant.id),

		/**
		 * @organizationScope Organization managing this payment strategy
		 * @multiTenant Enables independent organizational payment plan management
		 */
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),

		/**
		 * @ctiDiscriminator Payment type determines specialized table for type-specific features
		 * @performanceCritical Indexed for fast type-specific query routing
		 */
		type: paymentPlanTypeEnum("type").notNull(),

		// Plan Identity and Marketing
		name: text("name").notNull(), // "Monthly Premium", "One-Time Basic", "Pro Annual"
		slug: text("slug").notNull(), // "monthly-premium", "one-time-basic", "pro-annual"

		// Tier Management (E-commerce Best Practices)
		/**
		 * @businessRule Default plan shown first in pricing displays and checkout flows
		 * @constraint Exactly one default plan per variant enforced by unique index
		 */
		isDefault: boolean("is_default").default(false),

		/**
		 * @marketingStrategy Highlighted plan in pricing tables (typically "best value")
		 * @conversionOptimization Draws customer attention to preferred monetization tier
		 */
		isFeatured: boolean("is_featured").default(false),

		/**
		 * @displayOrder Controls pricing table sequence for optimal conversion flow
		 */
		sortOrder: integer("sort_order").default(0),

		// Integrated Market/Currency Pricing (Replaces ProductPrice)
		/**
		 * @regionalPricing Optional market for regional pricing strategies
		 * @businessRule null = global pricing, marketId = region-specific pricing
		 */
		marketId: text("market_id").references(() => organizationMarket.id),

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
		compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),

		/**
		 * @taxation Tax rate for this payment plan region/market
		 * @legalCompliance Required for proper tax calculation and reporting
		 */
		taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),

		/**
		 * @pricingZoneOverride Optional pricing zone override for specialized regional pricing
		 * @businessFlexibility Enables complex regional pricing strategies
		 */
		pricingZoneId: text("pricing_zone_id").references(() => organizationPricingZone.id),

		// Payment Plan Features
		/**
		 * @featureControl JSON defining payment plan specific capabilities and limitations
		 * @businessFlexibility Enables sophisticated feature differentiation between payment tiers
		 * @courseExample {
		 *   "support_level": "priority",
		 *   "max_concurrent_access": 3,
		 *   "download_resources": true,
		 *   "certificate_eligible": true,
		 *   "instructor_interaction": "1on1"
		 * }
		 */
		features: jsonb("features"),

		// Plan Validity and Management
		/**
		 * @businessRule Controls plan availability for new purchases
		 * @operationalControl Allows disabling plans without deletion for lifecycle management
		 */
		isActive: boolean("is_active").default(true),

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
		 * @extensibility Additional payment plan metadata for integrations and analytics
		 */
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Business Constraints
		uniqueIndex("uq_variant_payment_plan_slug").on(t.variantId, t.slug),
		uniqueIndex("uq_variant_payment_plan_default")
			.on(t.variantId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Market/Currency Pricing Constraints (Integrated from ProductPrice)
		uniqueIndex("uq_variant_plan_market_currency")
			.on(t.variantId, t.type, t.marketId, t.currencyCode)
			.where(isNotNull(t.marketId)),
		uniqueIndex("uq_variant_plan_global_currency")
			.on(t.variantId, t.type, t.currencyCode)
			.where(isNull(t.marketId)),

		// Performance Indexes
		index("idx_variant_payment_plan_type").on(t.type), // CTI performance critical
		index("idx_variant_payment_plan_variant").on(t.variantId),
		index("idx_variant_payment_plan_org").on(t.organizationId),
		index("idx_variant_payment_plan_market").on(t.marketId),
		index("idx_variant_payment_plan_currency").on(t.currencyCode),
		index("idx_variant_payment_plan_active").on(t.isActive),
		index("idx_variant_payment_plan_featured").on(t.isFeatured),
		index("idx_variant_payment_plan_dates").on(t.startsAt, t.endsAt),
		index("idx_variant_payment_plan_zone").on(t.pricingZoneId),
		index("idx_variant_payment_plan_price").on(t.price), // Revenue analytics
	],
);

/**
 * Product Variant Payment Plan Translation - Internationalization Support
 *
 * @businessLogic Multi-language support for payment plan marketing content enabling
 * organizations to localize pricing strategies for different markets and regions.
 * Essential for international expansion and region-specific conversion optimization.
 *
 * @translationPattern Follows established schema translation pattern with locale-specific
 * content management and default locale enforcement for consistent internationalization.
 *
 * @marketingLocalization Enables region-specific payment plan names, descriptions, and
 * promotional messaging for improved conversion rates in international markets while
 * maintaining consistent underlying pricing and business logic.
 *
 * @seoIntegration Optional SEO metadata enables payment plan landing pages and search
 * optimization for region-specific pricing campaigns and promotional content.
 */
export const productVariantPaymentPlanTranslation = table(
	"product_variant_payment_plan_translation",
	{
		id,

		/**
		 * @translationTarget Payment plan this localized content applies to
		 * @cascadeDelete Translation content removed when payment plan is deleted
		 */
		planId: text("plan_id")
			.notNull()
			.references(() => productVariantPaymentPlan.id, { onDelete: "cascade" }),

		/**
		 * @localizationContext Target locale for this translation content
		 * @businessRule Supports region-specific payment plan marketing strategies
		 */
		locale: text("locale").notNull(),

		/**
		 * @translationDefault Primary translation used when locale-specific content unavailable
		 * @constraint Exactly one default translation per payment plan enforced by unique index
		 */
		isDefault: boolean("is_default").default(false),

		// Localized Marketing Content
		name: text("name"), // Localized plan name for regional marketing effectiveness
		description: text("description"), // Localized plan description and value proposition

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
		uniqueIndex("uq_variant_payment_plan_translation").on(t.planId, t.locale),
		uniqueIndex("uq_variant_payment_plan_translation_default")
			.on(t.planId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index("idx_variant_payment_plan_translation_locale").on(t.locale),
		index("idx_variant_payment_plan_translation_seo").on(t.seoMetadataId),
	],
);

// -------------------------------------
// CTI SPECIALIZATION TABLES
// -------------------------------------

/**
 * One-Time Payment Plan - Traditional E-commerce Purchase Model
 *
 * @businessLogic Single payment product purchases with configurable access duration
 * enabling traditional e-commerce patterns where customers pay once for product access.
 * Supports both lifetime access models and time-limited access for various business strategies.
 *
 * @ctiSpecialization Extends productVariantPaymentPlan with one-time purchase specific
 * attributes including access duration management, gift purchase capabilities, and
 * transfer policies without recurring billing complexity.
 *
 * @ecommerceFeatures Gift purchasing and account transfer capabilities expand market
 * reach and support common e-commerce scenarios including corporate training purchases
 * and family sharing arrangements.
 *
 * @accessManagement Configurable access duration supports both permanent ownership
 * models and rental-style time-limited access patterns for different monetization strategies.
 */
export const oneTimePaymentPlan = table(
	"one_time_payment_plan",
	{
		/**
		 * @ctiReference Links to base payment plan for common attributes and pricing
		 * @foreignKey Primary key serves as foreign key to parent CTI table
		 */
		planId: text("plan_id")
			.primaryKey()
			.references(() => productVariantPaymentPlan.id),

		/**
		 * @accessControl Days of access after purchase (null = lifetime access)
		 * @businessFlexibility Enables time-limited access models for rental or subscription-like experiences
		 */
		accessDurationDays: integer("access_duration_days"),

		/**
		 * @accessControl Simplified boolean for lifetime access marketing and logic
		 * @marketingClarity Clear messaging distinction between lifetime and time-limited plans
		 */
		isLifetimeAccess: boolean("is_lifetime_access").default(true),

		/**
		 * @ecommerceFeature Allows customers to purchase products for other recipients
		 * @marketExpansion Enables gift economy and viral growth through gift purchases
		 */
		allowGifting: boolean("allow_gifting").default(false),

		/**
		 * @accessControl Whether product access can be transferred between accounts
		 * @businessFlexibility Useful for corporate training accounts and family sharing scenarios
		 */
		isTransferable: boolean("is_transferable").default(false),

		/**
		 * @abuseProtection Maximum purchases per user to prevent system gaming
		 * @businessRule null = unlimited, integer = specific limit per customer
		 */
		maxPurchasesPerUser: integer("max_purchases_per_user"),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Performance indexes for one-time payment management
		index("idx_one_time_plan_lifetime").on(t.isLifetimeAccess),
		index("idx_one_time_plan_duration").on(t.accessDurationDays),
		index("idx_one_time_plan_gifting").on(t.allowGifting),
		index("idx_one_time_plan_transferable").on(t.isTransferable),
	],
);

/**
 * One-Time Payment Plan Translation - Internationalization Support
 *
 * @businessLogic Multi-language support for one-time payment plan specific content
 * including gift messaging, access policies, and transfer terms for different markets
 * and regional legal requirements.
 *
 * @translationPattern Consistent with established schema translation architecture
 * for predictable internationalization workflows.
 */
export const oneTimePaymentPlanTranslation = table(
	"one_time_payment_plan_translation",
	{
		id,

		planId: text("plan_id")
			.notNull()
			.references(() => oneTimePaymentPlan.planId, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// Localized One-Time Specific Content
		giftMessage: text("gift_message"), // Localized gift purchase messaging and instructions
		accessDescription: text("access_description"), // Localized access duration explanation
		transferPolicy: text("transfer_policy"), // Localized transfer policy and procedures

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_one_time_plan_translation").on(t.planId, t.locale),
		uniqueIndex("uq_one_time_plan_translation_default")
			.on(t.planId, t.isDefault)
			.where(eq(t.isDefault, true)),

		index("idx_one_time_plan_translation_locale").on(t.locale),
	],
);

/**
 * Subscription Payment Plan - Recurring Billing Model
 *
 * @businessLogic Recurring billing product subscriptions supporting modern SaaS-style
 * monetization where customers pay monthly/yearly for continued access. Includes comprehensive
 * subscription lifecycle management with trial periods and setup fees for customer acquisition.
 *
 * @ctiSpecialization Extends productVariantPaymentPlan with subscription-specific billing
 * attributes including billing intervals, trial period management, and setup fee configuration
 * for sophisticated recurring revenue optimization.
 *
 * @subscriptionEconomy Supports modern subscription business models with trial-to-paid
 * conversion workflows, flexible billing cycles, and setup fees for additional revenue streams.
 *
 * @customerAcquisition Trial period capabilities reduce purchase friction and enable
 * customers to experience product value before payment commitment.
 */
export const subscriptionPaymentPlan = table(
	"subscription_payment_plan",
	{
		/**
		 * @ctiReference Links to base payment plan for common attributes and pricing
		 * @foreignKey Primary key serves as foreign key to parent CTI table
		 */
		planId: text("plan_id")
			.primaryKey()
			.references(() => productVariantPaymentPlan.id),

		/**
		 * @billingCycle How frequently organization charges subscribers
		 * @cashFlowImpact Determines revenue timing and customer payment preferences
		 */
		billingInterval: billingIntervalEnum("billing_interval").notNull(),

		/**
		 * @billingCycle Multiplier for billing interval enabling custom periods
		 * @businessFlexibility intervalCount=3 with monthly = quarterly billing
		 */
		intervalCount: integer("interval_count").default(1),

		/**
		 * @customerAcquisition Free trial period before first billing cycle
		 * @conversionStrategy Reduces purchase friction and increases trial-to-paid conversion
		 */
		trialPeriodDays: integer("trial_period_days").default(0),

		/**
		 * @revenueStrategy One-time fee charged at subscription start
		 * @additionalRevenue Setup fees provide additional revenue beyond recurring charges
		 */
		setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0"),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Performance indexes for subscription management
		index("idx_subscription_plan_interval").on(t.billingInterval),
		index("idx_subscription_plan_count").on(t.intervalCount),
		index("idx_subscription_plan_trial").on(t.trialPeriodDays),
		index("idx_subscription_plan_setup_fee").on(t.setupFee),
	],
);

/**
 * Subscription Payment Plan Translation - Internationalization Support
 *
 * @businessLogic Multi-language support for subscription payment plan specific content
 * including billing descriptions, trial messaging, and cancellation policies for different
 * markets and regional legal compliance requirements.
 *
 * @translationPattern Consistent with established schema translation architecture
 * for predictable internationalization workflows.
 */
export const subscriptionPaymentPlanTranslation = table(
	"subscription_payment_plan_translation",
	{
		id,

		planId: text("plan_id")
			.notNull()
			.references(() => subscriptionPaymentPlan.planId, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// Localized Subscription Specific Content
		billingDescription: text("billing_description"), // Localized billing cycle explanation
		trialMessage: text("trial_message"), // Localized trial period messaging and terms
		cancellationPolicy: text("cancellation_policy"), // Localized cancellation policy and procedures

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_subscription_plan_translation").on(t.planId, t.locale),
		uniqueIndex("uq_subscription_plan_translation_default")
			.on(t.planId, t.isDefault)
			.where(eq(t.isDefault, true)),

		index("idx_subscription_plan_translation_locale").on(t.locale),
	],
);

/**
 * Usage-Based Payment Plan - Consumption-Based Billing Model
 *
 * @businessLogic Pay-per-consumption product billing based on measurable usage metrics
 * enabling sophisticated revenue optimization aligned with actual customer engagement.
 * Supports complex pricing models from simple per-unit charges to tiered volume pricing.
 *
 * @ctiSpecialization Extends productVariantPaymentPlan with usage tracking and variable
 * pricing attributes for consumption-based billing workflows and metered access control.
 *
 * @usageMetricsSystem Flexible usage type system supports various measurable customer
 * interactions enabling precise value-based pricing models aligned with product consumption.
 *
 * @variablePricingStrategy Multiple pricing models from linear per-unit to complex tiered
 * structures with freemium allowances and minimum charges for sophisticated monetization.
 *
 * @revenueOptimization Usage-based billing enables revenue scaling with customer success
 * while providing predictable minimum revenue through freemium models and base charges.
 */
export const usageBasedPaymentPlan = table(
	"usage_based_payment_plan",
	{
		/**
		 * @ctiReference Links to base payment plan for common attributes and pricing
		 * @foreignKey Primary key serves as foreign key to parent CTI table
		 */
		planId: text("plan_id")
			.primaryKey()
			.references(() => productVariantPaymentPlan.id),

		/**
		 * @usageMetric Measurable customer action triggering billing charges
		 * @businessModel Defines unit of value for usage-based pricing strategy
		 */
		usageType: usageTypeEnum("usage_type").notNull(),

		/**
		 * @pricingStrategy How usage metrics translate to billing amounts
		 * @revenueOptimization Different models enable various usage-based monetization approaches
		 */
		pricingModel: usagePricingModelEnum("pricing_model").notNull(),

		/**
		 * @tieredPricing Complex pricing structure for volume discounts and usage incentives
		 * @businessStrategy Encourages higher usage through bulk pricing benefits
		 * @example [
		 *   {"from": 0, "to": 100, "price": 1.00, "name": "Starter Tier"},
		 *   {"from": 101, "to": 1000, "price": 0.75, "name": "Growth Tier"},
		 *   {"from": 1001, "to": null, "price": 0.50, "name": "Enterprise Tier"}
		 * ]
		 */
		pricingTiers: jsonb("pricing_tiers"),

		/**
		 * @billingCycle How often usage is calculated and charged
		 * @operationalEfficiency Most usage billing is monthly for processing efficiency
		 */
		billingPeriod: billingIntervalEnum("billing_period").default("monthly"),

		/**
		 * @revenueProtection Minimum charge per billing period regardless of usage
		 * @businessModel Ensures baseline revenue even during low consumption periods
		 */
		minimumCharge: decimal("minimum_charge", { precision: 12, scale: 2 }).default("0"),

		/**
		 * @freemiumModel Free usage allowance before billing charges begin
		 * @customerAcquisition Enables product trial and reduces adoption friction
		 */
		includedUsage: integer("included_usage").default(0),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Performance indexes for usage-based billing management
		index("idx_usage_plan_type").on(t.usageType),
		index("idx_usage_plan_model").on(t.pricingModel),
		index("idx_usage_plan_period").on(t.billingPeriod),
		index("idx_usage_plan_minimum").on(t.minimumCharge),
	],
);

/**
 * Usage-Based Payment Plan Translation - Internationalization Support
 *
 * @businessLogic Multi-language support for usage-based payment plan specific content
 * including usage descriptions, pricing explanations, and billing policies for different
 * markets and complex usage model education requirements.
 *
 * @translationPattern Consistent with established schema translation architecture
 * for predictable internationalization workflows.
 */
export const usageBasedPaymentPlanTranslation = table(
	"usage_based_payment_plan_translation",
	{
		id,

		planId: text("plan_id")
			.notNull()
			.references(() => usageBasedPaymentPlan.planId, { onDelete: "cascade" }),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// Localized Usage-Based Specific Content
		usageDescription: text("usage_description"), // Localized usage metric explanation
		pricingExplanation: text("pricing_explanation"), // Localized pricing model description
		billingPolicy: text("billing_policy"), // Localized billing policy and calculation methods

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_usage_plan_translation").on(t.planId, t.locale),
		uniqueIndex("uq_usage_plan_translation_default")
			.on(t.planId, t.isDefault)
			.where(eq(t.isDefault, true)),

		index("idx_usage_plan_translation_locale").on(t.locale),
	],
);

// -------------------------------------
// USER SUBSCRIPTIONS (CUSTOMER PURCHASE INSTANCES)
// -------------------------------------

/**
 * User Subscription - Customer Payment Instance and Access Management
 *
 * @businessLogic Customer subscription instances tracking how users purchase and access
 * organizational payment plans. Manages subscription lifecycle, access control, and
 * revenue tracking completely separate from how organizations create pricing strategies.
 *
 * @accessControl Links customer payment status to product content access enabling
 * dynamic content availability based on subscription status, payment plan features,
 * and organizational access policies for comprehensive customer experience management.
 *
 * @subscriptionLifecycle Tracks complete customer journey from purchase through active
 * usage to cancellation providing comprehensive subscription management capabilities
 * for customer service, retention workflows, and organizational analytics.
 *
 * @paymentGatewayIntegration External subscription IDs link internal subscription
 * management to payment processors enabling automated subscription state synchronization
 * and billing cycle management through webhook integration.
 *
 * @organizationalRevenue Revenue tracking supports creator economy workflows with
 * instructor attribution calculations and organizational financial reporting for
 * comprehensive creator compensation and business analytics.
 *
 * @memberContextSupport Supports both organization members and external customers
 * enabling internal team subscriptions alongside external customer sales workflows
 * for comprehensive organizational subscription management.
 */
export const userSubscription = table(
	"user_subscription",
	{
		id,

		/**
		 * @customerReference Customer who owns this subscription instance
		 * @accessControl Primary relationship for content access permissions and customer service
		 */
		userId: text("user_id")
			.notNull()
			.references(() => user.id),

		/**
		 * @paymentPlanReference Organization's payment plan this subscription follows
		 * @businessRule Determines pricing, billing cycle, features, and access permissions
		 */
		planId: text("plan_id")
			.notNull()
			.references(() => productVariantPaymentPlan.id),

		/**
		 * @organizationScope Organization context for this subscription
		 * @multiTenant Enables organization-specific subscription management and reporting
		 */
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),

		/**
		 * @memberContext Optional organization member context for internal subscriptions
		 * @businessRule When present, indicates internal organizational member subscription
		 */
		organizationMemberId: text("organization_member_id").references(() => organizationMember.id),

		/**
		 * @subscriptionLifecycle Current subscription state for access control
		 * @accessControl Determines customer's access to product content and features
		 */
		status: subscriptionStatusEnum("status").default("active"),

		// Access Control and Timing
		/**
		 * @accessControl When customer first gained access to subscribed content
		 * @customerService Essential for support queries about access history
		 */
		accessGrantedAt: timestamp("access_granted_at").defaultNow(),

		/**
		 * @accessControl When product access expires for this subscription
		 * @businessRule null = lifetime access, date = subscription expiration
		 */
		accessExpiresAt: timestamp("access_expires_at"),

		// Financial Tracking and Creator Attribution
		/**
		 * @revenueTracking Total amount customer has paid for this subscription
		 * @creatorEconomy Basis for instructor revenue sharing and organizational analytics
		 */
		totalPaid: decimal("total_paid", { precision: 12, scale: 2 }).default("0"),

		/**
		 * @currencyTracking Currency used for this subscription billing
		 * @internationalCommerce Essential for multi-currency revenue tracking and reporting
		 */
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),

		// Payment Gateway Integration
		/**
		 * @paymentGateway External subscription ID from payment processor
		 * @webhookIntegration Links internal subscription management to payment processor
		 */
		externalSubscriptionId: text("external_subscription_id"),

		/**
		 * @paymentGateway External customer ID from payment processor
		 * @billingIntegration Links to payment gateway customer record for billing management
		 */
		externalCustomerId: text("external_customer_id"),

		/**
		 * @extensibility Additional subscription metadata for analytics and integrations
		 * @businessIntelligence May contain usage tracking, preferences, or integration data
		 */
		metadata: jsonb("metadata"),

		createdAt,
		updatedAt,
	},
	(t) => [
		// Performance indexes for subscription management
		index("idx_user_subscription_user").on(t.userId),
		index("idx_user_subscription_plan").on(t.planId),
		index("idx_user_subscription_org").on(t.organizationId),
		index("idx_user_subscription_status").on(t.status),
		index("idx_user_subscription_member").on(t.organizationMemberId),
		index("idx_user_subscription_access").on(t.accessExpiresAt),
		index("idx_user_subscription_external").on(t.externalSubscriptionId),
		index("idx_user_subscription_currency").on(t.currencyCode),

		// Revenue Analytics Indexes
		index("idx_user_subscription_revenue").on(t.totalPaid, t.currencyCode),
		index("idx_user_subscription_org_revenue").on(t.organizationId, t.totalPaid),
	],
);
