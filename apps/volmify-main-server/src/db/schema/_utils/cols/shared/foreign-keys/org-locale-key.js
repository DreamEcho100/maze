// /**
//  * @import { orgLocale } from "#db/schema/org/locale-region/schema.js";
//  */
// /**
//  * @typedef {typeof orgLocale} Table
//  */

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "orgLocale";
// const defaultColKey = "localeKey";
// const defaultColName = "locale_key";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const orgLocaleKeyFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

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
// export const orgLocaleKeyExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let orgLocale;
// 	if (cache.has(cacheKey)) {
// 		orgLocale = cache.get(cacheKey);
// 	} else {
// 		orgLocale = require("#db/schema/org/locale-region/schema.js").orgLocale;
// 		cache.set(cacheKey, orgLocale);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [orgLocale.localeKey],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: orgLocaleKeyExtraConfig, fkCol: orgLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "orgLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => require("#db/schema/org/locale-region/schema.js").orgLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
