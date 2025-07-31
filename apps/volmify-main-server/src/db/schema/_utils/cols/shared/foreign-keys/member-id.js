/**
 * @import { orgMember } from "#db/schema/org/member/schema.js";
 */
/**
 * @typedef {typeof orgMember} Table
 */

import { foreignKey, index } from "#db/schema/_utils/helpers.js";
import { textCols } from "../../text";

const cache = new Map();
const cacheKey = "orgMember";
const defaultColKey = "memberId";
const defaultColName = "member_id";

/**
 * @param {{
 * 	name?: string;
 * }} [props]
 */
export const orgMemberIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

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
export const orgMemberIdExtraConfig = ({
	onDelete = "cascade",
	colKey = defaultColKey,
	...props
}) => {
	/** @type {Table} */
	let orgMember;
	if (cache.has(cacheKey)) {
		orgMember = cache.get(cacheKey);
	} else {
		orgMember = require("#db/schema/org/member/schema.js").orgMember;
		cache.set(cacheKey, orgMember);
	}

	return [
		foreignKey({
			tName: props.tName,
			// @ts-ignore
			cols: [props.cols[colKey]],
			foreignColumns: [orgMember.id],
		}).onDelete(onDelete),
		index({ tName: props.tName, cols: [props.cols[colKey]] }),
	];
};
