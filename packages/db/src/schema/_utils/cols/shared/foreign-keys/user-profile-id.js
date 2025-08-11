import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: userProfileIdFkExtraConfig, fkCol: userProfileIdFkCol } = buildFkUtils({
	cacheKey: "userProfile",
	defaultColKey: "userProfileId",
	defaultColName: "user_profile_id",
	getTable: () => requirePF("#schema/user/profile/schema.js").userProfile,
	// getTable: async () => (await import("#schema/user/profile/schema.js")).userProfile,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
