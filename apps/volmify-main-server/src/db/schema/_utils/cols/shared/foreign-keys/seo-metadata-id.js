/**
 * @import { seoMetadata } from "#db/schema/general/seo/schema.js";
 */
/**
 * @typedef {typeof seoMetadata} Table
 */

import { foreignKey, index } from "#db/schema/_utils/helpers.js";
import { textCols } from "../../text";

const cache = new Map();
const cacheKey = "seoMetadata";
const defaultColKey = "seoMetadataId";
const defaultColName = "seo_metadata_id";

/**
 * @param {{
 * 	name?: string;
 * }} [props]
 */
export const seoMetadataIdFkCol = ({ name = defaultColName } = {}) => textCols.idFk(name); // .references(() => seoMetadata.id, { onDelete: "cascade" });

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
export const seoMetadataIdExtraConfig = ({
	onDelete = "set null",
	colKey = defaultColKey,
	...props
}) => {
	/** @type {Table} */
	let seoMetadata;
	if (cache.has(cacheKey)) {
		seoMetadata = cache.get(cacheKey);
	} else {
		seoMetadata = require("#db/schema/general/seo/schema.js").seoMetadata;
		cache.set(cacheKey, seoMetadata);
	}

	return [
		foreignKey({
			tName: props.tName,
			cols: [props.cols[colKey]],
			foreignColumns: [seoMetadata.id],
		}).onDelete(onDelete),
		index({ tName: props.tName, cols: [props.cols[colKey]] }),
	];
};
