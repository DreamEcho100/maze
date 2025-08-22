import { textCols } from "./cols/text";
import { foreignKey, index } from "./helpers";

const tableCache = new Map();

/**
 * @template TTable
 * @param {{
 * 	cacheKey: string;
 * 	defaultColKey: string;
 * 	defaultColName: string;
 * 	table: TTable;
 * 	getRefColumns: (table: TTable) => any[];
 * 	defaultOnDelete?: "cascade" | "set null" | "restrict" | "no action";
 * }} config
 */
export function buildFkUtils(config) {
	/**
	 * @param {{ name?: string }} [props]
	 */
	const fkCol = ({ name = config.defaultColName } = {}) => textCols.idFk(name);

	/**
	 * @template {string} TTableName
	 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
	 * @param {{
	 * 	tName: string;
	 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
	 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
	 * 	colFkKey?: keyof TColumnsMap & string;
	 * }} props
	 */
	const extraConfig = ({
		onDelete = config.defaultOnDelete ?? "cascade",
		colFkKey = config.defaultColKey,
		...props
	}) => {
		const foreignColumns = config.getRefColumns(config.table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-expect-error
				foreignColumns,
			}).onDelete(onDelete),
			index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
		];
	};

	return { fkCol, extraConfig };
}

/**
 * @template TTable
 * @param {{
 * 	cacheKey: string;
 * 	defaultColKey: string;
 * 	defaultColName: string;
 * 	table: TTable;
 * 	getRefColumns: (table: TTable) => any[];
 * 	defaultOnDelete?: "cascade" | "set null" | "restrict" | "no action";
 * }} config
 */
export function buildCodeFkUtils(config) {
	/**
	 * @param {{ name?: string }} [props]
	 */
	const fkCol = ({ name = config.defaultColName } = {}) => textCols.code(name);

	/**
	 * @template {string} TTableName
	 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
	 * @param {{
	 * 	tName: string;
	 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
	 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
	 * 	colFkKey?: keyof TColumnsMap & string;
	 * }} props
	 */
	const extraConfig = ({
		onDelete = config.defaultOnDelete ?? "cascade",
		colFkKey = config.defaultColKey,
		...props
	}) => {
		// /** @type {TTable} */
		// let table;
		// if (tableCache.has(config.cacheKey)) {
		// 	table = tableCache.get(config.cacheKey);
		// } else {
		// 	table = config.table();
		// 	tableCache.set(config.cacheKey, table);
		// }

		const foreignColumns = config.getRefColumns(config.table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-expect-error
				foreignColumns,
			}).onDelete(onDelete),
			index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
		];
	};

	return { fkCol, extraConfig };
}

/**
 * @template TTable
 * @param {{
 * 	cacheKey: string;
 * 	defaultColKey: string;
 * 	defaultColName: string;
 * 	table: TTable;
 * 	getRefColumns: (table: TTable) => any[];
 * 	defaultOnDelete?: "cascade" | "set null" | "restrict" | "no action";
 * }} config
 */
export function buildLocaleKeyFkUtils(config) {
	/**
	 * @param {{ name?: string }} [props]
	 */
	const fkCol = ({ name = config.defaultColName } = {}) => textCols.localeKey(name);

	/**
	 * @template {string} TTableName
	 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
	 * @param {{
	 * 	tName: string;
	 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
	 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
	 * 	colFkKey?: keyof TColumnsMap & string;
	 * }} props
	 */
	const extraConfig = ({
		onDelete = config.defaultOnDelete ?? "cascade",
		colFkKey = config.defaultColKey,
		...props
	}) => {
		// /** @type {TTable} */
		// let table;
		// if (tableCache.has(config.cacheKey)) {
		// 	table = tableCache.get(config.cacheKey);
		// } else {
		// 	table = config.getTable();
		// 	tableCache.set(config.cacheKey, table);
		// }

		const foreignColumns = config.getRefColumns(config.table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-expect-error
				foreignColumns,
			}).onDelete(onDelete),
			index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
		];
	};

	return { fkCol, extraConfig };
}
