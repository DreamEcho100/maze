/**
 * @import { ForeignKeyBuilder } from "drizzle-orm/gel-core";
 * @import { SQL } from "drizzle-orm";
 */

import crypto from "node:crypto";
import {
	check as ck,
	foreignKey as fk,
	index as idx,
	primaryKey as pk,
	uniqueIndex as uqIdx,
} from "drizzle-orm/pg-core";

// const defaultMaxLength = 63; // Default max length for PostgreSQL identifiers
const defaultMaxLength = 55;

/**
 * Creates a deterministic shortened string that always produces the same result
 * @param {string} input - The input string to shorten
 * @param {number} maxLength - Maximum length of the output (default: 55, 63 is the limit for PostgreSQL identifiers)
 * @param {string} separator - Separator between meaningful part and hash (default: '_')
 * @returns {string} Shortened string that's always the same for the same input
 */
function deterministicShorten(input, maxLength = defaultMaxLength, separator = "_") {
	if (input.length <= maxLength) {
		return input;
	}

	// Create a deterministic hash of the input
	const hash = crypto.createHash("md5").update(input).digest("hex").substring(0, 8); // Use first 8 characters of hash

	// Calculate how much space we have for the meaningful part
	const hashPart = `${separator}${hash}`;
	const availableLength = maxLength - hashPart.length;

	if (availableLength <= 0) {
		// If even the hash is too long, just return the hash
		return hash.substring(0, maxLength);
	}

	// Extract meaningful parts (keep important segments)
	const parts = input.split("_").filter(Boolean);
	let meaningfulPart = "";

	// Try to include as many complete words as possible
	for (const part of parts) {
		const potential = meaningfulPart ? `${meaningfulPart}_${part}` : part;
		if (potential.length <= availableLength) {
			meaningfulPart = potential;
		} else {
			break;
		}
	}

	// If no complete words fit, use abbreviations
	if (!meaningfulPart) {
		meaningfulPart = parts
			.map((part) => part.substring(0, Math.max(1, Math.floor(availableLength / parts.length))))
			.join("_")
			.substring(0, availableLength);
	}

	return `${meaningfulPart}${hashPart}`;
}

/**
 * Specialized function for PostgreSQL constraint names
 * @param {string} constraintName - The constraint name to shorten
 * @returns {string} PostgreSQL-safe shortened constraint name
 */
function shortenConstraintName(constraintName) {
	return deterministicShorten(constraintName, defaultMaxLength);
}

/**
 * Create abbreviated versions while keeping meaning
 * @param {string} input - Input string
 * @param {Record<string, string>} abbreviations - Custom abbreviation mappings
 * @returns {string} Abbreviated string
 */
function createAbbreviation(input, abbreviations = {}) {
	// // Org-related
	// ['org', 'organization'],
	// // Product-related
	// ['product', 'variant', 'collection'],
	// // Payment-related
	// ['payment', 'plan', 'subscription', 'type'],
	// // Location-related
	// ['locale', 'region', 'country'],
	// // User-related
	// ['user', 'profile', 'job'],
	// // Meta-related
	// ['i18n', 'meta', 'seo', 'metadata'],
	const defaultAbbreviations = {
		internationalization: "i18n", // Longer words first
		Internationalization: "I18n", // Longer words first
		configuration: "config",
		Configuration: "Config",
		organization: "org",
		Organization: "Org",
		subscription: "sub",
		Subscription: "Sub",
		transaction: "txn",
		Transaction: "Txn",
		management: "mgmt",
		Management: "Mgmt",
		information: "info",
		Information: "Info",
		description: "desc",
		Description: "Desc",
		collection: "coll",
		Collection: "Coll",
		metadata: "meta",
		Metadata: "Meta",
		customer: "cust",
		Customer: "Cust",
		employee: "emp",
		Employee: "Emp",
		product: "prod",
		Product: "Prod",
		variant: "var",
		Variant: "Var",
		payment: "paym",
		Payment: "Paym",
		category: "catg",
		Category: "Catg",
		revenue: "revu",
		Revenue: "Revu",
		group: "grp",
		Group: "Grp",
		department: "dept",
		Department: "Dept",
		team: "tm",
		Team: "Tm",
		member: "mbr",
		Member: "Mbr",
		region: "regn",
		Region: "Regn",
		country: "ctry",
		Country: "Ctry",
		...abbreviations,
	};

	let result = input;

	// Sort by length (longest first) to avoid partial replacements
	const sortedAbbreviations = Object.entries(defaultAbbreviations).sort(
		([a], [b]) => b.length - a.length,
	);

	// Apply abbreviations - match word boundaries OR underscores
	sortedAbbreviations.forEach(([full, abbrev]) => {
		// Match word boundaries or words separated by underscores
		const regex = new RegExp(`(^|_)${full}(_|$)`, "gi");
		result = result.replace(regex, `$1${abbrev}$2`);
	});

	return result;
}

/**
 * @template T
 * @template U
 * @param {T[]} arr
 * @param {number} index
 * @param {(item: T, index: number, arr: T[]) => U} cb
 * @returns {U[]}
 */
const mapFrom = (arr, index, cb) => {
	/** @type {U[]} */
	const newArr = new Array(arr.length - index);

	for (let i = index; i < arr.length; i++) {
		newArr[i - index] = cb(arr[i], i - index, arr);
	}

	return newArr;
};
/** @param {string} str */
const toCamelCase = (str) => {
	if (!str || typeof str !== "string") {
		throw new Error(`\`${str}\` is not a valid string`);
	}
	const parts = str.split("_");

	if (parts.length === 1) {
		return str;
	}

	return `${parts[0]}${mapFrom(parts, 1, (word) => {
		if (!word) {
			return "";
		}

		if (word.length === 1) {
			return word;
		}

		return word[0].toUpperCase() + word.slice(1);
	}).join("")}`;
};
/**
 * @typedef {Parameters<typeof fk>[0]} FkPropsParameter
 */

/**
 * @param {string} prefix
 * @param {string} tName
 * @param {FkPropsParameter['columns']} columns
 * @returns {string}
 */
const buildConstraintName = (prefix, tName, columns) => {
	const cleanTableName = toCamelCase(createAbbreviation(tName));
	const cleanColumnNames = columns
		.map((col) => toCamelCase(createAbbreviation(col.name)))
		.join("_");
	return shortenConstraintName(`${prefix}_${cleanTableName}_${cleanColumnNames}`);
};

/*
const buildConstraintName = (prefix, tName, columns, debug = false) => {
  if (debug || process.env.NODE_ENV === 'development') {
    return `${prefix}_${tName}_${columns.map(c => c.name).join('_')}`;
  }
  // Your current logic
};
*/
/*
export const foreignKey = (props) => {
  return fk({
    columns: props.cols,
    foreignColumns: props.foreignColumns,
    name: shortenConstraintName(
      buildConstraintName("fk", props.tName, props.cols)
    ),
    // Add comment for debugging
    ...(process.env.NODE_ENV === 'development' && {
      comment: `FK: ${props.tName} -> ${props.foreignColumns.map(c => c.name).join(',')}`
    })
  });
};
*/
/*
// For debugging and migrations
export const constraintRegistry = new Map();

export const foreignKey = (props) => {
  const name = buildConstraintName("fk", props.tName, props.cols);
  constraintRegistry.set(name, {
    type: 'foreign_key',
    table: props.tName,
    columns: props.cols.map(c => c.name),
    references: props.foreignColumns.map(c => c.name)
  });
  return fk({ ... });
};
*/
/*
// Consider centralizing these
export const TABLE_NAMES = {
  ORG_PRODUCT_VARIANT_PAYMENT_PLAN_SUB_TYPE: 'org_product_variant_payment_plan_subscription_type',
  // Shortened version
  ORG_PROD_VAR_PAY_PLAN_SUB_TYPE: 'org_prod_var_pay_plan_sub_type'
} as const;
*/

/**
 * @param {{
 * 	cols: FkPropsParameter['columns'],
 * 	foreignColumns: FkPropsParameter['foreignColumns'],
 * 	tName: string;
 * }} props
 */
export const foreignKey = (props) => {
	return fk({
		columns: props.cols,
		foreignColumns: props.foreignColumns,
		name: shortenConstraintName(
			// `fk_${toCamelCase(createAbbreviation(props.tName))}_${props.columns.map((col) => toCamelCase(createAbbreviation(col.name))).join("_")}`,
			buildConstraintName("fk", props.tName, props.cols),
		),
		// // Add comment for debugging
		// ...(process.env.NODE_ENV === "development" && {
		// 	comment: `FK: ${props.tName} -> ${props.foreignColumns.map((c) => c.name).join(",")}`,
		// }),
	});
};
/**
 * @param {{
 * 	tName: string;
 * 	fkGroups: {
 * 		cols: FkPropsParameter['columns'],
 * 		foreignColumns: FkPropsParameter['foreignColumns'],
 * 		afterBuild?: (fk: ForeignKeyBuilder) => ForeignKeyBuilder
 * 	}[];
 * 	indexAll?: boolean;
 * }} props
 */
export const multiForeignKeys = ({ indexAll = true, ...props }) => {
	const arr = [];
	for (const item of props.fkGroups) {
		const result = foreignKey({
			cols: item.cols,
			foreignColumns: item.foreignColumns,
			tName: props.tName,
		});

		arr.push(item.afterBuild ? item.afterBuild(result) : result);
		if (indexAll) {
			arr.push(index({ tName: props.tName, cols: item.cols }));
		}
	}

	return arr;
};

/**
 * @param {{
 * 	tName: string;
 * 	cols: FkPropsParameter['columns'];
 * }} props
 */
export const index = (props) => {
	const res = idx(
		shortenConstraintName(
			// `idx_${toCamelCase(props.tName)}_${props.columns.map((col) => toCamelCase(col.name)).join("_")}`,
			buildConstraintName("idx", props.tName, props.cols),
		),
	).on(...props.cols);
	return res;
};
/**
 * @param {{
 * 	tName: string;
 * 	colsGrps: { cols: FkPropsParameter['columns'] }[];
 * }} props
 */
export const multiIndexes = (props) => {
	return props.colsGrps.map((item) => index({ tName: props.tName, cols: item.cols }));
};

/**
 * @param {{
 * 	tName: string;
 * 	cols: FkPropsParameter['columns'];
 * }} props
 */
export const uniqueIndex = (props) => {
	return uqIdx(
		shortenConstraintName(
			// `uq_${toCamelCase(props.tName)}_${props.columns.map((col) => toCamelCase(col.name)).join("_")}`,
			buildConstraintName("uq", props.tName, props.cols),
		),
	).on(...props.cols);
};

/**
 * @param {{
 * 	tName: string;
 * 	cols: FkPropsParameter['columns'];
 * }} props
 */
export const compositePrimaryKey = (props) => {
	return pk({
		columns: props.cols,
		name: shortenConstraintName(
			// `pk_${toCamelCase(props.tName)}_${props.columns.map((col) => toCamelCase(col.name)).join("_")}`,
			buildConstraintName("cpk", props.tName, props.cols),
		),
	});
};

/**
 * @param {{
 * 	tName: string;
 * 	condition: SQL<unknown>;
 * 	postfix: string;
 * }} props
 */
export const check = (props) => {
	return ck(
		shortenConstraintName(
			`ck_${toCamelCase(createAbbreviation(props.tName))}${
				props.postfix ? `_${toCamelCase(createAbbreviation(props.postfix))}` : ""
			}`,
		),
		props.condition,
	);
};
