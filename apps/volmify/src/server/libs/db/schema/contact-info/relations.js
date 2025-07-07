import { relations } from "drizzle-orm";
import { vendorContactInfo } from "../vendor/schema";
import { contactInfo } from "./schema";

/**
 * @fileoverview Contact Info Relations - Polymorphic Communication Integration
 *
 * @polymorphicPattern
 * Contact info uses polymorphic associations to connect with multiple entity types
 * without creating dedicated foreign key constraints. This enables flexible contact
 * management across vendors, organizations, users, and brands.
 *
 * @integrationStrategy
 * Relations are defined through junction tables and application-level associations
 * rather than strict foreign key constraints, providing flexibility for cross-entity
 * contact management while maintaining data integrity through business logic.
 */

/**
 * Contact Info Relations (Polymorphic Communication Hub)
 *
 * @polymorphicRole Central contact repository for all platform entities
 * Serves as the communication foundation for vendors, organizations, users,
 * and brands through polymorphic associations and junction table patterns.
 *
 * @communicationIntegration
 * Contact records are referenced by communication systems, billing processes,
 * support workflows, and marketing campaigns across different entity types.
 *
 * @vendorIntegration
 * Specific vendor contact management through junction table for enhanced
 * vendor-specific contact workflows and business relationship management.
 */
export const contactInfoRelations = relations(contactInfo, ({ many }) => ({
	/**
	 * @vendorSpecificContacts Enhanced vendor contact management
	 * @businessContext Vendor relationships often require specialized contact handling
	 * @workflowIntegration Supports vendor onboarding, payment, and partnership workflows
	 */
	vendorsContactInfo: many(vendorContactInfo),
}));
