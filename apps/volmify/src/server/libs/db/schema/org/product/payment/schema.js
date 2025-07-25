import { eq, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { numericCols, sharedCols, table, temporalCols, textCols } from "../../../_utils/helpers.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";
import { orgTaxCategory } from "../../tax/schema.js";
import { orgProductVariant } from "../schema.js";

// -------------------------------------
// PAYMENT PLAN ENUMS
// -------------------------------------

/**
 * Payment Plan Types - E-commerce Monetization Strategies
 *
 * @businessLogic Orgs can offer different payment approaches for their product variants:
 * - one_time: Traditional e-commerce purchase with immediate access (courses, digital products)
 * - subscription: Recurring billing for continued access (SaaS, premium memberships)
 * - usage_based: Pay-per-consumption billing (API calls, content downloads, processing time)
 */
export const orgProductVariantPaymentTypeEnum = pgEnum(`${orgTableName}_payment_plan_type`, [
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
export const orgProductVariantPaymentBillingIntervalEnum = pgEnum(
	`${orgTableName}_billing_interval`,
	["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
);

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
export const orgProductVariantPaymentSubscriptionStatusEnum = pgEnum(
	`${orgTableName}_subscription_status`,
	[
		"incomplete",
		"incomplete_expired",
		"trialing",
		"active",
		"past_due",
		"canceled",
		"unpaid",
		"paused",
	],
);

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
export const orgProductVariantPaymentUsageTypeEnum = pgEnum(`${orgTableName}_usage_type`, [
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
export const orgProductVariantPaymentUsagePricingModelEnum = pgEnum(
	`${orgTableName}_usage_pricing_model`,
	["per_unit", "tiered", "volume"],
);

// -------------------------------------
// VARIANT PAYMENT PLANS (WITH INTEGRATED PRICING)
// -------------------------------------

const orgProductVariantPaymentPlanTableName = `${orgTableName}_product_variant_payment_plan`;
/**
 * Product Variant Payment Plan - Integrated Payment Strategy with Pricing
 *
 * @businessLogic Payment plans define HOW customers pay for specific product variants
 * with integrated market/currency pricing, eliminating the need for separate productPrice
 * tables. Combines payment strategy (one-time, subscription, usage) with regional pricing
 * in a single coherent system for simplified e-commerce management.
 *
 * @abacRole Plan creation/update restricted to org owners/managers
 * @permissionContext Variant scope for plan visibility and org boundaries
 *
 * @variantLevelAttachment Payment plans are variant-specific because variants define WHAT
 * customers purchase (features, access levels) while payment plans define HOW they pay for it.
 * This separation enables sophisticated pricing strategies with multiple payment options per variant.
 *
 * @integratedPricing Includes all market/currency pricing features directly in payment plans,
 * eliminating productPrice table redundancy and simplifying pricing management workflows.
 * Regional pricing, currency support, tax rates, and promotional pricing all integrated.
 *
 * @orgalRevenue Revenue tracking supports creator economy workflows with Org-member
 * attribution and org analytics for comprehensive financial reporting and
 * Org-member compensation calculations.
 */
export const orgProductVariantPaymentPlan = table(
	orgProductVariantPaymentPlanTableName,
	{
		id: textCols.id().notNull(),

		/**
		 * @integrationContext Binds plan to specific purchasable entity
		 * @businessRule Multiple payment strategies per variant enable pricing tier flexibility
		 */
		variantId: textCols
			.idFk("variant_id")
			.notNull()
			.references(() => orgProductVariant.id),

		/**
		 * @abacRole Plan creation/update restricted to org owners/managers
		 * @multiTenant Separates plan configuration per org boundary
		 */
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * This is an optional tax category connection that overrides the one on the `orgProductVariant`
		 */
		taxCategoryId: textCols.idFk("tax_category_id").references(() => orgTaxCategory.id),

		/**
		 * @ctiDiscriminator Payment type determines specialized table for type-specific features
		 * @templatePattern Determines downstream plan table extensions
		 */
		type: orgProductVariantPaymentTypeEnum("type").notNull(),

		name: textCols.title().notNull(),
		slug: textCols.slug().notNull(),

		/**
		 * @businessRule Default plan shown first in pricing displays and checkout flows
		 * @onboardingPattern Ensures a single visible option per variant
		 */
		isDefault: sharedCols.isDefault(),

		/**
		 * @marketingStrategy Highlighted plan in pricing tables (typically "best value")
		 * @conversionOptimization Draws customer attention to preferred monetization tier
		 */
		isFeatured: sharedCols.isFeatured(),

		/**
		 * @uiControl Controls pricing table sequence for optimal conversion flow
		 */
		sortOrder: numericCols.sortOrder(),

		/**
		 * @accessControl Whether product access can be transferred between accounts
		 * @businessFlexibility Useful for corporate training accounts and family sharing scenarios
		 */
		isTransferable: boolean("is_transferable").default(false),

		// /**
		//  * @pricingZoneOverride Optional pricing zone override for specialized regional pricing
		//  * @businessFlexibility Enables complex regional pricing strategies
		//  */
		// pricingZoneId: textCols.idFk("pricing_zone_id").references(() => orgPricingZone.id),

		// /**
		//  * @regionalPricing Optional market for regional pricing strategies
		//  * @businessRule null = global pricing, marketId = region-specific pricing
		//  * @multiRegionSupport Enables localized pricing overrides
		//  */
		// marketId: textCols.idFk("market_id").references(() => orgMarket.id),

		/**
		 * @featureControl JSON defining payment plan specific capabilities and limitations
		 * @businessFlexibility Enables sophisticated feature differentiation between payment tiers
		 * @templatePattern Extensible per-plan entitlements
		 * @permissionResolution Drives runtime access decisions
		 */
		features: jsonb("features"),

		/**
		 * @businessRule Controls plan availability for new purchases
		 * @workflowControl Allows plan disabling without deletion for lifecycle management
		 */
		isActive: sharedCols.isActive(),

		/**
		 * @campaignManagement When this pricing becomes effective
		 * @promotionalStrategy Enables scheduled pricing changes and campaigns
		 */
		startsAt: temporalCols.business.startsAt().defaultNow(),

		/**
		 * @campaignManagement When this pricing expires (null = permanent)
		 * @promotionalStrategy Supports time-limited promotional pricing
		 */
		endsAt: temporalCols.business.endsAt(),

		// /**
		//  * @extensibility Additional payment plan metadata for integrations and analytics
		//  * @integrationContext Third-party platform support
		//  */
		// metadata: jsonb("metadata"),

		/**
		 * @accessControl Access tier granted by this payment plan
		 * @businessRule Higher payment commitment = higher access tier
		 * @contentGating Determines which course modules/sections/lessons user can access
		 * @monetizationStrategy Enables content-based pricing differentiation
		 */
		accessTier: integer("access_tier").default(1).notNull(),

		/**
		 * @ecommerceFeature Allows customers to purchase products for other recipients
		 * @marketExpansion Enables gift economy and viral growth through gift purchases
		 * @giftingEnabled Determines whether users can purchase for others
		 */
		allowGifting: boolean("allow_gifting").default(false),

		// /**
		//  * @contentAccess JSON defining course content access rules for this variant
		//  * @businessFlexibility Enables sophisticated course progression and gating rules
		//  * @instructorControl Allows instructors to define variant-specific content access
		//  */
		// courseAccessRules: jsonb("course_access_rules"),
		// // Example: {
		// //   "unlock_all_modules": false,
		// //   "modules_unlock_order": "sequential", // or "any_order"
		// //   "quiz_required_for_progression": true,
		// //   "downloadable_resources": true,
		// //   "instructor_qa_access": true,
		// //   "certificate_eligible": true
		// // }

		createdAt: temporalCols.activity.completedAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		// Business Constraints
		uniqueIndex(`uq_${orgProductVariantPaymentPlanTableName}_slug`).on(t.variantId, t.slug),
		uniqueIndex(`uq_${orgProductVariantPaymentPlanTableName}_default`)
			.on(t.variantId, t.isDefault)
			.where(eq(t.isDefault, true)),

		// Performance Indexes
		index(`idx_${orgProductVariantPaymentPlanTableName}_type`).on(t.type), // CTI performance critical
		index(`idx_${orgProductVariantPaymentPlanTableName}_variant_id`).on(t.variantId),
		index(`idx_${orgProductVariantPaymentPlanTableName}_org_id`).on(t.orgId),
		index(`idx_${orgProductVariantPaymentPlanTableName}_tax_category_id`).on(t.taxCategoryId),
		// index(`idx_${orgProductVariantPaymentPlanTableName}_currency`).on(
		// 	t.currencyCode,
		// ),
		index(`idx_${orgProductVariantPaymentPlanTableName}_active`).on(t.isActive),
		index(`idx_${orgProductVariantPaymentPlanTableName}_featured`).on(t.isFeatured),
		index(`idx_${orgProductVariantPaymentPlanTableName}_dates`).on(t.startsAt, t.endsAt),
		// index(`idx_${orgProductVariantPaymentPlanTableName}_price`).on(t.price), // Revenue analytics
		// index(`idx_${orgProductVariantPaymentPlanTableName}_compare_at_price`).on(
		// 	t.compareAtPrice,
		// ),
		index(`idx_${orgProductVariantPaymentPlanTableName}_is_transferable`).on(t.isTransferable),
		index(`idx_${orgProductVariantPaymentPlanTableName}_allow_gifting`).on(t.allowGifting),
		index(`idx_${orgProductVariantPaymentPlanTableName}_access_tier`).on(t.accessTier),
		index(`idx_${orgProductVariantPaymentPlanTableName}_sort_order`).on(t.sortOrder),
		index(`idx_${orgProductVariantPaymentPlanTableName}_features`).on(t.features),
		index(`idx_${orgProductVariantPaymentPlanTableName}_deleted_at`).on(t.deletedAt),
		index(`idx_${orgProductVariantPaymentPlanTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductVariantPaymentPlanTableName}_last_updated_at`).on(t.lastUpdatedAt),
		check("access_tier_range", sql`${t.accessTier} >= 0`),
	],
);

const orgProductVariantPaymentPlanI18nTableName = `${orgProductVariantPaymentPlanTableName}_i18n`;
/**
 * Product Variant Payment Plan Translation - Multi-language Payment Marketing
 *
 * @businessLogic Multi-language support for payment plan marketing content enabling
 * orgs to localize pricing strategies for different markets and regions.
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
 *
 * @abacRole Readable globally; write-scoped to org admins with pricing access
 * @permissionContext Translations scoped to org and tenant
 */
export const orgProductVariantPaymentPlanI18n = buildOrgI18nTable(
	orgProductVariantPaymentPlanI18nTableName,
)(
	{
		planId: textCols
			.idFk("plan_id")
			.references(() => orgProductVariantPaymentPlan.id)
			.notNull(),

		seoMetadataId: textCols
			.idFk("seo_metadata_id")
			.references(() => seoMetadata.id)
			.notNull(),

		name: textCols.title().notNull(),
		description: text("description"),

		/**
		 * @localizedContent Description of access duration
		 * @onboardingClarity Helps buyers understand ownership terms
		 */
		accessDescription: text("access_description"),

		/**
		 * @localizedContent Text shown to gift recipients
		 * @conversionStrategy Personalizes gifting experience
		 */
		giftMessage: text("gift_message"),

		/**
		 * @localizedContent Description of transfer eligibility
		 * @complianceContext Helps avoid support misunderstandings
		 */
		transferPolicy: text("transfer_policy"),
	},
	{
		fkKey: "planId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_seo_metadata_id`).on(t.seoMetadataId),
			index(`idx_${tableName}_plan_id`).on(t.planId),
			index(`idx_${tableName}_name`).on(t.name),
		],
	},
);

// -------------------------------------
// CTI SPECIALIZATION TABLES
// -------------------------------------

const orgProductVariantPaymentPlanOneTimeTypeTableName = `${orgProductVariantPaymentPlanTableName}_one_time_type`;
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
 *
 * @abacRole Scoped to vendor/org with payment plan write access
 * @entitlementScope Access duration drives unlock window logic
 */
export const orgProductVariantPaymentPlanOneTimeType = table(
	orgProductVariantPaymentPlanOneTimeTypeTableName,
	{
		/**
		 * @ctiReference Links to base payment plan for common attributes and pricing
		 */
		planId: textCols
			.idFk("plan_id")
			.primaryKey()
			.references(() => orgProductVariantPaymentPlan.id),

		/**
		 * @currencySupport Currency for this payment plan instance
		 * @internationalCommerce Required for all payment plans to support global expansion
		 */
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		/**
		 * @pricing Main price customers pay for this payment plan
		 * @revenueFoundation Core pricing amount for revenue calculations and billing
		 */
		price: numericCols.currency.price().notNull(),

		/**
		 * @promotionalPricing Original price for "save X%" marketing displays
		 * @marketingStrategy Shows discount value to increase conversion rates
		 */
		compareAtPrice: numericCols.currency.price(),

		// /**
		//  * @accessControl Days of access after purchase (null = lifetime access)
		//  * @businessFlexibility Enables time-limited access models for rental or subscription-like experiences
		//  * @entitlementScope Number of days user may access after purchase
		//  */
		// accessDurationDays: integer("access_duration_days"),

		// /**
		//  * @accessControl Simplified boolean for lifetime access marketing and logic
		//  * @marketingClarity Clear messaging distinction between lifetime and time-limited plans
		//  */
		// isLifetimeAccess: boolean("is_lifetime_access").default(true),

		/**
		 * @abuseProtection Maximum purchases per user to prevent system gaming
		 * @businessRule null = unlimited, integer = specific limit per customer
		 */
		maxPurchasesPerUser: integer("max_purchases_per_user"),

		createdAt: temporalCols.activity.completedAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		// Performance indexes for one-time payment management
		// index(
		// 	`idx_${orgProductVariantPaymentPlanOneTimeTypeTableName}_lifetime_access`,
		// ).on(t.isLifetimeAccess),
		// index(
		// 	`idx_${orgProductVariantPaymentPlanOneTimeTypeTableName}_access_duration_days`,
		// ).on(t.accessDurationDays),
		index(`idx_${orgProductVariantPaymentPlanOneTimeTypeTableName}_max_purchases`).on(
			t.maxPurchasesPerUser,
		),
		index(`idx_${orgProductVariantPaymentPlanOneTimeTypeTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgProductVariantPaymentPlanOneTimeTypeTableName}_last_updated_at`).on(
			t.lastUpdatedAt,
		),
	],
);

const orgProductVariantPaymentPlanSubscriptionTypeTableName = `${orgProductVariantPaymentPlanTableName}_subscription_type`;
export const orgProductVariantPaymentPlanSubscriptionTypeCustomBillingIntervalUnitEnum = pgEnum(
	`${orgTableName}_subscription_interval_count_unit`,
	["hours", "days", "weeks", "months", "quarters", "years"],
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
 *
 * @compensationModel Recurring revenue engine for instructors and orgs
 * @permissionContext Managed by org admins with variant access
 * @auditTrail Includes timestamps for usage analytics and plan lifecycle
 */
export const orgProductVariantPaymentPlanSubscriptionType = table(
	orgProductVariantPaymentPlanSubscriptionTypeTableName,
	{
		/**
		 * @ctiReference Links to base payment plan for common attributes and pricing
		 */
		planId: textCols
			.idFk("plan_id")
			.primaryKey()
			.references(() => orgProductVariantPaymentPlan.id),

		/**
		 * @currencySupport Currency for this payment plan instance
		 * @internationalCommerce Required for all payment plans to support global expansion
		 */
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		/**
		 * @pricing Main price customers pay for this payment plan
		 * @revenueFoundation Core pricing amount for revenue calculations and billing
		 */
		price: numericCols.currency.price().notNull(),

		/**
		 * @promotionalPricing Original price for "save X%" marketing displays
		 * @marketingStrategy Shows discount value to increase conversion rates
		 */
		compareAtPrice: numericCols.currency.price(),

		// Q: is the following needed even with the existing of the custom billing count and unit
		/**
		 * @billingCycle How frequently org charges subscribers
		 * @cashFlowModel Determines revenue timing and customer payment preferences
		 */
		billingInterval: orgProductVariantPaymentBillingIntervalEnum("billing_interval").notNull(),
		/**
		 * @billingCycle Multiplier for billing interval enabling custom periods
		 * @businessFlexibility intervalCount=3 with monthly = quarterly billing
		 */
		customBillingIntervalCount: integer("custom_billing_interval_count").default(1),
		/**
		 * Define the interval count measurement/unit
		 */
		customBillingIntervalUnit:
			orgProductVariantPaymentPlanSubscriptionTypeCustomBillingIntervalUnitEnum(
				"custom_billing_interval_unit",
			)
				.notNull()
				.default("months"),

		/**
		 * @customerAcquisition Free trial period before first billing cycle
		 * @conversionStrategy Reduces purchase friction and increases trial-to-paid conversion
		 */
		trialPeriodDays: integer("trial_period_days").default(0),

		/**
		 * @revenueStrategy One-time fee charged at subscription start
		 * @additionalRevenue Setup fees provide additional revenue beyond recurring charges
		 */
		setupFee: numericCols.currency.price().default("0"),

		createdAt: temporalCols.activity.completedAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		// Performance indexes for subscription management
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_billing_interval`).on(
			t.billingInterval,
		),
		index(
			`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_custom_billing_interval_count`,
		).on(t.customBillingIntervalCount),
		index(
			`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_custom_billing_interval_unit`,
		).on(t.customBillingIntervalUnit),
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_trial`).on(
			t.trialPeriodDays,
		),
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_setup_fee`).on(t.setupFee),
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_created_at`).on(
			t.createdAt,
		),
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_last_updated_at`).on(
			t.lastUpdatedAt,
		),
		index(`idx_${orgProductVariantPaymentPlanSubscriptionTypeTableName}_plan_id`).on(t.planId),
	],
);

const orgProductVariantPaymentPlanSubscriptionTypeI18nTableName = `${orgProductVariantPaymentPlanSubscriptionTypeTableName}_i18n`;
/**
 * Subscription Payment Plan Translation - Localized Subscription Content
 *
 * @businessLogic Multi-language support for subscription payment plan specific content
 * including billing descriptions, trial messaging, and cancellation policies for different
 * markets and regional legal compliance requirements.
 *
 * @translationPattern Consistent with established schema translation architecture
 * for predictable internationalization workflows.
 *
 * @abacRole Translations readable globally; write-scoped to org owners
 */
export const orgProductVariantPaymentPlanSubscriptionTypeI18n = buildOrgI18nTable(
	orgProductVariantPaymentPlanSubscriptionTypeI18nTableName,
)(
	{
		/**
		 * @translationTarget Target subscription plan
		 */
		planId: textCols
			.idFk("plan_id")
			.notNull()
			.references(() => orgProductVariantPaymentPlanSubscriptionType.planId, {
				onDelete: "cascade",
			}),

		/**
		 * @localizedContent Localized recurring cycle description
		 * @onboardingContent Improves understanding for end customers
		 */
		billingDescription: text("billing_description"),

		/**
		 * @localizedContent Localized message for free trial info
		 * @conversionCopy Increases conversion during signup
		 */
		trialMessage: text("trial_message"),

		/**
		 * @localizedContent Cancellation rules and expectations
		 * @complianceContext Required in regulated markets (e.g., EU, CA)
		 */
		cancellationPolicy: text("cancellation_policy"),
	},
	{
		fkKey: "planId",
		extraConfig: (t, tableName) => [index(`idx_${tableName}_plan_id`).on(t.planId)],
	},
);

// -------------------------------------
// USER SUBSCRIPTIONS (CUSTOMER PURCHASE INSTANCES)
// -------------------------------------

const orgMemberProductVariantPaymentPlanSubscriptionTableName = `${orgTableName}_member_product_variant_payment_plan_subscription`;
/**
 * User Subscription - Customer Payment Instance and Access Management
 *
 * @businessLogic Customer subscription instances tracking how users purchase and access
 * org payment plans. Manages subscription lifecycle, access control, and
 * revenue tracking completely separate from how orgs create pricing strategies.
 *
 * @accessControl Links customer payment status to product content access enabling
 * dynamic content availability based on subscription status, payment plan features,
 * and org access policies for comprehensive customer experience management.
 *
 * @subscriptionLifecycle Tracks complete customer journey from purchase through active
 * usage to cancellation providing comprehensive subscription management capabilities
 * for customer service, retention workflows, and org analytics.
 *
 * @paymentGatewayIntegration External subscription IDs link internal subscription
 * management to payment processors enabling automated subscription state synchronization
 * and billing cycle management through webhook integration.
 *
 * @orgalRevenue Revenue tracking supports creator economy workflows with
 * instructor attribution calculations and org financial reporting for
 * comprehensive creator compensation and business analytics.
 *
 * @memberContextSupport Supports both org members and external customers
 * enabling internal team subscriptions alongside external customer sales workflows
 * for comprehensive org subscription management.
 *
 * @abacScope tenant: orgId, subject: userId || orgMemberId
 * @accessPattern Resolves per-user or per-member access to plan-bound content and entitlements
 * @ctiBinding Concrete customer-side realization of a payment plan, enabling separation
 * of billing strategy from usage enforcement
 * @billingLinkage Integrates with external providers via IDs for lifecycle automation
 * and revenue capture
 * @revenueLineItem Canonical source for calculating actualized revenue, linked to
 * accounting and analytics domains
 * @memberEntitlement Supports internal tooling: subscriptions assigned to org staff
 * via orgMemberId
 */
export const orgMemberProductVariantPaymentPlanSubscription = table(
	orgMemberProductVariantPaymentPlanSubscriptionTableName,
	{
		id: textCols.id().notNull(),

		// TODO: change to purchased by user
		/**
		 * @customerReference Customer who owns this subscription instance
		 * @accessControl Primary relationship for content access permissions and customer service
		 */
		userId: sharedCols.userIdFk().notNull(),

		/**
		 * @paymentPlanReference Org's payment plan this subscription follows
		 * @businessRule Determines pricing, billing cycle, features, and access permissions
		 */
		planId: textCols
			.idFk("plan_id")
			.notNull()
			.references(() => orgProductVariantPaymentPlan.id),

		/**
		 * @orgScope Org context for this subscription
		 * @multiTenant Enables org-specific subscription management and reporting
		 */
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @memberContext Optional org member context for internal subscriptions
		 * @businessRule When present, indicates internal org member subscription
		 */
		orgMemberId: sharedCols.orgMemberIdFk(),

		/**
		 * @subscriptionLifecycle Current subscription state for access control
		 * @accessControl Determines customer's access to product content and features
		 */
		status: orgProductVariantPaymentSubscriptionStatusEnum("status").default("active"),

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

		/**
		 * @revenueTracking Total amount customer has paid for this subscription
		 * @creatorEconomy Basis for instructor revenue sharing and org analytics
		 */
		totalPaid: numericCols.currency.price().default("0"),

		/**
		 * @currencyTracking Currency used for this subscription billing
		 * @internationalCommerce Essential for multi-currency revenue tracking and reporting
		 */
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		// /**
		//  * @extensibility Additional subscription metadata for analytics and integrations
		//  * @businessIntelligence May contain usage tracking, preferences, or integration data
		//  */
		// metadata: jsonb("metadata"),

		/**
		 * @externalIntegrationMetadata Additional metadata for external integrations
		 * @integrationContext May include third-party platform IDs, sync states, etc.
		 * @businessIntelligence Supports advanced analytics and reporting for external integrations
		 */
		externalMetadata: jsonb("external_metadata"),

		// /**
		//  * @paymentGateway External subscription ID from payment processor
		//  * @webhookIntegration Links internal subscription management to payment processor
		//  */
		// externalSubscriptionId: textCols.idFk("external_subscription_id"),

		// /**
		//  * @paymentGateway External customer ID from payment processor
		//  * @billingIntegration Links to payment gateway customer record for billing management
		//  */
		// externalCustomerId: textCols.idFk("external_customer_id"),

		createdAt: temporalCols.activity.completedAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		// Performance indexes for subscription management
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_user_id`).on(t.userId),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_plan_id`).on(t.planId),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_org_id`).on(t.orgId),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_status`).on(t.status),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_member_id`).on(
			t.orgMemberId,
		),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_access`).on(
			t.accessExpiresAt,
		),
		// index(
		// 	`idx_${orgProductVariantPaymentPlanMemberSubscriptionTableName}_external_subscription_id`,
		// ).on(t.externalSubscriptionId),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_currency`).on(
			t.currencyCode,
		),

		// Revenue Analytics Indexes
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_revenue`).on(
			t.totalPaid,
			t.currencyCode,
		),
		index(`idx_${orgMemberProductVariantPaymentPlanSubscriptionTableName}_org_revenue`).on(
			t.orgId,
			t.totalPaid,
		),
	],
);

// const orgUsageBasedPaymentPlanTableName = `${orgTableName}_usage_based_payment_type`;
// /**
//  * Usage-Based Payment Plan - Consumption-Based Billing Model
//  *
//  * @businessLogic Pay-per-consumption product billing based on measurable usage metrics
//  * enabling sophisticated revenue optimization aligned with actual customer engagement.
//  * Supports complex pricing models from simple per-unit charges to tiered volume pricing.
//  *
//  * @ctiSpecialization Extends productVariantPaymentPlan with usage tracking and variable
//  * pricing attributes for consumption-based billing workflows and metered access control.
//  *
//  * @usageMetricsSystem Flexible usage type system supports various measurable customer
//  * interactions enabling precise value-based pricing models aligned with product consumption.
//  *
//  * @variablePricingStrategy Multiple pricing models from linear per-unit to complex tiered
//  * structures with freemium allowances and minimum charges for sophisticated monetization.
//  *
//  * @revenueOptimization Usage-based billing enables revenue scaling with customer success
//  * while providing predictable minimum revenue through freemium models and base charges.
//  *
//  * @abacRole Entitlements enforced via usage limits
//  * @integrationContext Tied to counters (views, storage, API hits, etc.)
//  */
// export const orgUsageBasedPaymentPlan = table(
// 	orgUsageBasedPaymentPlanTableName,
// 	{
// 		/**
// 		 * @ctiReference Links to base payment plan for common attributes and pricing
// 		 */
// 		planId: textCols.idFk("plan_id")
// 			.primaryKey()
// 			.references(() => orgProductVariantPaymentPlan.id),

// 		/**
// 		 * @usageMetric Measurable customer action triggering billing charges
// 		 * @businessModel Defines unit of value for usage-based pricing strategy
// 		 */
// 		usageType: orgUsageTypeEnum("usage_type").notNull(),

// 		/**
// 		 * @pricingStrategy How usage metrics translate to billing amounts
// 		 * @revenueOptimization Different models enable various usage-based monetization approaches
// 		 */
// 		pricingModel: orgUsagePricingModelEnum("pricing_model").notNull(),

// 		/**
// 		 * @tieredPricing Complex pricing structure for volume discounts and usage incentives
// 		 * @businessStrategy Encourages higher usage through bulk pricing benefits
// 		 * @entitlementScope Used for feature metering
// 		 */
// 		pricingTiers: jsonb("pricing_tiers"),

// 		/**
// 		 * @billingCycle How often usage is calculated and charged
// 		 * @operationalEfficiency Most usage billing is monthly for processing efficiency
// 		 */
// 		billingPeriod: orgBillingIntervalEnum("billing_period").default("monthly"),

// 		/**
// 		 * @revenueProtection Minimum charge per billing period regardless of usage
// 		 * @businessModel Ensures baseline revenue even during low consumption periods
// 		 */
// 		minimumCharge: decimal("minimum_charge", {
// 			precision: 12,
// 			scale: 2,
// 		}).default("0"),

// 		/**
// 		 * @freemiumModel Free usage allowance before billing charges begin
// 		 * @customerAcquisition Enables product trial and reduces adoption friction
// 		 */
// 		includedUsage: integer("included_usage").default(0),

// 		createdAt: temporalCols.activity.completedAt(),
// 		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
// 	},
// 	(t) => [
// 		// Performance indexes for usage-based billing management
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_type`).on(t.usageType),
// 		// index(`idx_${orgUsageBasedPaymentPlanTableName}_model`).on(t.pricingModel),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_period`).on(
// 			t.billingPeriod,
// 		),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_minimum`).on(
// 			t.minimumCharge,
// 		),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_included_usage`).on(
// 			t.includedUsage,
// 		),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_created_at`).on(
// 			t.createdAt: temporalCols.activity.completedAt(),
// 		),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_last_updated_at`).on(
// 			t.lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
// 		),
// 		index(`idx_${orgUsageBasedPaymentPlanTableName}_plan_id`).on(t.planId),
// 	],
// );
// const orgUsageBasedPaymentPlanI18nTableName = `${orgUsageBasedPaymentPlanTableName}_i18n`;
// /**
//  * Usage-Based Payment Plan Translation - Localized Usage Content
//  *
//  * @businessLogic Multi-language support for usage-based payment plan specific content
//  * including usage descriptions, pricing explanations, and billing policies for different
//  * markets and complex usage model education requirements.
//  *
//  * @translationPattern Consistent with established schema translation architecture
//  * for predictable internationalization workflows.
//  *
//  * @marketAdaptation Localizes metric explanations and billing semantics for global
//  * engagement and comprehension.
//  *
//  * @billingEducation Helps demystify complex pricing mechanics (e.g., tiers, included usage)
//  * for non-native audiences.
//  */
// export const orgUsageBasedPaymentPlanI18n = buildOrgI18nTable(
// 	orgUsageBasedPaymentPlanI18nTableName,
// )(
// 	{
// 		/**
// 		 * @translationTarget Parent usage-based plan
// 		 */
// 		planId: textCols.idFk("plan_id")
// 			.notNull()
// 			.references(() => orgUsageBasedPaymentPlan.planId, {
// 				onDelete: "cascade",
// 			}),
// 		/**
// 		 * @localizedContent Localized usage metric explanation
// 		 */
// 		usageDescription: text("usage_description"),

// 		/**
// 		 * @localizedContent Localized pricing model description
// 		 */
// 		pricingExplanation: text("pricing_explanation"),

// 		/**
// 		 * @localizedContent Localized billing policy and calculation methods
// 		 */
// 		billingPolicy: text("billing_policy"),
// 	},
// 	{
// 		fkKey: "planId",
// 		extraConfig: (t, tableName) => [
// 			index(`idx_${tableName}_plan_id`).on(t.planId),
// 		],
// 	},
// );
