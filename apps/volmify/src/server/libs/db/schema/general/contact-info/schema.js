import { eq } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { table, temporalCols, textCols } from "../../_utils/helpers";

/**
 * @file Contact Info Schema – Universal Communication Hub
 *
 * @context
 * This polymorphic contact info table enables centralized communication management
 * for all Volmify entities — orgs, brands, users, and professionals. It serves
 * as the single source of truth for emails, phone numbers, and outreach preferences.
 *
 * @architecture Polymorphic Entity Pattern
 * Each record links to a specific entity type and ID, allowing consistent handling of contact
 * information across a wide variety of entity shapes without schema duplication.
 *
 * @keyFeatures
 * - ✅ Multiple contact types per entity (e.g., billing, support, technical)
 * - 📇 Entity-agnostic storage via polymorphic `entityType` and `entityId`
 * - 🔒 Verification support for compliance and trust scoring
 * - 📞 Communication preferences (method, hours, etc.)
 * - 🌍 Flexible metadata and social handles for multi-channel outreach
 *
 * @usedBy
 * - 📬 Messaging & Campaigns (email/SMS/voice)
 * - 💳 Billing & Invoicing
 * - 🛠️ Support Routing
 * - ✅ Verification & Compliance
 * - 📊 Analytics & Scoring
 *
 * @businessValue
 * Enables scalable and trustworthy communication across Volmify’s multi-tenant architecture
 * while respecting regulatory compliance (e.g., GDPR, CAN-SPAM). Designed to grow with
 * increasingly complex entity relationships and communication needs.
 */

/**
 * @table contactInfo
 * Stores contact records associated with any entity in the system via polymorphic keys.
 * Ensures consistent communication workflows, structured routing, and contact verification.
 */
export const contactInfo = table(
	"contact_info",
	{
		id: textCols.id().notNull(),

		/**
		 * Type of the entity this contact belongs to (e.g., "org", "user").
		 *
		 * @polymorphicKey
		 * Used together with `entityId` to uniquely associate contact with any supported entity.
		 * Enables shared contact architecture across diverse models.
		 */
		entityType: text("entity_type").notNull(),

		/**
		 * ID of the specific entity instance (e.g., org ID, user ID).
		 *
		 * @relationContext
		 * Must correspond to a valid entity of the specified `entityType`.
		 */
		entityId: text("entity_id").notNull(),

		// Core contact fields
		name: textCols.name().notNull(),
		email: text("email").notNull(),
		phone: text("phone"),
		address: text("address"),
		website: text("website"),

		/**
		 * Structured social media/contact handles (e.g., Twitter, LinkedIn).
		 *
		 * @usage
		 * Enables cross-platform communication and marketing reach.
		 */
		socialMedia: jsonb("social_media"),

		/**
		 * Describes the role of this contact (e.g., "billing", "technical").
		 *
		 * @default "primary"
		 * @routing
		 * Guides communication routing and fallback logic when no specific type is requested.
		 */
		contactType: text("contact_type").default("primary"),

		/**
		 * Whether this contact is the default for its entity.
		 *
		 * @enforcedBy
		 * Uniquely enforced per entity via DB constraint.
		 */
		isPrimary: boolean("is_primary").default(false),

		/**
		 * Preferred method of communication for this contact.
		 *
		 * @values "email" | "phone" | ...
		 * @compliance
		 * Used to honor contact preferences during outreach.
		 */
		preferredContactMethod: text("preferred_contact_method").default("email"),

		contactHours: text("contact_hours"),
		notes: text("notes"),

		/**
		 * Optional tags for custom classification or filtering.
		 *
		 * @example ["legal", "franchise", "partner"]
		 */
		tags: text("tags").array(),

		/**
		 * When this contact was last verified (e.g., email confirmed, phone validated).
		 *
		 * @trust
		 * Used for trust scoring and prioritizing verified communication channels.
		 */
		verifiedAt: timestamp("verified_at"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
		deletedAt: temporalCols.deletedAt(),
	},

	(t) => [
		/**
		 * Fast lookup for all contacts related to a specific entity.
		 */
		index("idx_contact_info_entity").on(t.entityType, t.entityId),

		/**
		 * Enables fast lookup by email for verification and deduplication.
		 */
		index("idx_contact_info_email").on(t.email),

		/**
		 * Used to filter contacts by type in workflows (e.g., "find billing contact").
		 */
		index("idx_contact_info_type").on(t.contactType),

		/**
		 * Ensures only one primary contact exists per entity.
		 *
		 * @enforcesUniqueness
		 * Prevents ambiguity in default contact resolution.
		 */
		uniqueIndex("uq_contact_info_primary")
			.on(t.entityType, t.entityId, t.isPrimary)
			.where(eq(t.isPrimary, true)),

		/**
		 * Prevents the same email from being duplicated under a single entity.
		 *
		 * @dataQuality
		 * Helps maintain clean contact datasets for reliable outreach.
		 */
		uniqueIndex("uq_contact_info_email_entity").on(
			t.entityType,
			t.entityId,
			t.email,
		),

		index("idx_contact_info_verified").on(t.verifiedAt),
		index("idx_contact_info_created_at").on(t.createdAt),
		index("idx_contact_info_updated_at").on(t.updatedAt),
		index("idx_contact_info_deleted_at").on(t.deletedAt),
	],
);
