import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import {
	currencyCodeExtraConfig,
	currencyCodeFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdExtraConfig,
	orgEmployeeIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdExtraConfig, orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdExtraConfig,
	seoMetadataIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#db/schema/_utils/helpers.js";
import { numericCols } from "../../_utils/cols/numeric.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
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
		id: textCols.idPk().notNull(),
		code: textCols.code().notNull(),
	},
	(cols) => [
		...multiIndexes({
			tName: orgTaxCategoryTableName,
			colsGrps: [{ cols: [cols.code] }],
		}),
	],
);
export const orgTaxCategoryI18n = buildOrgI18nTable(orgTaxCategoryTableName)(
	{
		categoryId: textCols
			.idFk("category_id")
			// .references(() => orgTaxCategory.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol().notNull(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "categoryId",
		extraConfig: (cols, tName) => [
			// index(`idx_${tName}_name`).on(cols.name)
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.categoryId],
						foreignColumns: [orgTaxCategory.id],
					},
				],
			}),
			...seoMetadataIdExtraConfig({
				tName: tName,
				cols,
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.name] }],
			}),
		],
	},
);

export const orgTaxRateTypeEnum = pgEnum("org_tax_rates_type", [
	"percent", // Percentage of the price, e.g., VAT, sales tax
	"fixed", // Fixed amount per item, e.g., environmental tax, flat fee
	// "compound", // Percentage applied on top of another tax, e.g., VAT on VAT
	// "flat", // Flat fee per item, e.g., environmental tax, example equation on how it will apply: price * (1 - discount) + flatFee
	// "exempt", // No tax applied, e.g., tax-exempt products or services
	// "zero_rate", // Tax rate of 0%, e.g., zero-rated goods or services
	// "rebate", // Refundable tax, e.g., input tax credits
	// "other", // Custom tax type not covered by the above
]);
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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		// TODO: instead of regionId, we can make a many-to-many relation with orgRegion
		// and use a junction table to link rates to multiple regions
		// So we can have rates that apply to multiple regions
		regionId: textCols
			.idFk("region_id")
			// .references(() => orgRegion.id)
			.notNull(),
		// Add a flag to indicate if it needs to be applied to an orgRegion
		isRegionScoped: boolean("is_region_scoped").default(true).notNull(),

		/**
		 * @regionSnapshot Tax jurisdiction at time of order
		 * @internationalCompliance Preserves tax location for cross-border transactions
		 */
		// Q: Should it connect to the country table?
		// Q: Should it be on the main order table?
		jurisdiction: textCols.category("jurisdiction"), // "US-CA", "GB", "DE-BY"

		// name: textCols.name().notNull(),
		code: textCols.code().notNull(), // e.g. "VAT", "sales_tax", "digital_goods"

		type: orgTaxRateTypeEnum("type").notNull().default("percent"),

		// Q: Would the `amount` field be enough? which is better, efficient, or more optimized?
		rate: numericCols.percentage.rate("rate"), // For percentage rates, e.g. 15% = 15.00
		amount: numericCols.currency.amount("amount"), // For fixed rates, e.g. $5.00 flat fee
		currencyCode: currencyCodeFkCol(), // For fixed rates, e.g. "USD", "EUR"

		effectiveFrom: temporalCols.business.startsAt("effective_from").notNull(),
		effectiveTo: temporalCols.business.endsAt("effective_to"), // NULL = current

		isInclusive: boolean("is_inclusive").default(false).notNull(),

		// /**
		//  * @compound When true, this tax is applied after previous ones.
		//  */
		// isCompound: boolean("is_compound").default(false).notNull(),
		// priority: numericCols.priority().notNull(), // Lower numbers are applied first, e.g. 1 = highest priority

		// Q: can'cols I use the `lastUpdatedAt` to determine the version or track, or is it not reliable or better to use a separate version column?
		// ✅ VERSIONING: Track rate changes
		modificationVersion: integer("modification_version").notNull().default(1),
		systemChangesVersion: integer("system_changes_version").notNull().default(1),
		// supersededBy: textCols.idFk("superseded_by").references(() => orgTaxRate.id),

		// startsAt: temporalCols.business.startsAt(),
		// endsAt: temporalCols.business.endsAt(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgTaxRateTableName,
			cols,
		}),
		...currencyCodeExtraConfig({
			tName: orgTaxRateTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgTaxRateTableName,
			fkGroups: [
				{
					cols: [cols.regionId],
					foreignColumns: [orgRegion.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgTaxRateTableName,
			colsGrps: [{ cols: [cols.code] }, { cols: [cols.type] }],
		}),
		// index(`idx_${orgTaxRateTableName}_priority`).on(cols.priority),
		// index(`idx_${orgTaxRateTableName}_starts_at`).on(cols.startsAt),
		// index(`idx_${orgTaxRateTableName}_ends_at`).on(cols.endsAt),

		// uniqueIndex("uq_active_tax_rate")
		// 	.on(cols.orgId, cols.taxCategoryId, cols.jurisdiction)
		// 	.where(sql`${cols.effectiveTo} IS NULL`),

		// ✅ CONSTRAINT: Effective period validity
		check(
			`ck_${orgTaxRateTableName}_valid_effective_period`,
			sql`${cols.effectiveTo} IS NULL OR ${cols.effectiveTo} > ${cols.effectiveFrom}`,
		),

		// ✅ CONSTRAINT: Rate bounds
		check(
			`ck_${orgTaxRateTableName}_valid_rate_range`,
			sql`${cols.rate} >= 0 AND ${cols.rate} <= 100`,
		),
		// Check if it's a fixed type, to have amount field not null and rate field null, and vice versa
		// Q: Is the following will be translated correctly to SQL?
		// check(
		// 	`ck_${orgTaxRateTableName}_valid_rate_amount`,
		// 	sql`(${cols.type} = 'fixed' AND ${cols.amount} IS NOT NULL AND ${cols.rate} IS NULL) OR (${cols.type} = 'percent' AND ${cols.amount} IS NULL AND ${cols.rate} IS NOT NULL)`,
		// ),
	],
);
export const orgTaxRateI18n = buildOrgI18nTable(orgTaxRateTableName)(
	{
		rateId: textCols
			.idFk("rate_id")
			// .references(() => orgTaxRate.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol().notNull(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "rateId",
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.rateId],
						foreignColumns: [orgTaxRate.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...seoMetadataIdExtraConfig({
				tName: tName,
				cols,
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.name] }],
			}),
		],
	},
);

// TODO: Move to it's own file, to be used globally across the app and easily imported and updated
const orgTaxRateSnapshotCurrentSystemChangesVersion = 0;

const orgTaxRateSnapshotTableName = `${orgTaxRateTableName}_snapshot`;
export const orgTaxRateSnapshot = table(
	orgTaxRateSnapshotTableName,
	{
		id: textCols.idPk().notNull(),
		systemChangesVersion: integer("system_changes_version")
			.notNull()
			.default(orgTaxRateSnapshotCurrentSystemChangesVersion),
		modificationVersion: integer("modification_version").notNull().default(1),
		rateId: textCols
			.idFk("rate_id")
			// .references(() => orgTaxRate.id)
			.notNull(),

		/**
		 * INDUSTRY STANDARD: Tax rate snapshots for audit compliance
		 *
		 * Store the full tax rate object as JSON for historical accuracy.
		 *
		 * This enables precise auditing, rollback, historical analysis, and
		 * allows orders to reference the exact tax rate as it existed at the time.
		 *
		 * You could optimize by only storing relevant fields, but full snapshots
		 * are safer for compliance and future-proofing.
		 */
		data: jsonb("data").notNull(),

		// Metadata
		createdAt: temporalCols.audit.createdAt().notNull(),
		byEmployeeId: orgEmployeeIdFkCol({ name: "by_employee_id" }).notNull(),
	},
	(cols) => [
		...orgEmployeeIdExtraConfig({
			tName: orgTaxRateSnapshotTableName,
			cols,
			colFkKey: "byEmployeeId",
		}),
		...multiForeignKeys({
			tName: orgTaxRateSnapshotTableName,
			fkGroups: [
				{
					cols: [cols.rateId],
					foreignColumns: [orgTaxRate.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: orgTaxRateSnapshotTableName,
			cols: [cols.rateId, cols.systemChangesVersion, cols.modificationVersion],
		}),
		...multiIndexes({
			tName: orgTaxRateSnapshotTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
	],
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
	(cols) => [
		// uniqueIndex(`uq_${orgTaxRateTaxCategoryTableName}_category_id_rate`).on(cols.rateId, cols.categoryId),
		// index(`idx_${orgTaxRateTaxCategoryTableName}_created_at`).on(cols.createdAt),
		compositePrimaryKey({
			tName: orgTaxRateTaxCategoryTableName,
			cols: [cols.rateId, cols.categoryId],
		}),
		...multiIndexes({
			tName: orgTaxRateTaxCategoryTableName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
	],
);
