/**
 * @fileoverview Product Payment Relations - Variant-Level Payment Integration
 *
 * @integrationPattern Variant-Based Payment Relations + CTI + Creator Economy Integration
 * Enables comprehensive payment plan relationships with product variants, org
 * boundaries, and customer subscriptions while maintaining optimal query performance through
 * CTI pattern and specialized relation definitions for e-commerce monetization workflows.
 *
 * @businessContext
 * Payment relations support variant-level e-commerce monetization workflows including
 * org pricing strategies, creator economy revenue attribution, multi-currency
 * international expansion, and customer subscription lifecycle management for sophisticated
 * product monetization and comprehensive business analytics.
 *
 * @scalabilityContext
 * CTI relations pattern enables adding new payment types (freemium, corporate, enterprise)
 * without affecting existing payment workflows or requiring relation migrations, supporting
 * platform growth and new monetization strategies while maintaining creator attribution.
 *
 * @creatorEconomyIntegration
 * Payment relations integrate with Org member attribution systems enabling revenue sharing
 * calculations and creator/Org-member compensation workflows within org boundaries while
 * supporting cross-org professional collaboration patterns.
 *
 * @variantIntegration
 * Deep integration with productVariant system maintains consistency with established
 * e-commerce patterns while adding sophisticated payment plan capabilities for modern
 * subscription economy and usage-based business models.
 */

import { relations } from "drizzle-orm";
import { orgCategory } from "../../../general/category/schema.js";
import { currency } from "../../../general/locale-and-currency/schema.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { user } from "../../../user/schema.js";
import { orgLocale } from "../../locale-region/schema.js";
import { orgMember } from "../../member/schema.js";
import { org } from "../../schema.js";
import { orgProductVariant } from "../schema.js";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
	orgProductVariantPaymentPlanI18n,
	orgProductVariantPaymentPlanOneTimeType,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionType,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "./schema.js";
