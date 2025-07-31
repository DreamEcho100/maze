// /**
//  * @import { userProfile } from "#db/schema/user/profile/schema.js";
//  */
// /**
//  * @typedef {typeof userProfile} Table
//  */

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const _cacheKey = "userProfile";
// const defaultColKey = "userProfileId";
// const defaultColName = "user_profile_id";

// /**
//  * @param {{
//  * 	name?: string;
//  * }} [props]
//  */
// export const userProfileIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => user.id, { onDelete: "cascade" });

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
// export const userProfileIdExtraConfig = ({
// 	onDelete = "cascade",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let userProfile;
// 	if (cache.has(cacheId)) {
// 		userProfile = cache.get(cacheId);
// 	} else {
// 		userProfile = require("#db/schema/user/profile/schema.js").userProfile;
// 		cache.set(cacheId, userProfile);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [userProfile.id],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userProfileIdExtraConfig, fkCol: userProfileIdFkCol } = buildFkUtils({
	cacheKey: "userProfile",
	defaultColKey: "userProfileId",
	defaultColName: "user_profile_id",
	getTable: () => require("#db/schema/user/profile/schema.js").userProfile,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
