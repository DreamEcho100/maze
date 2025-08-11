import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: orgIdFkExtraConfig, fkCol: orgIdFkCol } = buildFkUtils({
	cacheKey: "org",
	defaultColKey: "orgId",
	defaultColName: "org_id",
	getTable: () => requirePF("#schema/org/schema.js").org,
	// getTable: async () => (await import("#schema/org/schema.js")).org,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
