import { buildFkUtils } from "../../../_utils/build-fk-utils.js";
import { orgMember } from "../00-schema.js";

export const { extraConfig: orgMemberIdFkExtraConfig, fkCol: orgMemberIdFkCol } = buildFkUtils({
	cacheKey: "orgMember",
	defaultColKey: "memberId",
	defaultColName: "member_id",
	table: orgMember,
	// getTable: async () => (await import("#schema/org/member/schema.js")).orgMember,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
