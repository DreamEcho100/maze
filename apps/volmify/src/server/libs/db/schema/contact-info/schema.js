import { eq } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, table, updatedAt } from "../_utils/helpers";

export const contactInfo = table(
	"contact_info",
	{
		id,

		// Polymorphic relationship
		entityType: text("entity_type").notNull(), // "vendor", "organization", "user", "brand"
		entityId: text("entity_id").notNull(),

		// Contact details
		name: text("name").notNull(),
		email: text("email").notNull(),
		phone: text("phone"),
		address: text("address"),
		website: text("website"),
		socialMedia: jsonb("social_media"),

		// Contact metadata
		contactType: text("contact_type").default("primary"), // "primary", "billing", "technical", "support"
		isPrimary: boolean("is_primary").default(false),
		preferredContactMethod: text("preferred_contact_method").default("email"),
		contactHours: text("contact_hours"),
		notes: text("notes"),
		tags: text("tags").array(),

		// Verification
		verifiedAt: timestamp("verified_at"),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		index("idx_contact_info_entity").on(t.entityType, t.entityId),
		index("idx_contact_info_email").on(t.email),
		index("idx_contact_info_type").on(t.contactType),
		uniqueIndex("uq_contact_info_primary")
			.on(t.entityType, t.entityId, t.isPrimary)
			.where(eq(t.isPrimary, true)),
		uniqueIndex("uq_contact_info_email_entity").on(t.entityType, t.entityId, t.email),
	],
);
