import { eq, isNull, sql } from "drizzle-orm";
import { boolean, text } from "drizzle-orm/pg-core";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	localeKeyFkCol,
	localeKeyFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/locale-key.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";

const orgLocaleTableName = `${orgTableName}_locale`;
export const orgLocale = table(
	orgLocaleTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		localeKey: localeKeyFkCol().notNull(),

		/**
		 * @orgalControl Org-specific locale configuration
		 * @businessRule Orgs control their supported languages
		 */
		isDefault: sharedCols.isDefault(),
		isActive: sharedCols.isActive(),

		// /**
		//  * @marketStrategy Org's market positioning for this locale
		//  * @businessIntelligence Locale-specific business strategy tracking
		//  */
		// priority: integer("priority").default(100), // Lower = higher priority
		// marketStatus: text("market_status"), // "primary", "expansion", "test"

		/**
		 * @localizationStrategy Content localization preferences
		 * @businessRule How org handles content in this locale
		 */
		// TODO: convert to enum, ex: "full_translation", "partial", "auto_translate", other
		contentStrategy: text("content_strategy"), // "full_translation", "partial", "auto_translate"

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// uniqueIndex(`uq_${orgLocaleTableName}`).on(t.orgId, t.localeKey),
		// uniqueIndex(`uq_${orgLocaleTableName}_default`)
		// 	.on(t.orgId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${orgLocaleTableName}_is_active`).on(t.isActive),
		// // index(`idx_${orgLocaleTableName}_priority`).on(t.priority),
		...orgIdFkExtraConfig({
			tName: orgLocaleTableName,
			cols,
		}),
		...localeKeyFkExtraConfig({
			tName: orgLocaleTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [cols.orgId, cols.localeKey],
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [cols.orgId, cols.isDefault],
		}).where(eq(cols.isDefault, sql`TRUE`)),
		...multiIndexes({
			tName: orgLocaleTableName,
			colsGrps: [
				{ cols: [cols.isActive] },
				// { cols: [cols.priority] }, // TODO: Uncomment when priority is implemented
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

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
