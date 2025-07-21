import { relations } from "drizzle-orm";
import { locale } from "../../../general/locale-currency-market/schema.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { userProfile } from "../schema.js";
import {
	userInstructorProfile,
	userInstructorProfileI18n,
	userInstructorProfileMetrics,
	userInstructorProfileSkill,
} from "./schema.js";

/**
 * Instructor Profile Relations
 *
 * @instructorIdentity Global instructor identity across orgs
 * Enables instructors to maintain consistent professional identity while
 * participating in multiple org contexts.
 */
export const userInstructorProfileRelations = relations(userInstructorProfile, ({ one, many }) => ({
	userProfile: one(userProfile, {
		fields: [userInstructorProfile.userProfileId],
		references: [userProfile.id],
	}),

	translations: many(userInstructorProfileI18n),
	skills: many(userInstructorProfileSkill),
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
			fields: [userInstructorProfileI18n.instructorProfileId],
			references: [userInstructorProfile.userProfileId],
		}),
	}),
);

export const userInstructorProfileSkillRelations = relations(
	userInstructorProfileSkill,
	({ one }) => ({
		// TODO: Define skill relation
		// /**
		//  * @skillId Unique identifier for the skill
		//  * @immutable Once set, should not change to maintain skill integrity
		//  */
		// skill: one(userInstructorProfile, {
		// 	fields: [userInstructorProfileSkill.skillId],
		// 	references: [userInstructorProfile.id],
		// }),
		/**
		 * @instructorProfileLink Links skill to the main instructor profile
		 */
		instructorProfile: one(userInstructorProfile, {
			fields: [userInstructorProfileSkill.instructorProfileId],
			references: [userInstructorProfile.userProfileId],
		}),
	}),
);

export const userInstructorProfileMetricsRelations = relations(
	userInstructorProfileMetrics,
	({ one }) => ({
		/**
		 * @instructorProfileLink Links metrics to the main instructor profile
		 */
		instructorProfile: one(userInstructorProfile, {
			fields: [userInstructorProfileMetrics.instructorProfileId],
			references: [userInstructorProfile.userProfileId],
		}),
	}),
);
