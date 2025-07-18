import { eq } from "drizzle-orm";
import { boolean, index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, getLocaleKey, table, updatedAt } from "../../_utils/helpers";
import { orgLocale } from "../locale-region/schema";

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
	 * 	fkKey: keyof TColumnsMap;
	 * 	extraConfig?: (self: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>, tableName: `${TTableName}_i18n`) => import("drizzle-orm/pg-core").PgTableExtraConfigValue[];
	 * }} options
	 */
	(columns, options) => {
		/** @type {`${TTableName}_i18n`} */
		const tableName = `${baseTableName}_i18n`;
		return table(
			tableName,
			{
				...columns,
				// orgId: fk(`${orgTableName}_id`)
				// 	.references(() => org.id)
				// 	.notNull(),
				localeKey: getLocaleKey("org_locale_key")
					.notNull()
					.references(() => orgLocale.localeKey),
				isDefault: boolean("is_default").default(false),
				createdAt,
				updatedAt,
				deletedAt,
			},
			(t) => [
				// TODO: Correct the `relations` `fields`
				primaryKey({ columns: [t[options.fkKey], t.localeKey] }),
				uniqueIndex(`uq_${tableName}_default`)
					.on(t[options.fkKey], t.isDefault)
					.where(eq(t.isDefault, true)),
				// index(`idx_${tableName}_org_id`).on(t.orgId),
				index(`idx_${tableName}_org_locale_key`).on(t.localeKey),
				index(`idx_${tableName}_default`).on(t.isDefault),
				index(`idx_${tableName}_created_at`).on(t.createdAt),
				index(`idx_${tableName}_updated_at`).on(t.updatedAt),
				index(`idx_${tableName}_deleted_at`).on(t.deletedAt),
				...(options.extraConfig ? options.extraConfig(t, tableName) : []),
			],
		);
	};
