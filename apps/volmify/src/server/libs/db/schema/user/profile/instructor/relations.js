import { relations } from "drizzle-orm";
import { locale } from "../../../general/locale-currency-market/schema.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { instructorOrgAffiliation } from "../../../org/schema.js";
import { user } from "../../../user/schema.js";
import {
	userInstructorProfile,
	userInstructorProfileContactInfo,
	userInstructorProfileI18n,
} from "./schema.js";

/**
 * Instructor Profile Relations
 *
 * @instructorIdentity Global instructor identity across orgs
 * Enables instructors to maintain consistent professional identity while
 * participating in multiple orgal contexts.
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
	 * @orgParticipation Instructor affiliations across orgs
	 */
	orgAffiliations: many(instructorOrgAffiliation),

	/**
	 * @communicationHub Multiple contact points for instructor business
	 */
	contactInfo: many(userInstructorProfileContactInfo),
	translations: many(userInstructorProfileI18n),
}));

export const userInstructorProfileTranslationRelations = relations(
	userInstructorProfileI18n,
	({ one }) => ({
		/**
		 * @localeKey Unique locale identifier for translations
		 * @immutable Once set, should not change to maintain translation integrity
		 */
		locale: one(locale, {
			fields: [userInstructorProfileI18n.localeKey],
			references: [locale.key],
		}),

		/**
		 * @seoMetadata SEO metadata for translated instructor profiles
		 */
		seoMetadata: one(seoMetadata, {
			fields: [userInstructorProfileI18n.seoMetadataId],
			references: [seoMetadata.id],
		}),

		/**
		 * @instructorProfileLink Links translation to the main instructor profile
		 */
		instructorProfile: one(userInstructorProfile, {
			fields: [userInstructorProfileI18n.userInstructorProfileId],
			references: [userInstructorProfile.id],
		}),
	}),
);
