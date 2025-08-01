import { eq, sql } from "drizzle-orm";
import { boolean, primaryKey } from "drizzle-orm/pg-core";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { table } from "#db/schema/_utils/tables.js";
import { locale } from "#db/schema/general/locale-and-currency/schema.js";

export const orgTableName = "org";

// TODO: Needs a better generic handling to be able to infer the other internal defined fields on the `extraConfig` parameter
/**
 * @template {string} TTableName
 * @param {TTableName} baseTableName
 */
export const buildOrgI18nTable =
	(baseTableName) =>
	/**
	 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
	 * @param {TColumnsMap} columns
	 * @param {{
	 * 	fkKey: keyof TColumnsMap & string;
	 * 	extraConfig?: (self: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>, tName: `${TTableName}_i18n`) => import("drizzle-orm/pg-core").PgTableExtraConfigValue[];
	 * }} options
	 */
	(columns, options) => {
		if (baseTableName.endsWith("_i18n")) {
			throw new Error(
				`The base table name "${baseTableName}" should not end with "_i18n". Please provide a base table name without the i18n suffix.`,
			);
		}

		/** @type {`${TTableName}_i18n`} */
		const tName = `${baseTableName}_i18n`;
		return table(
			tName,
			{
				...columns,
				// orgId: fk(`${orgTableName}_id`)
				// 	.references(() => org.id)
				// 	.notNull(),
				localeKey: textCols.localeKey().notNull(),
				isDefault: boolean("is_default").default(false),
				createdAt: temporalCols.audit.createdAt(),
				lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
				deletedAt: temporalCols.audit.deletedAt(),
			},
			(cols) => [
				// TODO: Correct the `relations` `fields`
				primaryKey({ columns: [cols[options.fkKey], cols.localeKey] }),
				// uniqueIndex(`uq_${tName}_default`)
				// 	.on(t[options.fkKey], t.isDefault)
				// 	.where(eq(t.isDefault, true)),
				...multiForeignKeys({
					tName,
					indexAll: true,
					fkGroups: [
						{
							cols: [cols.localeKey],
							foreignColumns: [locale.key],
							// afterBuild: (fk) => fk.onDelete("cascade"),
						},
					],
				}),
				uniqueIndex({ tName, cols: [cols[options.fkKey], cols.isDefault] }).where(
					eq(cols.isDefault, sql`TRUE`),
				),
				// index(shortenConstraintName(`idx_${tName}_org_id`)).on(t.orgId),
				// index(shortenConstraintName(`idx_${tName}_${t[options.fkKey].name}`)).on(
				// 	t[options.fkKey],
				// ),
				// index(shortenConstraintName(`idx_${tName}_org_locale_key`)).on(t.localeKey),
				// index(shortenConstraintName(`idx_${tName}_default`)).on(t.isDefault),
				// index(shortenConstraintName(`idx_${tName}_created_at`)).on(t.createdAt),
				// index(shortenConstraintName(`idx_${tName}_last_updated_at`)).on(t.lastUpdatedAt),
				// index(shortenConstraintName(`idx_${tName}_deleted_at`)).on(t.deletedAt),
				...multiIndexes({
					tName,
					colsGrps: [
						// { cols: [t[options.fkKey]] },
						{ cols: [cols.isDefault] },
						{ cols: [cols.createdAt] },
						{ cols: [cols.lastUpdatedAt] },
						{ cols: [cols.deletedAt] },
					],
				}),
				...(options.extraConfig ? options.extraConfig(cols, tName) : []),
			],
		);
	};
