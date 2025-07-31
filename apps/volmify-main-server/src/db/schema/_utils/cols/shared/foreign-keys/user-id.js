/**
 * @import { user } from "#db/schema/user/schema.js";
 */
/**
 * @typedef {typeof user} Table
 */

import { foreignKey, index } from "#db/schema/_utils/helpers.js";
import { textCols } from "../../text";

const cache = new Map();
const cacheKey = "user";
const defaultColKey = "userId";
const defaultColName = "user_id";

/**
 * @param {{
 * 	name?: string;
 * }} [props]
 */
export const userIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => user.id, { onDelete: "cascade" });

/**
 * @template {string} TTableName
 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
 * @param {{
 * 	tName: string;
 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
 * 	colKey?: keyof TColumnsMap & string;
 * }} props
 */
export const userIdExtraConfig = ({ onDelete = "cascade", colKey = defaultColKey, ...props }) => {
	/** @type {Table} */
	let user;
	if (cache.has(cacheKey)) {
		user = cache.get(cacheKey);
	} else {
		user = require("#db/schema/user/schema.js").user;
		cache.set(cacheKey, user);
	}

	return [
		foreignKey({
			tName: props.tName,
			cols: [props.cols[colKey]],
			foreignColumns: [user.id],
		}).onDelete(onDelete),
		index({ tName: props.tName, cols: [props.cols[colKey]] }),
	];
};
