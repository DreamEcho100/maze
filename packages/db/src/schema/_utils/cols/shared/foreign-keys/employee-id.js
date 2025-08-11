import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: orgEmployeeIdFkExtraConfig, fkCol: orgEmployeeIdFkCol } = buildFkUtils({
	cacheKey: "orgEmployee",
	defaultColKey: "employeeId",
	defaultColName: "employee_id",
	getTable: () => requirePF("#schema/org/member/employee/schema.js").orgEmployee,
	// getTable: async () => (await import("#schema/org/member/employee/schema.js")).orgEmployee,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
