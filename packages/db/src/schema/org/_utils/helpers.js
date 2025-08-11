import { eq, sql } from "drizzle-orm";
import { boolean } from "drizzle-orm/pg-core";
import { orgIdFkCol, orgIdFkExtraConfig } from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import { temporalCols } from "#schema/_utils/cols/temporal.js";
import { textCols } from "#schema/_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#schema/_utils/helpers.js";
import { table } from "#schema/_utils/tables.js";
import { locale } from "#schema/general/locale-and-currency/schema.js";

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
				orgId: orgIdFkCol().notNull(),
				localeKey: textCols.localeKey().notNull(),
				isDefault: boolean("is_default").default(false),
				createdAt: temporalCols.audit.createdAt().notNull(),
				lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
				deletedAt: temporalCols.audit.deletedAt(),
			},
			(cols) => [
				// TODO: Correct the `relations` `fields`
				// Q: Should `orgId` be added to the composite primary key too?
				compositePrimaryKey({ tName, cols: [cols[options.fkKey], cols.localeKey] }),
				...orgIdFkExtraConfig({
					tName,
					cols,
				}),
				...multiForeignKeys({
					tName,
					fkGroups: [
						{
							cols: [cols.localeKey],
							foreignColumns: [locale.key],
						},
					],
				}),
				uniqueIndex({ tName, cols: [cols[options.fkKey], cols.isDefault] }).where(
					eq(cols.isDefault, sql`TRUE`),
				),
				...multiIndexes({
					tName,
					colsGrps: [
						{ cols: [cols.orgId, cols.localeKey] },
						{ cols: [cols.orgId, cols.isDefault] },
						{ cols: [cols.orgId, cols.createdAt] },
						{ cols: [cols.orgId, cols.lastUpdatedAt] },
						{ cols: [cols.orgId, cols.deletedAt] },
					],
				}),
				...(options.extraConfig ? options.extraConfig(cols, tName) : []),
			],
		);
	};
