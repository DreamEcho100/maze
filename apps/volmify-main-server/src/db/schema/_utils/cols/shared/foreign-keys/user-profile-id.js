import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userProfileIdFkExtraConfig, fkCol: userProfileIdFkCol } = buildFkUtils({
	cacheKey: "userProfile",
	defaultColKey: "userProfileId",
	defaultColName: "user_profile_id",
	getTable: () => require("#db/schema/user/profile/schema.js").userProfile,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
