import { jsonb, text, uuid, varchar } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

const createId = () => v7();

export const textCols = {
	idPk: () => uuid("id").primaryKey().$defaultFn(createId),
	idFk: uuid,
	// Identifiers & URLs (ASCII-optimized)
	slug: (name = "slug") => varchar(name, { length: 128 }), // URL-safe, indexed frequently
	key: () => varchar("key", { length: 128 }), // Permission keys, API keys
	/** @param {string} [name] */
	code: (name) => varchar(name ?? "code", { length: 32 }), // Currency codes, locale codes
	/** @param {string} name */
	longCode: (name) => varchar(name, { length: 32 }),
	symbol: (name = "symbol") => varchar(name, { length: 16 }), // Currency symbols, short codes

	/** @param {string} [name] */
	localeKey: (name = "locale_key") => varchar(name, { length: 10 }),

	// Names & Titles (UTF-8 optimized for international)
	/**
	 * IDENTIFIERS (short, indexed, internal)
	 *
	 * ```
	 *   name: {
	 *     type: () => varchar("name", { length: 256 }),
	 *     usage: "Internal identifiers, API references, system names",
	 *     indexed: true,
	 *     examples: ["org_name", "product_name", "brand_name"]
	 *   }
	 * ```
	 *
	 * Org, product, user names
	 */
	/** @param {string} [name] */
	name: (name) => varchar(name ?? "name", { length: 256 }),
	displayName: () => varchar("display_name", { length: 256 }), // User display names
	/**
	 * DISPLAY (medium, searchable, customer-facing)
	 * ```
	 *   title: {
	 *     type: () => varchar("title", { length: 512 }),
	 *     usage: "Customer-facing display, marketing content, course titles",
	 *     indexed: "partial", // Consider gin/gist for full-text search
	 *     examples: ["course_title", "lesson_title", "promotion_title"]
	 *   }
	 * ```
	 *
	 * Course titles, lesson titles
	 *
	 * @param {string} [name]
	 */
	title: (name) => varchar(name ?? "title", { length: 768 }),

	// Short descriptions (indexed searchable)
	// Q: Should it be called excerpt or summary?
	/** @param {string} name */
	shortDescription: (name) => varchar(name, { length: 1536 }), // Product descriptions
	tagline: (name = "tagline") => varchar(name, { length: 384 }), // Marketing taglines

	// Long content (not indexed)
	/**
	 * MARKETING (long, full-text searchable)
	 *
	 * ```
	 *   description: {
	 *     type: () => text("description"),
	 *     usage: "Marketing copy, course descriptions, detailed content",
	 *     indexed: "full-text",
	 *     examples: ["course_description", "product_description"]
	 *   }
	 * ```
	 *
	 * Course descriptions
	 */
	description: (name = "description") => text(name),
	/**
	 * CONTENT (unlimited, not indexed)
	 *
	 * ```
	 *   content: {
	 *     type: () => text("content"),
	 *     usage: "Lesson content, email templates, rich text",
	 *     indexed: false,
	 *     examples: ["lesson_content", "email_content"]
	 *   }
	 * ```
	 *
	 * Lesson content
	 */
	content: () => text("content"),
	story: () => text("story"), // Brand stories

	// Metadata & Configuration

	metadata: () => jsonb("metadata"), // Flexible data
	settings: () => jsonb("settings"), // Configuration data

	// ✅ NEW: Specific business domains
	currencyCode: (name = "currency_code") => varchar(name, { length: 3 }), // ISO 4217
	countryCode: (name = "country_code") => varchar(name, { length: 5 }),
	localeCode: (name = "locale_code") => varchar(name, { length: 10 }), // en-US, ar-EG
	emailAddress: (name = "email") => varchar(name, { length: 320 }), // RFC 5321 limit
	phoneNumber: (name = "phone") => varchar(name, { length: 32 }), // International format

	// ✅ NEW: System identifiers
	provider: (name = "provider") => varchar(name, { length: 64 }), // OAuth providers, etc.
	source: (name = "source") => varchar(name, { length: 64 }), // Data sources
	category: (name = "category") => varchar(name, { length: 128 }), // Category names

	// ✅ NEW: Financial/E-commerce
	displayFormat: (name = "display_format") => varchar(name, { length: 64 }), // Currency format
	sku: (name = "sku") => varchar(name, { length: 64 }), // Product SKUs
	barcode: (name = "barcode") => varchar(name, { length: 128 }), // International barcodes

	// ✅ NEW: URLs and identifiers
	url: (name = "url") => varchar(name, { length: 2048 }), // URLs (reasonable limit)
	imageUrl: (name = "image_url") => varchar(name, { length: 2048 }), // Image URLs
	// socialHandle: (name) => varchar(name, { length: 64 }),                  // @username
};
