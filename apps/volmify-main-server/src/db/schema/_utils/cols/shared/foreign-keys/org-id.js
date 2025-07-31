// /**
//  * @import { org } from "#db/schema/org/schema.js";
//  */
// /**
//  * @typedef {typeof org} Table
//  */

import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "org";
// const defaultColKey = "orgId";
// const defaultColName = "org_id";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const orgIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

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
// export const orgIdExtraConfig = ({ onDelete = "cascade", colFkKey = defaultColKey, ...props }) => {
// 	/** @type {Table} */
// 	let org;
// 	if (cache.has(cacheKey)) {
// 		org = cache.get(cacheKey);
// 	} else {
// 		org = require("#db/schema/org/schema.js").org;
// 		cache.set(cacheKey, org);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			// @ts-ignore
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [org.id],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

export const { extraConfig: orgIdExtraConfig, fkCol: orgIdFkCol } = buildFkUtils({
	cacheKey: "org",
	defaultColKey: "orgId",
	defaultColName: "org_id",
	getTable: () => require("#db/schema/org/schema.js").org,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
