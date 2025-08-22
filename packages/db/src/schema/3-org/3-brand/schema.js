import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { seoMetadataIdFkCol, seoMetadataIdFkExtraConfig } from "../../0-seo/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";
import { buildOrgI18nTable } from "../0-locale/0_utils/index.js";
import { orgCategory } from "../1-category/schema.js";

// ## org -> brand
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		slug: textCols.slug().notNull(),
		logoUrl: textCols.url("logo_url"),
		// IMP: Add an API level category scope validation _(of value `org_brand_category`)_ instead of a DB check constraint
		categoryId: textCols.idFk("category_id"), // e.g., "education", "technology", "healthcare"
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgBrandTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgBrandTableName,
			fkGroups: [
				{
					cols: [cols.categoryId],
					foreignColumns: [orgCategory.id],
				},
			],
		}),
		uniqueIndex({
			tName: orgBrandTableName,
			cols: [cols.orgId, cols.slug],
		}),
		multiIndexes({
			tName: orgBrandTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
				{ cols: [cols.slug] },
			],
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
			// .references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		name: textCols.name().notNull(),
		description: textCols.description(),
		story: textCols.story(),
		seoMetadataId: seoMetadataIdFkCol(),
	},
	{
		fkKey: "brandId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName,
				cols,
			}),
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.brandId],
						foreignColumns: [orgBrand.id],
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
		id: textCols.idPk().notNull(),
		brandId: textCols
			.idFk("brand_id")
			// .references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => {
		return [
			...multiForeignKeys({
				tName: orgBrandMetricsTableName,
				fkGroups: [
					{
						cols: [cols.brandId],
						foreignColumns: [orgBrand.id],
					},
				],
			}),
			...multiIndexes({
				tName: orgBrandMetricsTableName,
				colsGrps: [{ cols: [cols.createdAt] }, { cols: [cols.lastUpdatedAt] }],
			}),
		];
	},
);
// -- org -> brand
