import { buildFkUtils } from "../../../../_utils/build-fk-utils";
import { orgEmployee } from "../schema";

export const { extraConfig: orgEmployeeIdFkExtraConfig, fkCol: orgEmployeeIdFkCol } = buildFkUtils({
	cacheKey: "orgEmployee",
	defaultColKey: "employeeId",
	defaultColName: "employee_id",
	table: orgEmployee,
	// getTable: async () => (await import("#schema/org/member/employee/schema.js")).orgEmployee,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "cascade",
});
