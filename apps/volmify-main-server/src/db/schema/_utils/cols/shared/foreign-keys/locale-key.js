// /**
//  * @import { locale } from "#db/schema/general/locale-and-currency/schema.js";
//  */
// /**
//  * @typedef {typeof locale} Table
//  */

import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "locale";
// const defaultColKey = "localeKey";
// const defaultColName = "locale_key";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const localeKeyFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

// /**
//  * @template {string} TTableName
//  * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
//  * @param {{
//  * 	tName: string;
//  * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
//  * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
//  * 	colFkKey?: keyof TColumnsMap & string;
//  * }} props
//  */
// export const localeKeyExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let locale;
// 	if (cache.has(cacheKey)) {
// 		locale = cache.get(cacheKey);
// 	} else {
// 		locale = require("#db/schema/general/locale-and-currency/schema.js").locale;
// 		cache.set(cacheKey, locale);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [locale.key],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

// export const { extraConfig: currencyCodeExtraConfig, fkCol: currencyCodeFkCol } = buildLocaleKeyFkUtils({
// 	cacheKey: "currency",
// 	defaultColKey: "currencyCode",
// 	defaultColName: "currency_code",
// 	getTable: () => require("#db/schema/general/locale-and-currency/schema.js").currency,
// 	getRefColumns: (table) => [table.code],
// 	defaultOnDelete: "cascade",
// });
export const { extraConfig: localeKeyExtraConfig, fkCol: localeKeyFkCol } = buildLocaleKeyFkUtils({
	cacheKey: "locale",
	defaultColKey: "localeKey",
	defaultColName: "locale_key",
	getTable: () => require("#db/schema/general/locale-and-currency/schema.js").locale,
	getRefColumns: (table) => [table.key],
	defaultOnDelete: "cascade",
});
