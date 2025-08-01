import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: orgIdExtraConfig, fkCol: orgIdFkCol } = buildFkUtils({
	cacheKey: "org",
	defaultColKey: "orgId",
	defaultColName: "org_id",
	getTable: () => require("#db/schema/org/schema.js").org,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
