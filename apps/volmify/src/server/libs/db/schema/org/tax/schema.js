import { boolean, index, numeric, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { numericCols, sharedCols, table, temporalCols, textCols } from "../../_utils/helpers";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";
import { orgRegion } from "../locale-region/schema";

const orgTaxCategoryTableName = `${orgTableName}_tax_category`;
/**
 * @domain Taxation
 * @description Logical tax category for grouping products by tax behavior.
 */
export const orgTaxCategory = table(
	orgTaxCategoryTableName,
	{
		id: textCols.id().notNull(),
		code: textCols.code().notNull(),
	},
	(t) => [primaryKey({ columns: [t.id] })],
);
const orgTaxCategoryI18nTableName = `${orgTaxCategoryTableName}_i18n`;
export const orgTaxCategoryI18n = buildOrgI18nTable(orgTaxCategoryI18nTableName)(
	{
		categoryId: textCols
			.idFk("category_id")
			.references(() => orgTaxCategory.id)
			.notNull(),
		seoMetadataId: sharedCols.seoMetadataIdFk().notNull(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "categoryId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_name`).on(t.name),
			index(`idx_${tableName}category_id`).on(t.categoryId),
		],
	},
);

export const orgTaxRateTypeEnum = pgEnum("org_tax_rates_type", ["percent", "fixed"]);
const orgTaxRateTableName = `${orgTableName}_tax_rates`;
// export const orgTaxRateMethodEnum = pgEnum("org_tax_rates_method", [
// 	"inclusive", // Tax included in price, example equation on how it will apply: price * (1 - discount) * (1 + tax)
// 	"exclusive", // Tax added on top of price, example equation on how it will apply: price * (1 - discount) + tax
// 	"compound", // Tax applied on top of tax, e.g., VAT on VAT, example equation on how it will apply: price * (1 - discount) * (1 + tax) * (1 + compoundTax)
// 	"flat", // Flat fee per item, e.g., environmental tax, example equation on how it will apply: price * (1 - discount) + flatFee
// ]);
/**
 * @domain Taxation
 * @description Individual tax rules, scoped to regions and optionally time-bounded.
 */
export const orgTaxRate = table(
	orgTaxRateTableName,
	{
		id: textCols.id().notNull(),
		// TODO: instead of regionId, we can make a many-to-many relation with orgRegion
		// and use a junction table to link rates to multiple regions
		// So we can have rates that apply to multiple regions
		regionId: textCols
			.idFk("region_id")
			.references(() => orgRegion.id)
			.notNull(),
		// Add a flag to indicate if it needs to be applied to an orgRegion
		isRegionScoped: boolean("is_region_scoped").default(true).notNull(),

		// name: textCols.name().notNull(),
		code: textCols.code().notNull(),

		type: orgTaxRateTypeEnum("type").notNull().default("percent"),
		// method: orgTaxRateMethodEnum("method").notNull().default("inclusive"),
		rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
		currencyCode: sharedCols.currencyCodeFk().notNull(),

		/**
		 * @compound When true, this tax is applied after previous ones.
		 */
		isCompound: boolean("is_compound").default(false).notNull(),
		isInclusive: boolean("is_compound").default(false).notNull(),

		priority: numericCols.priority().notNull(),

		startsAt: temporalCols.business.startsAt(),
		endsAt: temporalCols.business.endsAt(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => [
		index(`idx_${orgTaxRateTableName}_region`).on(t.regionId),
		index(`idx_${orgTaxRateTableName}_code`).on(t.code),
		index(`idx_${orgTaxRateTableName}_type`).on(t.type),
		index(`idx_${orgTaxRateTableName}_currency`).on(t.currencyCode),
		index(`idx_${orgTaxRateTableName}_priority`).on(t.priority),
		index(`idx_${orgTaxRateTableName}_starts_at`).on(t.startsAt),
		index(`idx_${orgTaxRateTableName}_ends_at`).on(t.endsAt),
	],
);
const orgTaxRateI18nTableName = `${orgTaxRateTableName}_i18n`;
export const orgTaxRateI18n = buildOrgI18nTable(orgTaxRateI18nTableName)(
	{
		rateId: textCols
			.idFk("rate_id")
			.references(() => orgTaxRate.id)
			.notNull(),
		seoMetadataId: sharedCols.seoMetadataIdFk().notNull(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "rateId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_name`).on(t.name),
			index(`idx_${tableName}_rate_id`).on(t.rateId),
		],
	},
);

const orgTaxRateTaxCategoryTableName = `${orgTaxRateTableName}_tax_category`;
/**
 * @domain Taxation
 * @description Many-to-many relation of tax categories to rates.
 */
export const orgTaxRateTaxCategory = table(
	orgTaxRateTaxCategoryTableName,
	{
		rateId: textCols
			.idFk("rate_id")
			.references(() => orgTaxRate.id)
			.notNull(),
		categoryId: textCols
			.idFk("category_id")
			.references(() => orgTaxCategory.id)
			.notNull(),
		createdAt: temporalCols.audit.createdAt(),
	},
	(t) => [
		primaryKey({ columns: [t.rateId, t.categoryId] }),
		index(`idx_${orgTaxRateTaxCategoryTableName}_created_at`).on(t.createdAt),
	],
);
