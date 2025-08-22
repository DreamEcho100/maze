/**
 * @fileoverview Product Schema - Multi-Tenant E-commerce Product Catalog with Creator Attribution
 *
 * @architecture Multi-Tenant Product Catalog + Job Attribution + Payment Plan Integration
 * E-commerce product system supporting multiple product types (physical, digital, course, service)
 * with org boundaries, professional content attribution, and integrated payment strategies.
 * Designed for creator economy where Org Members create educational content within org contexts
 * while maintaining clear revenue attribution and brand identity integration.
 *
 * @designPattern CTI + Job Attribution + Brand Attribution + Variant-Based Commerce + Payment Integration
 * - CTI Pattern: Course-specific tables extend base product for educational content specialization
 * - Job Attribution: Org Member-product attribution for creator economy revenue sharing workflows
 * - Brand Attribution: Org brand identity integration for consistent marketing strategies
 * - Variant-Based Commerce: Product variations (access levels, features) with independent pricing strategies
 * - Payment Integration: Direct integration with payment plans eliminating separate pricing table redundancy
 *
 * @integrationPoints
 * - Job Attribution: Org Member revenue sharing and content creation workflows
 * - Brand Integration: Org brand identity and marketing attribution systems
 * - Payment Integration: Product variants connect directly to sophisticated payment plan strategies
 * - Course System: Educational content creation and delivery for Org Member economy
 * - Promotional Integration: Discount campaigns and promotional strategies for revenue optimization
 *
 * @businessValue
 * Enables orgs to create and monetize diverse product catalogs while maintaining
 * clear attribution to professional creators and brand identity. Supports sophisticated
 * e-commerce scenarios from simple physical products to complex educational content with
 * comprehensive creator economy revenue sharing and promotional campaign management.
 *
 * @scalingDesign
 * CTI pattern enables adding new product types without affecting existing commerce workflows.
 * Job attribution system scales to support multiple creator types and revenue models.
 * Payment plan integration eliminates pricing table redundancy while maintaining sophisticated
 * pricing strategies and promotional campaign compatibility.
 */

import { eq, sql } from "drizzle-orm";
import { boolean, check, decimal, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { orgCategory } from "../../general/category/schema.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
import { orgBrand } from "../brand/schema.js";
import { orgProductVariantPaymentTypeEnum } from "./payment/_utils/shared-enums.js";
