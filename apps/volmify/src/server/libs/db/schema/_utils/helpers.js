import {
	boolean,
	decimal,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { ulid } from "ulid";
import { currency, locale } from "../general/locale-currency-market/schema";
import { seoMetadata } from "../general/seo/schema";
import { orgLocale } from "../org/locale-region/schema";
import { orgMember } from "../org/member/schema";
import { org } from "../org/schema";
import { user } from "../user/schema";

const createId = ulid;

// export const idCol = text("id").primaryKey().notNull().$default(createId);
// export const idFkCol = text;
// export const name = varchar("name", { length: 128 });
// export const slug = varchar("slug", { length: 128 });
// export const createdAt = timestamp("created_at", { precision: 3 }).notNull().defaultNow();
// export const lastUpdatedAt = timestamp("last_updated_at", { precision: 3 });
// export const deletedAt = timestamp("deleted_at", { precision: 3 });
// export const getLocaleKey =
// 	/** @param {string} name */
// 	(name) => varchar(name, { length: 10 }); // .notNull().default("en-US");
export const table = pgTable;

export const textCols = {
	id: () => text("id").primaryKey().$default(createId),
	idFk: text,
	// Identifiers & URLs (ASCII-optimized)
	slug: () => varchar("slug", { length: 128 }), // URL-safe, indexed frequently
	key: () => varchar("key", { length: 128 }), // Permission keys, API keys
	/** @param {string} [name] */
	code: (name) => varchar(name ?? "code", { length: 32 }), // Currency codes, locale codes
	/** @param {string} name */
	longCode: (name) => varchar(name, { length: 32 }),

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
	tagline: () => varchar("tagline", { length: 384 }), // Marketing taglines

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
	description: () => text("description"),
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
};

export const numericCols = {
	// IDs and Counters
	// id: () => text("id").notNull(), // UUID strings for multi-tenant
	sortOrder: () => integer("sort_order").default(0), // Course module ordering
	version: () => integer("version").default(1), // Content versioning

	// Financial (precision-critical)
	price: () => decimal("price", { precision: 10, scale: 2 }), // Currency amounts
	percentage: () => decimal("percentage", { precision: 5, scale: 2 }), // 0.00-100.00%
	revenueShare: () => decimal("revenue_share", { precision: 5, scale: 2 }), // Creator splits

	// Metrics & Analytics
	count: () => integer("count").default(0), // Enrollment counts
	rating: () => decimal("rating", { precision: 3, scale: 2 }), // 0.00-10.00 ratings
	duration: () => integer("duration_minutes"), // Time in minutes

	// Access Control
	/** @param {string} [name] */
	accessTier: (name) => integer(name ?? "access_tier").default(1), // 1-10 tier levels
	priority: ({ name = "priority", default: defaultVal = 0 }) =>
		integer(name).default(defaultVal), // Rule priority
};

export const temporalCols = {
	// Standard lifecycle (millisecond precision for audit)
	createdAt: () =>
		timestamp("created_at", { precision: 3, withTimezone: true }).defaultNow(),
	lastUpdatedAt: () =>
		timestamp("last_updated_at", {
			precision: 3,
			withTimezone: true,
		}).defaultNow(),
	deletedAt: () =>
		timestamp("deleted_at", { precision: 3, withTimezone: true }),

	// Business events (second precision sufficient)
	startsAt: () =>
		timestamp("starts_at", { precision: 0, withTimezone: true }).defaultNow(),
	endsAt: () => timestamp("ends_at", { precision: 0, withTimezone: true }),
	expiresAt: () =>
		timestamp("expires_at", { precision: 0, withTimezone: true }),

	// User activity (minute precision for analytics)
	lastAccessedAt: () =>
		timestamp("last_accessed_at", { precision: 0, withTimezone: true }),
	completedAt: () =>
		timestamp("completed_at", { precision: 0, withTimezone: true }),
};

export const sharedCols = {
	// Multi-tenant foundations
	orgIdFk: () =>
		textCols.idFk("org_id").references(() => org.id, { onDelete: "cascade" }),
	orgMemberIdFk: () =>
		textCols
			.idFk("member_id")
			.references(() => orgMember.id, { onDelete: "cascade" }),

	userIdFk: () =>
		textCols.idFk("user_id").references(() => user.id, { onDelete: "cascade" }),

	// Localization columns
	/** @param {string} [name] */
	localeKey: (name = "locale_key") => varchar(name, { length: 10 }),

	/** @param {string} name */
	localeKeyFk: (name) =>
		sharedCols.localeKey(name).references(() => locale.key, {
			onDelete: "cascade",
		}),
	/** @param {string} [name] */
	orgLocaleKeyFk: (name = "local_key") =>
		sharedCols.localeKey(name).references(() => orgLocale.localeKey, {
			onDelete: "cascade",
		}),

	isDefault: () => boolean("is_default").default(false),

	// Business status columns
	isActive: () => boolean("is_active").default(true),
	isSystem: () => boolean("is_system").default(false), // System vs custom entities
	isFeatured: () => boolean("is_featured").default(false), // Marketing prominence

	// E-commerce columns
	currencyCode: () =>
		varchar("currency_code", { length: 3 }).references(() => currency.code),

	// Creator economy columns
	attribution: () => jsonb("attribution"), // Creator/brand attribution
	compensation: () => jsonb("compensation"), // Revenue sharing config

	// SEO & Marketing
	seoMetadataIdFk: () =>
		textCols
			.idFk("seo_metadata_id")
			.references(() => seoMetadata.id, { onDelete: "set null" }),
};

export const ecommerceCols = {
	// Pricing (high precision for international currencies)
	price: () => decimal("price", { precision: 12, scale: 4 }), // Supports micro-currencies
	basePrice: () => decimal("base_price", { precision: 12, scale: 4 }),
	finalPrice: () => decimal("final_price", { precision: 12, scale: 4 }),

	// Creator economy revenue sharing
	revenueShare: () => decimal("revenue_share", { precision: 7, scale: 4 }), // 0.0000-100.0000%
	fixedAmount: () => decimal("fixed_amount", { precision: 10, scale: 2 }),

	// Quantities and limits
	quantity: () => integer("quantity"), // Stock quantities
	maxEnrollments: () => integer("max_enrollments"), // Course limits
	currentEnrollments: () => integer("current_enrollments").default(0),

	// SKU and product identifiers
	sku: () => varchar("sku", { length: 64 }), // Product SKUs
	barcode: () => varchar("barcode", { length: 128 }), // International barcodes
};

export const lmsCols = {
	// Progress tracking (frequent updates)
	progressPercentage: () =>
		decimal("progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
	completionRate: () => decimal("completion_rate", { precision: 5, scale: 2 }),

	// Time tracking (minutes for analytics)
	estimatedDuration: () => integer("estimated_duration_minutes"),
	actualDuration: () => integer("actual_duration_minutes"),
	totalLearningTime: () => integer("total_learning_minutes").default(0),

	// Ratings and feedback (community quality)
	levelRating: () => integer("level_rating"), // 1-10 prerequisite level
	difficultyRating: () => integer("difficulty_rating"), // 1-10 complexity
	avgRating: () =>
		decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"), // 0.00-10.00

	// Access control
	requiredAccessTier: () => integer("required_access_tier").default(1),
	maxAccessTier: () => integer("max_access_tier").default(10),
};

// export const i18nIndexPatterns = {
//   // Frequently queried in user's locale
//   primaryLocale: (table, field) => [
//     index(`idx_${table}_${field}_locale`).on(table.localeKey, table[field]),
//     index(`idx_${table}_${field}_default`).on(table[field]).where(eq(table.isDefault, true)),
//   ],

//   // Full-text search across locales
//   searchable: (table, field) => [
//     index(`idx_${table}_${field}_search`).using('gin', table[field]), // PostgreSQL full-text
//   ],
// };

// // Audit trail
// auditTrail: () => ({
//   createdAt: timestamp("created_at", { precision: 3 }).defaultNow(),
//   lastUpdatedAt: timestamp("last_updated_at", { precision: 3 }).defaultNow(),
//   createdBy: fk("created_by").references(() => user.id),
//   updatedBy: fk("updated_by").references(() => user.id),
// }),

// export const performanceIndexes = {
//   // Multi-tenant queries (most frequent)
//   orgScoped: (table, fields) => [
//     index(`idx_${table}_org_${fields.join('_')}`).on(table.orgId, ...fields.map(f => table[f])),
//   ],

//   // User activity queries
//   userActivity: (table) => [
//     index(`idx_${table}_user_activity`).on(table.userId, table.lastAccessedAt),
//     index(`idx_${table}_completion`).on(table.userId, table.completedAt),
//   ],

//   // E-commerce queries
//   productCatalog: (table) => [
//     index(`idx_${table}_active_featured`).on(table.isActive, table.isFeatured, table.sortOrder),
//     index(`idx_${table}_pricing`).on(table.currencyCode, table.price),
//   ],

//   // Search and filtering
//   searchOptimized: (table, searchField) => [
//     index(`idx_${table}_${searchField}_search`).using('gin', table[searchField]),
//     index(`idx_${table}_locale_search`).on(table.localeKey, table[searchField]),
//   ],
// };
