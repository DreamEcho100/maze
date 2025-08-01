import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userIdExtraConfig, fkCol: userIdFkCol } = buildFkUtils({
	cacheKey: "user",
	defaultColKey: "userId",
	defaultColName: "user_id",
	getTable: () => require("#db/schema/user/schema.js").user,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
