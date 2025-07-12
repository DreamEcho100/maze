import { eq } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, table, updatedAt } from "../_utils/helpers";

/**
 * @fileoverview Contact Info Schema - Polymorphic Communication Hub
 *
 * @architecture Polymorphic Association Pattern
 * Implements a single contact information table that can be associated with any entity
 * type (vendor, organization, user, brand) using polymorphic relationships. This design
 * provides consistent contact management across all platform entities while avoiding
 * schema duplication and maintaining referential flexibility.
 *
 * @designPattern Polymorphic Entity + Contact Type Strategy
 * - Polymorphic: Single table handles contact info for multiple entity types
 * - Contact Types: Support multiple contact purposes (primary, billing, technical, support)
 * - Verification System: Contact validation and trust scoring
 * - Communication Preferences: Method and timing preferences for outreach
 *
 * @integrationPoints
 * - Communication System: Primary data source for email, SMS, and call campaigns
 * - Billing System: Billing contact information for invoicing and payments
 * - Support System: Technical and support contact routing
 * - Verification Services: Email/phone verification workflows
 * - Compliance: Contact preference management for GDPR/CAN-SPAM compliance
 * - Analytics: Communication effectiveness tracking and contact scoring
 *
 * @businessValue
 * Centralizes contact management across all platform entities, enabling consistent
 * communication workflows, compliance management, and contact verification. Supports
 * complex organizational structures with multiple contact types and communication
 * preferences while maintaining data integrity and avoiding schema proliferation.
 *
 * @scalingDesign
 * - Polymorphic Pattern: Scales to any number of entity types without schema changes
 * - Contact Types: Flexible contact categorization for diverse business needs
 * - Verification System: Automated contact validation and trust scoring
 * - Communication Preferences: Granular control over contact methods and timing
 */

/**
 * Universal Contact Information Hub
 *
 * @businessLogic Centralized contact management for all platform entities
 * Provides unified contact information storage and management across vendors,
 * organizations, users, and brands, enabling consistent communication workflows
 * and contact verification processes.
 *
 * @polymorphicPattern
 * Single table approach eliminates schema duplication and provides consistent
 * contact management patterns across different entity types. Each entity can
 * have multiple contact records for different purposes (billing, technical, etc.).
 *
 * @communicationFoundation
 * Serves as the primary data source for all outbound communications including
 * emails, SMS, phone calls, and marketing campaigns. Contact preferences and
 * verification status influence communication routing and compliance.
 *
 * @verificationSystem
 * Built-in verification tracking ensures contact reliability and supports
 * trust scoring for communication effectiveness and fraud prevention.
 *
 * @complianceSupport
 * Contact preferences and verification status support GDPR, CAN-SPAM, and
 * other regulatory compliance requirements for communication management.
 */
export const contactInfo = table(
	"contact_info",
	{
		id: id.notNull(),

		/**
		 * @polymorphicKey Entity type identifier for polymorphic associations
		 * @businessRule Must match existing entity types in the system
		 * @integrationContext Used by application layer to route contact operations
		 */
		entityType: text("entity_type").notNull(), // "organization_brand", "user_instructor_profile", "organization", "user"

		/**
		 * @polymorphicKey Entity instance identifier for contact association
		 * @businessRule Must reference valid entity ID of the specified type
		 * @integrationContext Combined with entityType for complete entity reference
		 */
		entityId: text("entity_id").notNull(),

		// Contact details
		name: text("name").notNull(),
		email: text("email").notNull(),
		phone: text("phone"),
		address: text("address"),
		website: text("website"),

		/**
		 * @communicationChannels Social media contact points and handles
		 * @businessRule Flexible JSON structure supports various social platforms
		 * @integrationContext Used by marketing and support systems for multi-channel outreach
		 */
		socialMedia: jsonb("social_media"),

		/**
		 * @contactStrategy Contact purpose and routing strategy
		 * @businessRule Enables entity-specific contact routing and workflow management
		 * @communicationContext Influences how contact information is used in different scenarios
		 */
		contactType: text("contact_type").default("primary"), // "primary", "billing", "technical", "support"

		/**
		 * @businessRule One primary contact per entity for default communication
		 * @workflowDefault Primary contact used when specific contact type not specified
		 */
		isPrimary: boolean("is_primary").default(false),

		/**
		 * @communicationPreference Default communication method for this contact
		 * @complianceSupport Respects contact preferences for regulatory compliance
		 */
		preferredContactMethod: text("preferred_contact_method").default("email"),

		contactHours: text("contact_hours"),
		notes: text("notes"),

		/**
		 * @organizationalMetadata Flexible tagging for contact categorization
		 * @businessRule Supports custom contact classification and filtering
		 */
		tags: text("tags").array(),

		/**
		 * @verificationSystem Contact verification timestamp for trust scoring
		 * @complianceRequirement Verified contacts have higher trust and deliverability
		 * @communicationContext Influences sending priorities and routing decisions
		 */
		verifiedAt: timestamp("verified_at"),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		/**
		 * @polymorphicIndex Primary index for entity-based contact lookups
		 * @performanceCritical High-frequency queries for entity contact retrieval
		 */
		index("idx_contact_info_entity").on(t.entityType, t.entityId),

		/**
		 * @communicationIndex Email-based contact lookups for verification and deduplication
		 */
		index("idx_contact_info_email").on(t.email),

		/**
		 * @contactStrategyIndex Contact type filtering for routing and workflow management
		 */
		index("idx_contact_info_type").on(t.contactType),

		/**
		 * @businessConstraint Ensures exactly one primary contact per entity
		 * @workflowIntegrity Prevents primary contact conflicts and ensures clear defaults
		 */
		uniqueIndex("uq_contact_info_primary")
			.on(t.entityType, t.entityId, t.isPrimary)
			.where(eq(t.isPrimary, true)),

		/**
		 * @dataIntegrity Prevents duplicate email addresses per entity
		 * @communicationIntegrity Ensures clean contact data for effective outreach
		 */
		uniqueIndex("uq_contact_info_email_entity").on(t.entityType, t.entityId, t.email),
	],
);
