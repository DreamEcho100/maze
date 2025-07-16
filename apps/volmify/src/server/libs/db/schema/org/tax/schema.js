import {
	boolean,
	index,
	integer,
	numeric,
	pgEnum,
	primaryKey,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, fk, id, table, updatedAt } from "../../_utils/helpers";
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
		id: id.notNull(),
		code: varchar("code", { length: 64 }).notNull(),
	},
	(t) => [primaryKey({ columns: [t.id] })],
);
export const orgTaxCategoryI18n = buildOrgI18nTable(orgTaxCategoryTableName)(
	{
		categoryId: fk("category_id")
			.references(() => orgTaxCategory.id)
			.notNull(),
		name: varchar("name", { length: 64 }).notNull(),
		description: varchar("description", { length: 256 }),
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
/**
 * @domain Taxation
 * @description Individual tax rules, scoped to regions and optionally time-bounded.
 */
export const orgTaxRate = table(
	orgTaxRateTableName,
	{
		id: id.notNull(),
		regionId: fk("region_id")
			.references(() => orgRegion.id)
			.notNull(),

		// name: varchar("name", { length: 128 }).notNull(),
		code: varchar("code", { length: 64 }).notNull(),

		type: orgTaxRateTypeEnum("type").notNull().default("percent"),
		rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
		currencyCode: fk("currency_code").references(() => orgRegion.currencyCode),
		// .notNull(),

		/**
		 * @compound When true, this tax is applied after previous ones.
		 */
		isCompound: boolean("is_compound").default(false).notNull(),

		priority: integer("priority").default(0).notNull(),

		startsAt: timestamp("starts_at"),
		endsAt: timestamp("ends_at"),
		createdAt,
		updatedAt,
		deletedAt,
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
export const orgTaxRateI18n = buildOrgI18nTable(orgTaxRateTableName)(
	{
		rateId: fk("rate_id")
			.references(() => orgTaxRate.id)
			.notNull(),
		name: varchar("name", { length: 128 }).notNull(),
		description: varchar("description", { length: 256 }),
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
		rateId: fk("rate_id")
			.references(() => orgTaxRate.id)
			.notNull(),
		categoryId: fk("category_id")
			.references(() => orgTaxCategory.id)
			.notNull(),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.rateId, t.categoryId] }),
		index(`idx_${orgTaxRateTaxCategoryTableName}_created_at`).on(t.createdAt),
	],
);
