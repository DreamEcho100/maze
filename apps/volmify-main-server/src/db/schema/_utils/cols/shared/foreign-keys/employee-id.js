import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: orgEmployeeIdExtraConfig, fkCol: orgEmployeeIdFkCol } = buildFkUtils({
	cacheKey: "orgEmployee",
	defaultColKey: "employeeId",
	defaultColName: "employee_id",
	getTable: () => require("#db/schema/org/member/employee/schema.js").orgEmployee,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
