import { isNull } from "drizzle-orm";
import { boolean } from "drizzle-orm/pg-core";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { currencyCodeFkCol, currencyCodeFkExtraConfig } from "../../0-local/0_utils/index.js";
import { seoMetadataIdFkCol, seoMetadataIdFkExtraConfig } from "../../0-seo/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";
import { buildOrgI18nTable } from "../0-locale/0_utils/index.js";

// ## org -> region
const orgRegionTableName = `${orgTableName}_region`;
/**
 * @domain Geography
 * @description Region represents a distinct tax, pricing, and currency zone (e.g. EU, US-East, CA).
 * It defines tax rules, supported products, and currency.
 */
export const orgRegion = table(
	orgRegionTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		currencyCode: currencyCodeFkCol().notNull(),
		includesTax: boolean("includes_tax").default(false).notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		// /**
		//  * @managementScope Regional management capabilities
		//  */
		// hasLocalManagement: boolean("has_local_management").default(false),
		// managementDepartmentId: fk("management_department_id").references(() => orgDepartment.id),
		// autonomyLevel: autonomyLevelEnum("autonomy_level").default("operational"),
		// // "operational", "strategic", "full_autonomous"
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgRegionTableName,
			cols,
		}),
		...currencyCodeFkExtraConfig({
			tName: orgRegionTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgRegionTableName,
			cols: [cols.orgId, cols.currencyCode],
		}).where(isNull(cols.deletedAt)),
		...multiIndexes({
			tName: orgRegionTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);
export const orgRegionI18n = buildOrgI18nTable(orgRegionTableName)(
	{
		regionId: textCols
			.idFk("org_region_id")
			// .references(() => orgRegion.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol().notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "regionId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName,
				cols,
			}),
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.regionId],
						foreignColumns: [orgRegion.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
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
// -- org -> region
