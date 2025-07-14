import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, getLocaleKey, id, table, updatedAt } from "../../_utils/helpers.js";
import { org } from "../../org/schema.js";
import { locale } from "../locale-currency-market/schema.js";

// SEO status for content workflow
export const seoStatusEnum = pgEnum("seo_status", [
	"draft",
	"review",
	"approved",
	"published",
	"needs_update",
]);

// Change frequency enum for better validation
export const changeFreqEnum = pgEnum("change_freq", [
	"always",
	"hourly",
	"daily",
	"weekly",
	"monthly",
	"yearly",
	"never",
]);

// -------------------------------------
// MAIN SEO METADATA TABLE (No entityId/entityType)
// -------------------------------------
export const seoMetadata = table(
	"seo_metadata",
	{
		id: id.notNull(),
		orgId: text("org_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		isDefault: boolean("is_default").default(false),

		// SEO workflow status
		status: seoStatusEnum("status").default("draft"),

		// Basic meta tags
		// Core SEO fields (most commonly used)
		title: text("title"),
		description: text("description"),
		keywords: text("keywords").array(),
		image: text("image"),
		imageAlt: text("image_alt"),
		canonicalUrl: text("canonical_url"),
		focusKeyword: text("focus_keyword"),

		// Advanced SEO
		robots: text("robots").default("index,follow"),
		priority: decimal("priority", { precision: 2, scale: 1 }).default("0.5"),
		changeFreq: changeFreqEnum("change_freq").default("weekly"),

		// Language targeting
		hreflang: text("hreflang"),

		// The following is commented out as it is not needed for now.
		// // TODO: Make the following fields into a separate table
		// // Performance metrics
		// lastIndexed: timestamp("last_indexed"),
		// clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 2 }),
		// averagePosition: decimal("average_position", { precision: 5, scale: 2 }),
		// impressions: integer("impressions").default(0),
		// clicks: integer("clicks").default(0),
		// seoScore: integer("seo_score"),

		// The following is commented out as it is not needed for now.
		// // TODO: Make the following fields into a separate table
		// // Workflow
		// notes: text("notes"),
		// lastReviewedAt: timestamp("last_reviewed_at"),
		// reviewedBy: text("reviewed_by"),

		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_seo_organization").on(t.orgId),
		index("idx_seo_canonical").on(t.canonicalUrl),
		index("idx_seo_status").on(t.status),
		index("idx_seo_focus_keyword").on(t.focusKeyword),
		// index("idx_seo_locale").on(t.locale),
		// index("idx_seo_performance").on(t.clickThroughRate, t.averagePosition),
		// index("idx_seo_score").on(t.seoScore),
	],
);

// -------------------------------------
// OPEN GRAPH TABLE (Simplified - specifics moved to JSONB)
// -------------------------------------
export const seoOpenGraph = table(
	"seo_open_graph",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Core Open Graph fields
		title: text("title"),
		description: text("description"),
		image: text("image"),
		imageAlt: text("image_alt"),
		imageWidth: integer("image_width"),
		imageHeight: integer("image_height"),
		type: text("type").default("website"), // "website", "article", "video", "product"
		siteName: text("site_name"),
		url: text("url"),

		// Type-specific data in JSONB
		typeSpecificData: jsonb("type_specific_data"),
		/*
        Examples by type:
        
        Article (blog posts, courses):
        {
            "author": "John Doe",
            "section": "Programming", 
            "tags": ["react", "javascript"],
            "publishedTime": "2024-01-15T10:00:00Z",
            "modifiedTime": "2024-01-20T15:30:00Z"
        }
        
        Product (courses, products):
        {
            "price": "199.00",
            "currency": "USD", 
            "availability": "instock",
            "condition": "new",
            "brand": "Tech Academy"
        }
        
        Video (video lessons):
        {
            "url": "https://example.com/video.mp4",
            "duration": 1800,
            "width": 1920,
            "height": 1080,
            "tags": ["tutorial", "react"]
        }
        
        Profile (instructor profiles):
        {
            "firstName": "John",
            "lastName": "Doe", 
            "username": "johndoe",
            "gender": "male"
        }
        */

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_seo_og_metadata").on(t.seoMetadataId),
		index("idx_seo_og_type").on(t.type),

		// GIN index for searching type-specific data
		index("idx_seo_og_type_data").using("gin", t.typeSpecificData),
	],
);

// -------------------------------------
// TWITTER CARD TABLE (Simplified)
// -------------------------------------
export const seoTwitterCard = table(
	"seo_twitter_card",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Core Twitter Card fields
		card: text("card").default("summary_large_image"), // "summary", "summary_large_image", "app", "player"
		title: text("title"),
		description: text("description"),
		image: text("image"),
		imageAlt: text("image_alt"),
		site: text("site"), // @username
		creator: text("creator"), // @username

		// Card-specific data in JSONB
		cardSpecificData: jsonb("card_specific_data"),
		/*
        Examples by card type:
        
        App card:
        {
            "appName": "TechAcademy",
            "appId": "123456789",
            "appUrl": "techacademy://course/123",
            "appStoreCountry": "US"
        }
        
        Player card (video content):
        {
            "playerUrl": "https://example.com/player.html",
            "playerWidth": 1280,
            "playerHeight": 720,
            "playerStream": "https://example.com/stream.mp4"
        }
        
        Summary with large image:
        {
            "imageSize": "large",
            "imageFormat": "jpg"
        }
        */

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex("uq_seo_twitter_metadata").on(t.seoMetadataId),
		index("idx_seo_twitter_card_type").on(t.card),
		index("idx_seo_twitter_site").on(t.site),

		// GIN index for searching card-specific data
		index("idx_seo_twitter_card_data").using("gin", t.cardSpecificData),
	],
);

// -------------------------------------
// STRUCTURED DATA TABLE (Unchanged - already flexible)
// -------------------------------------
export const seoStructuredData = table(
	"seo_structured_data",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Schema.org type
		schemaType: text("schema_type").notNull(), // "Course", "Product", "Org", "FAQ", "Review"

		// The actual structured data
		data: jsonb("data").notNull(),

		// Metadata about the structured data
		isActive: boolean("is_active").default(true),
		priority: integer("priority").default(1), // For ordering multiple schemas

		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_seo_structured_metadata").on(t.seoMetadataId),
		index("idx_seo_structured_type").on(t.schemaType),
		index("idx_seo_structured_active").on(t.isActive),
		index("idx_seo_structured_priority").on(t.priority),

		// GIN index for searching within JSON data
		index("idx_seo_structured_data").using("gin", t.data),
	],
);

// -------------------------------------
// ALTERNATE URLS TABLE (Unchanged)
// -------------------------------------
export const seoAlternateUrl = table(
	"seo_alternate_url",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Alternate URL details
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		hreflang: text("hreflang").notNull(), // "en-US", "es-MX", "x-default"
		url: text("url").notNull(),

		// Is this the default/canonical for this locale?
		isDefault: boolean("is_default").default(false),

		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_seo_alternate_metadata").on(t.seoMetadataId),
		index("idx_seo_alternate_locale_key").on(t.localeKey),
		index("idx_seo_alternate_hreflang").on(t.hreflang),
		uniqueIndex("uq_seo_alternate_metadata_locale_key").on(t.seoMetadataId, t.localeKey),
	],
);

// -------------------------------------
// CUSTOM META TAGS TABLE (Unchanged)
// -------------------------------------
export const seoCustomMeta = table(
	"seo_custom_meta",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Meta tag details
		tagType: text("tag_type").notNull(), // "name", "property", "http-equiv"
		tagKey: text("tag_key").notNull(), // "theme-color", "apple-mobile-web-app-title"
		tagValue: text("tag_value").notNull(),

		// Grouping and ordering
		category: text("category"), // "mobile", "pwa", "apple", "microsoft"
		sortOrder: integer("sort_order").default(0),

		// Is this tag active?
		isActive: boolean("is_active").default(true),

		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_seo_meta_metadata").on(t.seoMetadataId),
		index("idx_seo_meta_type").on(t.tagType),
		index("idx_seo_meta_category").on(t.category),
		index("idx_seo_meta_active").on(t.isActive),
		index("idx_seo_meta_order").on(t.sortOrder),
		uniqueIndex("uq_seo_meta_tag").on(t.seoMetadataId, t.tagType, t.tagKey),
	],
);

// The following tables are commented out as they are not needed for now.
/*
// -------------------------------------
// SEO ISSUES TABLE (Unchanged)
// -------------------------------------
export const seoIssue = table(
	"seo_issue",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),

		// Issue details
		severity: text("severity").notNull(), // "error", "warning", "info"
		category: text("category").notNull(), // "title", "description", "keywords", "images", "structure"
		code: text("code").notNull(), // "TITLE_TOO_LONG", "MISSING_META_DESC", "NO_ALT_TEXT"

		// Issue content
		message: text("message").notNull(),
		suggestion: text("suggestion"),

		// Context data
		context: jsonb("context"),

		// Issue lifecycle
		isResolved: boolean("is_resolved").default(false),
		resolvedAt: timestamp("resolved_at"),
		resolvedBy: text("resolved_by"),

		// Auto-detection
		detectedAt: timestamp("detected_at").defaultNow(),
		lastCheckedAt: timestamp("last_checked_at").defaultNow(),

		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_seo_issue_metadata").on(t.seoMetadataId),
		index("idx_seo_issue_severity").on(t.severity),
		index("idx_seo_issue_category").on(t.category),
		index("idx_seo_issue_code").on(t.code),
		index("idx_seo_issue_resolved").on(t.isResolved),
		index("idx_seo_issue_detected").on(t.detectedAt),
	],
);

// -------------------------------------
// SEO AUDIT LOG (Updated to remove entity references)
// -------------------------------------
export const seoAuditLog = table(
	"seo_audit_log",
	{
		id: id.notNull(),
		seoMetadataId: text("seo_metadata_id")
			.notNull()
			.references(() => seoMetadata.id, { onDelete: "cascade" }),
		orgId: text("org_id")
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		// What changed
		changeType: text("change_type").notNull(), // "created", "updated", "performance_update", "status_change"
		changedTable: text("changed_table"), // "seo_metadata", "seo_open_graph", "seo_twitter_card", etc.
		changedFields: text("changed_fields").array(),

		// Before/after values
		beforeValue: jsonb("before_value"),
		afterValue: jsonb("after_value"),

		// Performance data snapshot
		performanceData: jsonb("performance_data"),

		// Who made the change
		changedBy: text("changed_by"),
		changeReason: text("change_reason"),

		createdAt,
	},
	(t) => [
		index("idx_seo_audit_metadata").on(t.seoMetadataId),
		index("idx_seo_audit_organization").on(t.orgId),
		index("idx_seo_audit_type").on(t.changeType),
		index("idx_seo_audit_table").on(t.changedTable),
		index("idx_seo_audit_date").on(t.createdAt),
	],
);
*/
