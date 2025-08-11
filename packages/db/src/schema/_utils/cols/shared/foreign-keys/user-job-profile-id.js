import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: userJobProfileIdFkExtraConfig, fkCol: userJobProfileIdFkCol } =
	buildFkUtils({
		cacheKey: "userJobProfile",
		defaultColKey: "userJobProfileId",
		defaultColName: "user_job_profile_id",
		getTable: () => requirePF("#schema/user/profile/job/schema.js").userJobProfile,
		// getTable: async () => (await import("#schema/user/profile/job/schema.js")).userJobProfile,
		// Note: `userJobProfile` is 1-1 relationship and the id for it is the `userProfileId` field too
		getRefColumns: (table) => [table.userProfileId],
		defaultOnDelete: "set null",
	});
