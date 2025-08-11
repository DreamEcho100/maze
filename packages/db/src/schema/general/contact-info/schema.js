import { eq, sql } from "drizzle-orm";
import { boolean, jsonb, text } from "drizzle-orm/pg-core";
import { multiIndexes, uniqueIndex } from "#schema/_utils/helpers.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";

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

/** @constant {string} contactInfoTableName */
const contactInfoTableName = "contact_info";
/**
 * @table contactInfo
 * Stores contact records associated with any entity in the system via polymorphic keys.
 * Ensures consistent communication workflows, structured routing, and contact verification.
 */
export const contactInfo = table(
	contactInfoTableName,
	{
		id: textCols.idPk().notNull(),

		/**
		 * Type of the entity this contact belongs to (e.g., "org", "user").
		 *
		 * @polymorphicKey
		 * Used together with `entityId` to uniquely associate contact with any supported entity.
		 * Enables shared contact architecture across diverse models.
		 */
		// TODO: Convert to enum
		entityType: text("entity_type").notNull(),

		/**
		 * ID of the specific entity instance (e.g., org ID, user ID).
		 *
		 * @relationContext
		 * Must correspond to a valid entity of the specified `entityType`.
		 */
		entityId: textCols.idFk("entity_id").notNull(),

		// Core contact fields
		name: textCols.name().notNull(),
		email: textCols.emailAddress("email").notNull(),
		phone: textCols.phoneNumber("phone"),
		address: text("address"),
		website: textCols.url("website"),

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
		// TODO: Convert to enum, example values: "primary", "billing", "support", "technical"
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

		// Contact info will be for the users and orgs, but how to consolidate the category as tags relations
		// /**
		//  * Optional tags for custom classification or filtering.
		//  *
		//  * @example ["legal", "franchise", "partner"]
		//  */
		// tags: text("tags").array(),

		/**
		 * When this contact was last verified (e.g., email confirmed, phone validated).
		 *
		 * @trust
		 * Used for trust scoring and prioritizing verified communication channels.
		 */
		verifiedAt: temporalCols.business.verifiedAt(),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},

	(cols) => [
		uniqueIndex({
			tName: contactInfoTableName,
			cols: [cols.entityType, cols.entityId, cols.isPrimary],
		}).where(eq(cols.isPrimary, sql`TRUE`)),
		uniqueIndex({
			tName: contactInfoTableName,
			cols: [cols.entityType, cols.entityId, cols.email],
		}),
		...multiIndexes({
			tName: contactInfoTableName,
			colsGrps: [
				{ cols: [cols.entityType, cols.entityId] },
				{ cols: [cols.email] },
				{ cols: [cols.contactType] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
				{ cols: [cols.verifiedAt] },
			],
		}),
	],
);
