import { eq, sql } from "drizzle-orm";
import { boolean, primaryKey } from "drizzle-orm/pg-core";
import { buildFkUtils } from "../../_utils/build-fk-utils.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { locale } from "../../0-local/00-schema.js";
import { user } from "../00-schema.js";

export const { extraConfig: userIdFkExtraConfig, fkCol: userIdFkCol } = buildFkUtils({
	cacheKey: "user",
	defaultColKey: "userId",
	defaultColName: "user_id",
	table: user,
	// getTable: async () => (await import("#schema/user/schema.js")).user,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});

/**
 * @template {string} TTableName
 * @param {TTableName} baseTableName
 */
export const buildUserI18nTable =
	(baseTableName) =>
	/**
	 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
	 * @param {TColumnsMap} columns
	 * @param {{
	 * 	fkKey: keyof TColumnsMap;
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
				userId: userIdFkCol().notNull(),
				localeKey: textCols.localeKey().notNull(),
				isDefault: boolean("is_default").default(false),
				createdAt: temporalCols.audit.createdAt().notNull(),
				lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
				deletedAt: temporalCols.audit.deletedAt(),
			},
			(cols) => [
				// TODO: Correct the `relations` `fields`
				primaryKey({ columns: [cols[options.fkKey], cols.localeKey] }),
				...userIdFkExtraConfig({
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
				uniqueIndex({
					tName,
					cols: [cols[options.fkKey], cols.isDefault],
				}).where(eq(cols.isDefault, sql`TRUE`)),
				...multiIndexes({
					tName,
					colsGrps: [
						{ cols: [cols.userId, cols.localeKey] },
						{ cols: [cols.userId, cols.isDefault] },
						{ cols: [cols.userId, cols.createdAt] },
						{ cols: [cols.userId, cols.lastUpdatedAt] },
						{ cols: [cols.userId, cols.deletedAt] },
					],
				}),
				...(options.extraConfig ? options.extraConfig(cols, tName) : []),
			],
		);
	};
