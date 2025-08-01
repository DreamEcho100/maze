import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userJobProfileIdExtraConfig, fkCol: userJobProfileIdFkCol } =
	buildFkUtils({
		cacheKey: "userJobProfile",
		defaultColKey: "userJobProfileId",
		defaultColName: "user_job_profile_id",
		getTable: () => require("#db/schema/user/profile/job/schema.js").userJobProfile,
		// Note: `userJobProfile` is 1-1 relationship and the id for it is the `userProfileId` field too
		getRefColumns: (table) => [table.userProfileId],
		defaultOnDelete: "set null",
	});
