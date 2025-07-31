import { orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import { seoMetadataIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { seoMetadata } from "#db/schema/general/seo/schema.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";

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
	(cols) => [
		uniqueIndex({
			tName: orgBrandTableName,
			cols: [cols.orgId, cols.slug],
		}),
		multiIndexes({
			tName: orgBrandTableName,
			colsGrps: [{ cols: [cols.brandCategory] }],
		}),
	],
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
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.brandId],
						foreignColumns: [orgBrand.id],
					},
					{
						cols: [cols.seoMetadataId],
						foreignColumns: [seoMetadata.id],
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [cols.name] }],
			}),
		],
	},
);

const orgBrandMetricsTableName = `${orgTableName}_brand_metrics`;
/**
 * Brand Metrics and Performance Data
 *
 * @businessLogic Tracks metrics and usage data for brand content.
 */
export const orgBrandMetrics = table(
	orgBrandMetricsTableName,
	{
		id: textCols.id().notNull(),
		orgBrandId: textCols
			.idFk("vendor_brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => {
		return [
			...multiForeignKeys({
				tName: orgBrandMetricsTableName,
				fkGroups: [
					{
						cols: [cols.orgBrandId],
						foreignColumns: [orgBrand.id],
					},
				],
			}),
			uniqueIndex({
				tName: orgBrandMetricsTableName,
				cols: [cols.orgBrandId],
			}),
			...multiIndexes({
				tName: orgBrandMetricsTableName,
				colsGrps: [{ cols: [cols.createdAt] }, { cols: [cols.lastUpdatedAt] }],
			}),
		];
	},
);
