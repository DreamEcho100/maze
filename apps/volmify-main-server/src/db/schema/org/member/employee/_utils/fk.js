import { textCols } from "#db/schema/_utils/cols/text.js";

export const orgEmployeeIdFkCol = (name = "employee_id") =>
	textCols.idFk(name).references(
		() => {
			const { orgEmployee } = require("../schema.js");
			return orgEmployee.id;
		},
		{ onDelete: "cascade" },
	);
