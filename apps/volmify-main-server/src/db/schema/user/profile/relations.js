import { relations } from "drizzle-orm";
import { contactInfo } from "../../general/contact-info/schema";
import { seoMetadata } from "../../general/seo/schema";
import { orgMember } from "../../org/member/schema";
import { userLocale } from "../locale/schema";
import { user } from "../schema";
import { userJobProfile } from "./job/schema";
import {
	userProfile,
	userProfileContactInfo,
	userProfileI18n,
	userProfileOrgMembership,
} from "./schema";

export const userProfileRelations = relations(userProfile, ({ many, one }) => ({
	user: one(user, {
		fields: [userProfile.userId],
		references: [user.id],
	}),
	translations: many(userProfileI18n),
	contacts: many(userProfileContactInfo),
	orgsMembership: many(userProfileOrgMembership),
	jobProfile: one(userJobProfile, {
		fields: [userProfile.id],
		references: [userJobProfile.userProfileId],
	}),
}));
export const userProfileI18nRelations = relations(userProfileI18n, ({ one }) => ({
	/**
	 * @localeKey Unique locale identifier for translations
	 * @immutable Once set, should not change to maintain translation integrity
	 */
	locale: one(userLocale, {
		fields: [userProfileI18n.localeKey],
		references: [userLocale.localeKey],
	}),

	/**
	 * @seoMetadata SEO metadata for translated job profiles
	 */
	seoMetadata: one(seoMetadata, {
		fields: [userProfileI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),

	/**
	 * @jobProfileLink Links translation to the main job profile
	 */
	profile: one(userProfile, {
		fields: [userProfileI18n.userProfileId],
		references: [userProfile.id],
	}),
}));
export const userProfileContactInfoRelations = relations(userProfileContactInfo, ({ one }) => ({
	userProfile: one(userProfile, {
		fields: [userProfileContactInfo.userProfileId],
		references: [userProfile.id],
	}),
	contactInfo: one(contactInfo, {
		fields: [userProfileContactInfo.contactInfoId],
		references: [contactInfo.id],
	}),
}));
export const userProfileOrgMembershipRelations = relations(userProfileOrgMembership, ({ one }) => ({
	userProfile: one(userProfile, {
		fields: [userProfileOrgMembership.userProfileId],
		references: [userProfile.id],
	}),
	orgMember: one(orgMember, {
		fields: [userProfileOrgMembership.orgMemberId],
		references: [orgMember.id],
	}),
	// invitedByOrgMember: one(orgMember, {
	// 	fields: [userProfileOrgMembership.invitedByOrgMemberId],
	// 	references: [orgMember.id],
	// 	relationName: "user_profile_org_membership_invited_by_org_member",
	// }),
	// approvedByOrgMember: one(orgMember, {
	// 	fields: [userProfileOrgMembership.approvedByOrgMemberId],
	// 	references: [orgMember.id],
	// 	relationName: "user_profile_org_membership_approved_by_org_member",
	// }),
}));
