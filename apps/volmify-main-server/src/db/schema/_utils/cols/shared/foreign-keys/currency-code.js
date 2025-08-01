// /**
//  * @import { currency } from "#db/schema/general/locale-and-currency/schema.js";
//  */
// /**
//  * @typedef {typeof currency} Table
//  */

import { buildCodeFkUtils } from "#db/schema/_utils/build-fk-utils.js";

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "currency";
// const defaultColKey = "currencyCode";
// const defaultColName = "currency_code";

// /**
//  *
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const currencyCodeFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

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
// export const currencyCodeExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let currency;
// 	if (cache.has(cacheKey)) {
// 		currency = cache.get(cacheKey);
// 	} else {
// 		currency = require("#db/schema/general/locale-and-currency/schema.js").currency;
// 		cache.set(cacheKey, currency);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [currency.code],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

export const { extraConfig: currencyCodeExtraConfig, fkCol: currencyCodeFkCol } = buildCodeFkUtils({
	cacheKey: "currency",
	defaultColKey: "currencyCode",
	defaultColName: "currency_code",
	getTable: () => require("#db/schema/general/locale-and-currency/schema.js").currency,
	getRefColumns: (table) => [table.code],
	defaultOnDelete: "cascade",
});
