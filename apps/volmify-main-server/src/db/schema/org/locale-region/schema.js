import { eq } from "drizzle-orm";
import { boolean, text } from "drizzle-orm/pg-core";
import {
	currencyCodeExtraConfig,
	currencyCodeFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	localeKeyExtraConfig,
	localeKeyFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/locale-key.js";
import { orgIdExtraConfig, orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdExtraConfig,
	seoMetadataIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";

const orgLocaleTableName = `${orgTableName}_locale`;
export const orgLocale = table(
	orgLocaleTableName,
	{
		id: textCols.id().notNull(),
		orgId: orgIdFkCol().notNull(),
		localeKey: localeKeyFkCol("locale_key").notNull(),

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

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		// uniqueIndex(`uq_${orgLocaleTableName}`).on(t.orgId, t.localeKey),
		// uniqueIndex(`uq_${orgLocaleTableName}_default`)
		// 	.on(t.orgId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${orgLocaleTableName}_is_active`).on(t.isActive),
		// // index(`idx_${orgLocaleTableName}_priority`).on(t.priority),
		...orgIdExtraConfig({
			tName: orgLocaleTableName,
			cols: t,
		}),
		...localeKeyExtraConfig({
			tName: orgLocaleTableName,
			cols: t,
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [t.orgId, t.localeKey],
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [t.orgId, t.isDefault],
		}).where(eq(t.isDefault, true)),
		...multiIndexes({
			tName: orgLocaleTableName,
			colsGrps: [
				{ cols: [t.isActive] },
				// { cols: [t.priority] }, // TODO: Uncomment when priority is implemented
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
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
		id: textCols.id().notNull(),
		orgId: orgIdFkCol().notNull(),
		currencyCode: currencyCodeFkCol().notNull(),
		includesTax: boolean("includes_tax").default(false).notNull(),
		createdAt: temporalCols.audit.createdAt(),
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
	(t) => [
		...orgIdExtraConfig({
			tName: orgRegionTableName,
			cols: t,
		}),
		...currencyCodeExtraConfig({
			tName: orgRegionTableName,
			cols: t,
		}),
		uniqueIndex({
			tName: orgRegionTableName,
			cols: [t.orgId, t.currencyCode],
		}).where(eq(t.deletedAt, null)),
		...multiIndexes({
			tName: orgRegionTableName,
			colsGrps: [{ cols: [t.createdAt] }, { cols: [t.lastUpdatedAt] }, { cols: [t.deletedAt] }],
		}),
	],
);
export const orgRegionI18n = buildOrgI18nTable(orgRegionTableName)(
	{
		regionId: textCols
			.idFk("org_region_id")
			.references(() => orgRegion.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol().notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "regionId",
		extraConfig: (t, tName) => [
			...seoMetadataIdExtraConfig({
				tName,
				cols: t,
			}),
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [t.regionId],
						foreignColumns: [orgRegion.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName,
				colsGrps: [{ cols: [t.name] }],
			}),
		],
	},
);
