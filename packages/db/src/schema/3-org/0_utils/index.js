import { buildFkUtils } from "../../_utils/build-fk-utils.js";
import { org } from "../00-schema.js";

export const { extraConfig: orgIdFkExtraConfig, fkCol: orgIdFkCol } = buildFkUtils({
	cacheKey: "org",
	defaultColKey: "orgId",
	defaultColName: "org_id",
	// table: () => require("../../../../../schema/org/schema.js").org,
	// getTable: async () => (await import("#schema/org/schema.js")).org,
	table: org,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
