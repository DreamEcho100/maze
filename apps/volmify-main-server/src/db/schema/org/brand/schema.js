import { index, uniqueIndex } from "drizzle-orm/pg-core";
import { seoMetadataIdFkCol } from "#db/schema/general/seo/schema";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
import { orgIdFkCol } from "../schema.js";

const orgBrandTableName = `${orgTableName}_brand`;
/**
 * Org Brand Configuration
 *
 * @businessLogic Represents org branding used across
 * content, marketing, and course attribution.
 */
export const orgBrand = table(
	orgBrandTableName,
	{
		id: textCols.id().notNull(),
		orgId: orgIdFkCol().notNull(),
		slug: textCols.slug().notNull(),
		logoUrl: textCols.url("logo_url"),
		brandCategory: textCols.category("brand_category"), // e.g., "education", "technology", "healthcare"
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => {
		const base = `${orgTableName}_brand`;
		return [
			uniqueIndex(`uq_${base}_slug`).on(t.orgId, t.slug),
			index(`idx_${base}_category`).on(t.brandCategory),
		];
	},
);

/**
 * Org Brand Localization
 *
 * @businessLogic Localized branding content for internationalization.
 */
export const orgBrandTranslation = buildOrgI18nTable(orgBrandTableName)(
	{
		brandId: textCols
			.idFk("brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		name: textCols.name().notNull(),
		description: textCols.description(),
		story: textCols.story(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "brandId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_seo_metadata_id`).on(t.seoMetadataId),
			index(`idx_${tName}_name`).on(t.name),
		],
	},
);

/**
 * Brand Metrics and Performance Data
 *
 * @businessLogic Tracks metrics and usage data for brand content.
 */
export const orgBrandMetrics = table(
	`${orgTableName}_brand_metrics`,
	{
		id: textCols.id().notNull(),
		orgBrandId: textCols
			.idFk("vendor_brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => {
		const base = `${orgTableName}_brand_metrics`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			uniqueIndex(`uq_${base}_org_brand`).on(t.orgBrandId),
			index(`idx_${base}_org_brand_id`).on(t.orgBrandId),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
		];
	},
);
