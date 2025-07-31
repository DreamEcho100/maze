/**
 * @import { orgEmployee } from "#db/schema/org/member/employee/schema.js";
 */
/**
 * @typedef {typeof orgEmployee} Table
 */

import { foreignKey, index } from "#db/schema/_utils/helpers.js";
import { textCols } from "../../text";

const cache = new Map();
const cacheKey = "orgEmployee";
const defaultColKey = "employeeId";
const defaultColName = "employee_id";

/**
 * @param {{
 * 	name?: string;
 * }} [props]
 */
export const orgEmployeeIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => org.id, { onDelete: "cascade" });

/**
 * @template {string} TTableName
 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
 * @param {{
 * 	tName: string;
 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
 * 	colKey?: keyof TColumnsMap & string;
 * }} props
 */
export const orgEmployeeIdExtraConfig = ({
	onDelete = "cascade",
	colKey = defaultColKey,
	...props
}) => {
	/** @type {Table} */
	let orgEmployee;
	if (cache.has(cacheKey)) {
		orgEmployee = cache.get(cacheKey);
	} else {
		orgEmployee = require("#db/schema/org/member/employee/schema.js").orgEmployee;
		cache.set(cacheKey, orgEmployee);
	}

	return [
		foreignKey({
			tName: props.tName,
			cols: [props.cols[colKey]],
			foreignColumns: [orgEmployee.id],
		}).onDelete(onDelete),
		index({ tName: props.tName, cols: [props.cols[colKey]] }),
	];
};
