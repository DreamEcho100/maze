import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: userIdFkExtraConfig, fkCol: userIdFkCol } =
	buildFkUtils({
		cacheKey: "user",
		defaultColKey: "userId",
		defaultColName: "user_id",
		getTable: () => requirePF("#schema/user/schema.js").user,
		// getTable: async () => (await import("#schema/user/schema.js")).user,
		getRefColumns: (table) => [table.id],
		defaultOnDelete: "cascade",
	});
