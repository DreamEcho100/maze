import { relations } from "drizzle-orm";
import { instructorOrgAffiliation } from "../../../org/schema.js";
import { locale } from "../../../system/locale-currency-market/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { user } from "../../../user/schema.js";
import {
	userInstructorProfile,
	userInstructorProfileContactInfo,
	userInstructorProfileTranslation,
} from "./schema.js";

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
	organizationAffiliations: many(instructorOrgAffiliation),

	/**
	 * @communicationHub Multiple contact points for instructor business
	 */
	contactInfo: many(userInstructorProfileContactInfo),
	translations: many(userInstructorProfileTranslation),
}));

export const userInstructorProfileTranslationRelations = relations(
	userInstructorProfileTranslation,
	({ one }) => ({
		/**
		 * @localeKey Unique locale identifier for translations
		 * @immutable Once set, should not change to maintain translation integrity
		 */
		locale: one(locale, {
			fields: [userInstructorProfileTranslation.localeKey],
			references: [locale.key],
		}),

		/**
		 * @seoMetadata SEO metadata for translated instructor profiles
		 */
		seoMetadata: one(seoMetadata, {
			fields: [userInstructorProfileTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),

		/**
		 * @instructorProfileLink Links translation to the main instructor profile
		 */
		instructorProfile: one(userInstructorProfile, {
			fields: [userInstructorProfileTranslation.userInstructorProfileId],
			references: [userInstructorProfile.id],
		}),
	}),
);
