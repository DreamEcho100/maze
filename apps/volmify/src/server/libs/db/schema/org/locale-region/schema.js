import { eq } from "drizzle-orm";
import { boolean, index, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers";
import { currency } from "../../general/locale-currency-market/schema";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";
import { org } from "../schema";

const orgLocaleTableName = `${orgTableName}_locale`;
export const orgLocale = table(
	orgLocaleTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),
		localeKey: sharedCols.localeKeyFk("locale_key").notNull(),

		/**
		 * @orgalControl Org-specific locale configuration
		 * @businessRule Orgs control their supported languages
		 */
		isDefault: sharedCols.isDefault(),
		isEnabled: boolean("is_enabled").default(true),

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
		contentStrategy: text("content_strategy"), // "full_translation", "partial", "auto_translate"

		createdAt: temporalCols.createdAt(),
		lastUpdatedAt: temporalCols.lastUpdatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgLocaleTableName}`).on(t.orgId, t.localeKey),
		uniqueIndex(`uq_${orgLocaleTableName}_default`)
			.on(t.orgId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${orgLocaleTableName}_enabled`).on(t.isEnabled),
		// index(`idx_${orgLocaleTableName}_priority`).on(t.priority),
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
		id: textCols.idFk("id").notNull(),
		orgId: textCols
			.idFk("org_id")
			.notNull()
			.references(() => org.id),
		currencyCode: textCols
			.idFk("currency_code")
			.references(() => currency.code)
			.notNull(),
		includesTax: boolean("includes_tax").default(false).notNull(),
		createdAt: temporalCols.createdAt(),
		lastUpdatedAt: temporalCols.lastUpdatedAt(),
		deletedAt: temporalCols.deletedAt(),

		// /**
		//  * @managementScope Regional management capabilities
		//  */
		// hasLocalManagement: boolean("has_local_management").default(false),
		// managementDepartmentId: fk("management_department_id").references(() => orgDepartment.id),
		// autonomyLevel: autonomyLevelEnum("autonomy_level").default("operational"),
		// // "operational", "strategic", "full_autonomous"
	},
	(t) => [
		uniqueIndex(`uq_${orgRegionTableName}_org_currency`)
			.on(t.orgId, t.currencyCode)
			.where(eq(t.deletedAt, null)),
		index(`idx_${orgRegionTableName}_org_id`).on(t.orgId),
		index(`idx_${orgRegionTableName}_currency_code`).on(t.currencyCode),
		index(`idx_${orgRegionTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgRegionTableName}_last_updated_at`).on(t.lastUpdatedAt),
		index(`idx_${orgRegionTableName}_deleted_at`).on(t.deletedAt),
	],
);
const orgRegionI18nTableName = `${orgRegionTableName}_i18n`;
export const orgRegionI18n = buildOrgI18nTable(orgRegionI18nTableName)(
	{
		regionId: textCols
			.idFk("org_region_id")
			.references(() => orgRegion.id)
			.notNull(),
		seoMetadataId: sharedCols.seoMetadataIdFk().notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "regionId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_name`).on(t.name),
			index(`idx_${tableName}_region_id`).on(t.regionId),
		],
	},
);
