// import { foreignKey, index } from "#db/schema/_utils/helpers.js";
// import { textCols } from "./cols/text";

// const tableCache = new Map();
// /**
//  * @template TTable
//  * @template {keyof TTable & string} TKey
//  * @template {string} TName
//  * @param {{
//  * 	defaultColFkKey: TKey;
//  * 	defaultColFkName: TName;
//  * 	getTable: () => TTable
//  * 	refColKeys?: (keyof TTable & string)[];
//  * }} props
//  */
// export function buildFkUtils(props) {
// 	return {
// 		/**
// 		 * @param {{
// 		 * 	name?: string;
// 		 * }} [props]
// 		 */
// 		[`${props.defaultColFkKey}FkCol`]: ({ name = props.defaultColFkName } = {}) =>
// 			textCols.idFk(name), // .references(() => org.id, { onDelete: "cascade" });
// 		/**
// 		 * @template {string} TTableName
// 		 * @template {Record<string, import("drizzle-orm/pg-core").PgColumnBuilderBase>} TColumnsMap
// 		 * @param {{
// 		 * 	tName: string;
// 		 * 	onDelete?: "cascade" | "set null" | "restrict" | "no action";
// 		 * 	cols: import("drizzle-orm").BuildExtraConfigColumns<TTableName, TColumnsMap, 'pg'>;
// 		 * 	colFkKey?: keyof TColumnsMap;
// 		 * }} props
// 		 */
// 		[`${props.defaultColFkKey}ExtraConfig`]: ({
// 			onDelete = "cascade",
// 			colFkKey = props.defaultColFkKey,
// 			...innerProps
// 		}) => {
// 			/** @type {TTable} */
// 			let entity;
// 			if (tableCache.has(props.defaultColFkKey)) {
// 				entity = tableCache.get(props.defaultColFkKey);
// 			} else {
// 				entity =
// 					// require("#db/schema/general/locale-and-entity/schema.js").entity;
// 					props.getTable();

// 				tableCache.set(props.defaultColFkKey, entity);
// 			}

// 			const refColKeys = props.refColKeys;
// 			if (!refColKeys) {
// 				throw new Error(
// 					`Reference column keys must be provided for ${props.defaultColFkKey}ExtraConfig`,
// 				);
// 			}

// 			return [
// 				foreignKey({
// 					tName: innerProps.tName,
// 					cols: [innerProps.cols[colFkKey]],
// 					// @ts-ignore
// 					foreignColumns: refColKeys.map((key) => entity[key]),
// 				}).onDelete(onDelete),
// 				index({ tName: innerProps.tName, cols: [innerProps.cols[colFkKey]] }),
// 			];
// 		},
// 	};
// }

import { foreignKey, index } from "#db/schema/_utils/helpers.js";
import { textCols } from "./cols/text";

const tableCache = new Map();

/**
 * @template TTable
 * @param {{
 * 	cacheKey: string;
 * 	defaultColKey: string;
 * 	defaultColName: string;
 * 	getTable: () => TTable;
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
		/** @type {TTable} */
		let table;
		if (tableCache.has(config.cacheKey)) {
			table = tableCache.get(config.cacheKey);
		} else {
			table = config.getTable();
			tableCache.set(config.cacheKey, table);
		}

		const foreignColumns = config.getRefColumns(table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-ignore
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
 * 	getTable: () => TTable;
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
		/** @type {TTable} */
		let table;
		if (tableCache.has(config.cacheKey)) {
			table = tableCache.get(config.cacheKey);
		} else {
			table = config.getTable();
			tableCache.set(config.cacheKey, table);
		}

		const foreignColumns = config.getRefColumns(table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-ignore
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
 * 	getTable: () => TTable;
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
		/** @type {TTable} */
		let table;
		if (tableCache.has(config.cacheKey)) {
			table = tableCache.get(config.cacheKey);
		} else {
			table = config.getTable();
			tableCache.set(config.cacheKey, table);
		}

		const foreignColumns = config.getRefColumns(table);

		return [
			foreignKey({
				tName: props.tName,
				cols: [props.cols[colFkKey]],
				// @ts-ignore
				foreignColumns,
			}).onDelete(onDelete),
			index({ tName: props.tName, cols: [props.cols[colFkKey]] }),
		];
	};

	return { fkCol, extraConfig };
}
