import { pgEnum } from "drizzle-orm/pg-core";
import { orgTableName } from "../../../../org/_utils/helpers.js";

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
