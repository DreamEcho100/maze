import { relations } from "drizzle-orm";
import { userInstructorProfileContactInfo } from "../../user/profile/instructor/schema";
import { contactInfo } from "./schema";

/**
 * @file Contact Info Relations – Polymorphic Integration Layer
 *
 * @context
 * This file defines how the universal `contactInfo` table connects to various platform entities
 * using polymorphic and junction-table-based relationships — enabling flexible, multi-entity
 * communication flows without tight foreign key coupling.
 *
 * @architecture
 * - 🔄 Polymorphic Pattern: One contact table, many associated entities
 * - 🧩 Soft Relations: Avoids hard FKs in favor of decoupled, scalable linking
 * - 🔌 Integration-Ready: Allows new entity types to connect to contact info with minimal friction
 *
 * @useCases
 * - Instructor profile contact management
 * - Future support for org, user, and brand-level contacts
 * - Dynamic communication routing, support escalation, and partner outreach
 *
 * @why
 * Traditional one-to-one contact models break down in multi-tenant, multi-role platforms like Volmify.
 * This polymorphic structure enables flexible contact ownership, communication orchestration, and
 * tailored contact strategies across all professional and org layers.
 */

/**
 * Defines polymorphic contact associations for platform entities.
 *
 * @relation contactInfoRelations
 * Allows user-instructor profiles (and in future, other entity types) to associate
 * with centralized contact records for use in communication, billing, and support.
 *
 * @scalability
 * New entity types can be added via dedicated junction tables without touching the base schema.
 */
export const contactInfoRelations = relations(contactInfo, ({ many }) => ({
	/**
	 * Instructor Profile → Contact Info (many-to-many via junction)
	 *
	 * @purpose
	 * Enables instructor profiles to associate with one or more contact records
	 * (e.g., primary, billing, support) for communication workflows.
	 *
	 * @businessContext
	 * Instructor relationships often span multiple orgs, roles, and
	 * responsibilities — this allows differentiated contacts per scenario.
	 *
	 * @usedIn
	 * - Instructor onboarding and CRM
	 * - Payment and revenue sharing communication
	 * - Professional collaboration setup
	 */
	usersInstructorProfilesContactInfo: many(userInstructorProfileContactInfo),
}));
