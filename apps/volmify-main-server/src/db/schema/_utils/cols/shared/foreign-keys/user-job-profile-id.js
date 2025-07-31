// /**
//  * @import { userJobProfile } from "#db/schema/user/profile/job/schema.js";
//  */
// /**
//  * @typedef {typeof userJobProfile} Table
//  */

// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "../../text";

// const cache = new Map();
// const cacheKey = "userJobProfile";
// const defaultColKey = "userJobProfileId";
// const defaultColName = "user_job_profile_id";

// /**
//  *
//  * @param {{
//  *  name?: string;
//  * }} [props]
//  */
// export const userJobProfileIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // // .references(() => user.id, { onDelete: "cascade" });

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
// export const userJobProfileIdExtraConfig = ({
// 	onDelete = "set null",
// 	colFkKey = defaultColKey,
// 	...props
// }) => {
// 	/** @type {Table} */
// 	let userJobProfile;
// 	if (cache.has(cacheKey)) {
// 		userJobProfile = cache.get(cacheKey);
// 	} else {
// 		userJobProfile = require("#db/schema/user/profile/job/schema.js").userJobProfile;
// 		cache.set(cacheKey, userJobProfile);
// 	}

// 	return [
// 		foreignKey({
// 			tName: props.tName,
// 			cols: [props.cols[colFkKey]],
// 			foreignColumns: [userJobProfile.userProfileId],
// 		}).onDelete(onDelete),
// 		index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
// 	];
// };

import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userJobProfileIdExtraConfig, fkCol: userJobProfileIdFkCol } =
	buildFkUtils({
		cacheKey: "userJobProfile",
		defaultColKey: "userJobProfileId",
		defaultColName: "user_job_profile_id",
		getTable: () => require("#db/schema/user/profile/job/schema.js").userJobProfile,
		getRefColumns: (table) => [table.userProfileId],
		defaultOnDelete: "set null",
	});
