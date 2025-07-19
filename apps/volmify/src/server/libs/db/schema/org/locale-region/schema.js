import { eq } from "drizzle-orm";
import { boolean, index, integer, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, idCol, idFkCol, table, updatedAt } from "../../_utils/helpers";
import { currency, locale } from "../../general/locale-currency-market/schema";
import { seoMetadata } from "../../general/seo/schema";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";
import { org } from "../schema";

const orgLocaleTableName = `${orgTableName}_locale`;
export const orgLocale = table(
	orgLocaleTableName,
	{
		id: idCol.notNull(),
		orgId: idFkCol(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),
		localeKey: idFkCol("locale_key")
			.notNull()
			.references(() => locale.key),

		/**
		 * @orgalControl Org-specific locale configuration
		 * @businessRule Organizations control their supported languages
		 */
		isDefault: boolean("is_default").default(false),
		isEnabled: boolean("is_enabled").default(true),

		/**
		 * @marketStrategy Organization's market positioning for this locale
		 * @businessIntelligence Locale-specific business strategy tracking
		 */
		priority: integer("priority").default(100), // Lower = higher priority
		marketStatus: text("market_status"), // "primary", "expansion", "test"

		/**
		 * @localizationStrategy Content localization preferences
		 * @businessRule How org handles content in this locale
		 */
		contentStrategy: text("content_strategy"), // "full_translation", "partial", "auto_translate"

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex(`uq_${orgLocaleTableName}`).on(t.orgId, t.localeKey),
		uniqueIndex(`uq_${orgLocaleTableName}_default`)
			.on(t.orgId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${orgLocaleTableName}_enabled`).on(t.isEnabled),
		index(`idx_${orgLocaleTableName}_priority`).on(t.priority),
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
		id: idFkCol("id").notNull(),
		orgId: idFkCol("org_id")
			.notNull()
			.references(() => org.id),
		currencyCode: idFkCol("currency_code")
			.references(() => currency.code)
			.notNull(),
		includesTax: boolean("includes_tax").default(false).notNull(),
		createdAt,
		updatedAt,
		deletedAt,

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
	],
);
const orgRegionI18nTableName = `${orgRegionTableName}_i18n`;
export const orgRegionI18n = buildOrgI18nTable(orgRegionI18nTableName)(
	{
		regionId: idFkCol("org_region_id")
			.references(() => orgRegion.id)
			.notNull(),
		seoMetadataId: idFkCol("seo_metadata_id")
			.references(() => seoMetadata.id)
			.notNull(),
		name: varchar("name", { length: 64 }).notNull(),
		description: varchar("description", { length: 256 }),
	},
	{
		fkKey: "regionId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_name`).on(t.name),
			index(`idx_${tableName}_region_id`).on(t.regionId),
		],
	},
);
