import { tEnum } from "../../../_utils/tables";
import { orgTableName } from "../../_utils";

export const orgProductTableName = `${orgTableName}_product`;
export const orgProductVariantTable = `${orgProductTableName}_variant`;

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
export const orgProductVariantPaymentUsageTypeEnum = tEnum(`${orgProductVariantTable}_usage_type`, [
	"api_calls",
	"downloads",
	"storage_usage",
	"bandwidth_usage",
	"course_completions",
	"lesson_views",
	"processing_time",
]);
