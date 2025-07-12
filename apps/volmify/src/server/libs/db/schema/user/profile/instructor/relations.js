import { relations } from "drizzle-orm";
import { instructorOrganizationAffiliation } from "../../../organization/schema.js";
import { user } from "../../../user/schema.js";
import { userInstructorProfile, userInstructorProfileContactInfo } from "./schema.js";

/**
 * Instructor Profile Relations
 *
 * @instructorIdentity Global instructor identity across organizations
 * Enables instructors to maintain consistent professional identity while
 * participating in multiple organizational contexts.
 */
export const userInstructorProfileRelations = relations(userInstructorProfile, ({ one, many }) => ({
	/**
	 * @identityLink Links instructor profile to platform user account
	 */
	user: one(user, {
		fields: [userInstructorProfile.userId],
		references: [user.id],
	}),

	/**
	 * @organizationParticipation Instructor affiliations across organizations
	 */
	organizationAffiliations: many(instructorOrganizationAffiliation),

	/**
	 * @communicationHub Multiple contact points for instructor business
	 */
	contactInfo: many(userInstructorProfileContactInfo),
}));
