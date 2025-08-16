import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const {
	extraConfig: orgMemberIdFkExtraConfig,
	fkCol: orgMemberIdFkCol,
} = buildFkUtils({
	cacheKey: "orgMember",
	defaultColKey: "memberId",
	defaultColName: "member_id",
	getTable: () => requirePF("#schema/org/member/schema.js").orgMember,
	// getTable: async () => (await import("#schema/org/member/schema.js")).orgMember,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
