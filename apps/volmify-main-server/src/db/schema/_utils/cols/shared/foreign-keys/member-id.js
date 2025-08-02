import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: orgMemberIdFkExtraConfig, fkCol: orgMemberIdFkCol } = buildFkUtils({
	cacheKey: "orgMember",
	defaultColKey: "memberId",
	defaultColName: "member_id",
	getTable: () => require("#db/schema/org/member/schema.js").orgMember,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
