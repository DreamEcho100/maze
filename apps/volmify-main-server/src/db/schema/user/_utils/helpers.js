import { eq } from "drizzle-orm";
import { boolean, primaryKey } from "drizzle-orm/pg-core";
import { temporalCols } from "#db/schema/_utils/cols/temporal.js";
import { textCols } from "#db/schema/_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { table } from "#db/schema/_utils/tables.js";
import { locale } from "#db/schema/general/locale-and-currency/schema.js";

export const userTableName = "user";

// TODO: Needs a better generic handling to be able to infer the other internal defined fields on the `extraConfig` parameter
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
	 * 	extraConfig?: (self: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>, tableName: `${TTableName}_i18n`) => import("drizzle-orm/pg-core").PgTableExtraConfigValue[];
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
				// userId: fk(`${userTableName}_id`)
				// 	.references(() => user.id)
				// 	.notNull(),
				localeKey: textCols.localeKey().notNull(),
				isDefault: boolean("is_default").default(false),
				createdAt: temporalCols.audit.createdAt(),
				lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
				deletedAt: temporalCols.audit.deletedAt(),
			},
			(t) => [
				// TODO: Correct the `relations` `fields`
				primaryKey({ columns: [t[options.fkKey], t.localeKey] }),
				...multiForeignKeys({
					tName,
					indexAll: true,
					fkGroups: [
						{
							cols: [t.localeKey],
							foreignColumns: [locale.key],
							// afterBuild: (fk) => fk.onDelete("cascade"),
						},
					],
				}),
				uniqueIndex({ tName, cols: [t[options.fkKey], t.isDefault] }).where(eq(t.isDefault, true)),
				// index(shortenConstraintName(`idx_${tableName}_user_id`)).on(t.userId),
				// index(shortenConstraintName(`idx_${tableName}_${t[options.fkKey].name}`)).on(
				// 	t[options.fkKey],
				// ),
				...multiIndexes({
					tName,
					colsGrps: [
						// { cols: [t[options.fkKey]] },
						// { cols: [t.localeKey] },
						{ cols: [t.isDefault] },
						{ cols: [t.createdAt] },
						{ cols: [t.lastUpdatedAt] },
						{ cols: [t.deletedAt] },
					],
				}),
				...(options.extraConfig ? options.extraConfig(t, tName) : []),
			],
		);
	};
