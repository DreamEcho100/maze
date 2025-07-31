// /**
//  * @import { orgMember } from "#db/schema/org/member/schema.js";
//  */
// /**
//  * @typedef {typeof orgMember} Table
//  */

import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "orgMember";
// const defaultColKey = "memberId";
// const defaultColName = "member_id";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const orgMemberIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

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
// export const orgMemberIdExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let orgMember;
// 	if (cache.has(cacheKey)) {
// 		orgMember = cache.get(cacheKey);
// 	} else {
// 		orgMember = require("#db/schema/org/member/schema.js").orgMember;
// 		cache.set(cacheKey, orgMember);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			// @ts-ignore
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [orgMember.id],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

// export const { extraConfig: currencyCodeExtraConfig, fkCol: currencyCodeFkCol } = buildFkUtils({
// 	cacheKey: "currency",
// 	defaultColKey: "currencyCode",
// 	defaultColName: "currency_code",
// 	getTable: () => require("#db/schema/general/locale-and-currency/schema.js").currency,
// 	getRefColumns: (table) => [table.code],
// 	defaultOnDelete: "cascade",
// });

export const { extraConfig: orgMemberIdExtraConfig, fkCol: orgMemberIdFkCol } = buildFkUtils({
	cacheKey: "orgMember",
	defaultColKey: "memberId",
	defaultColName: "member_id",
	getTable: () => require("#db/schema/org/member/schema.js").orgMember,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
