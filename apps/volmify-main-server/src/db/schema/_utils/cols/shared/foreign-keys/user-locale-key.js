// /**
//  * @import { userLocale } from "#db/schema/user/locale/schema.js";
//  */
// /**
//  * @typedef {typeof userLocale} Table
//  */

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "userLocale";
// const defaultColKey = "localeKey";
// const defaultColName = "locale_key";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const userLocaleKeyFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => user.id, { onDelete: "cascade" });

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
// export const userLocaleKeyExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let userLocale;
// 	if (cache.has(cacheKey)) {
// 		userLocale = cache.get(cacheKey);
// 	} else {
// 		userLocale = require("#db/schema/user/locale/schema.js").userLocale;
// 		cache.set(cacheKey, userLocale);
// 	}
// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [userLocale.localeKey],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userLocaleKeyExtraConfig, fkCol: userLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "userLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => require("#db/schema/user/locale/schema.js").userLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
