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

export const numericCols = {
	// IDs and Counters
	// id: () => text("id").notNull(), // UUID strings for multi-tenant
	sortOrder: () => integer("sort_order").default(0), // Course module ordering
	version: () => integer("version").default(1), // Content versioning

	// Financial (precision-critical)
	revenueShare: () => decimal("revenue_share", { precision: 5, scale: 2 }), // Creator splits

	// Metrics & Analytics
	count: () => integer("count").default(0), // Enrollment counts
	duration: () => integer("duration_minutes"), // Time in minutes

	// Access Control
	/** @param {string} [name] */
	accessTier: (name) => integer(name ?? "access_tier").default(1), // 1-10 tier levels
	priority: ({ name = "priority", default: defaultVal = 0 }) =>
		integer(name).default(defaultVal), // Rule priority
	//
	// ✅ FINANCIAL: High-precision currency amounts
	currency: {
		// Standard currency amounts (supports micro-currencies)
		amount: (name = "amount") => decimal(name, { precision: 12, scale: 4 }),
		price: (name = "price") => decimal(name, { precision: 12, scale: 4 }),
		basePrice: (name = "base_price") =>
			decimal(name, { precision: 12, scale: 4 }),
		finalPrice: (name = "final_price") =>
			decimal(name, { precision: 12, scale: 4 }),

		// Discount/coupon values
		discountValue: (name = "value") =>
			decimal(name, { precision: 12, scale: 4 }),
		couponValue: (name = "value") => decimal(name, { precision: 12, scale: 4 }),

		// Balances and credits
		balance: (name = "balance") => decimal(name, { precision: 12, scale: 4 }),
		credit: (name = "credit") => decimal(name, { precision: 12, scale: 4 }),
	},

	// ✅ PERCENTAGES: Standardized percentage handling
	percentage: {
		// Standard percentages (0.00-100.00%)
		rate: (name = "percentage") => decimal(name, { precision: 5, scale: 2 }),
		taxRate: (name = "rate") => decimal(name, { precision: 5, scale: 4 }), // Higher precision for tax
		discountPercentage: (name = "percentage") =>
			decimal(name, { precision: 5, scale: 2 }),
		revenueShare: (name = "revenue_share") =>
			decimal(name, { precision: 5, scale: 4 }),
		vatRate: (name = "vat_rate") => decimal(name, { precision: 5, scale: 4 }),
	},

	// ✅ EXCHANGE RATES: Ultra-high precision
	exchangeRate: {
		rate: (name = "rate") => decimal(name, { precision: 16, scale: 8 }), // Exchange rate precision
		roundingIncrement: (name = "rounding_increment") =>
			decimal(name, { precision: 10, scale: 6 }),
	},

	// ✅ RATINGS & METRICS: User-facing metrics
	rating: {
		// Course/content ratings (0.00-10.00)
		courseRating: (name = "rating") =>
			decimal(name, { precision: 3, scale: 2 }),
		avgRating: (name = "avg_rating") =>
			decimal(name, { precision: 3, scale: 2 }),
		difficultyRating: (name = "difficulty_rating") =>
			decimal(name, { precision: 3, scale: 2 }),
	},
	// rating_: (name = "rating") => integer(name),

	// ✅ ANALYTICS: Performance metrics
	analytics: {
		// Click-through rates, conversion rates
		conversionRate: (name = "conversion_rate") =>
			decimal(name, { precision: 5, scale: 4 }),
		clickThroughRate: (name = "click_through_rate") =>
			decimal(name, { precision: 5, scale: 4 }),
		averagePosition: (name = "average_position") =>
			decimal(name, { precision: 5, scale: 2 }),
	},
};

export const temporalCols = {
	// Business events (second precision sufficient)
	startsAt: () =>
		timestamp("starts_at", { precision: 3, withTimezone: true }).defaultNow(),
	endsAt: () => timestamp("ends_at", { precision: 3, withTimezone: true }),
	expiresAt: () =>
		timestamp("expires_at", { precision: 3, withTimezone: true }),

	// User activity (minute precision for analytics)
	lastAccessedAt: () =>
		timestamp("last_accessed_at", { precision: 3, withTimezone: true }),
	completedAt: () =>
		timestamp("completed_at", { precision: 3, withTimezone: true }),

	// ✅ AUDIT TRAIL: High precision for compliance
	audit: {
		createdAt: (name = "created_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		lastUpdatedAt: (name = "last_updated_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		deletedAt: (name = "deleted_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ BUSINESS EVENTS: Second precision sufficient
	business: {
		startsAt: (name = "starts_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		endsAt: (name = "ends_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		expiresAt: (name = "expires_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		publishedAt: (name = "published_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		scheduledAt: (name = "scheduled_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ FINANCIAL: High precision for financial events
	financial: {
		issuedAt: (name = "issued_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		paidAt: (name = "paid_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		refundedAt: (name = "refunded_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		validFrom: (name = "valid_from") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		validTo: (name = "valid_to") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ USER ACTIVITY: Minute precision for analytics
	activity: {
		lastAccessedAt: (name = "last_accessed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		completedAt: (name = "completed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		lastSeenAt: (name = "last_seen_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		joinedAt: (name = "joined_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		invitedAt: (name = "invited_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		acceptedAt: (name = "accepted_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		declinedAt: (name = "declined_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ SYSTEM EVENTS: Millisecond precision for debugging
	system: {
		processedAt: (name = "processed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		syncedAt: (name = "synced_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		indexedAt: (name = "indexed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},
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
	currencyCodeFk: (name = "currency_code") =>
		textCols.currencyCode(name).references(() => currency.code),

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
