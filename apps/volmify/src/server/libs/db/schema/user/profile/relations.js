import { relations } from "drizzle-orm";
import { contactInfo } from "../../general/contact-info/schema";
import { locale } from "../../general/locale-currency-market/schema";
import { seoMetadata } from "../../general/seo/schema";
import { orgMember } from "../../org/member/schema";
import { orgMemberProductOrderItem } from "../../org/product/orders/schema";
import { orgProduct } from "../../org/product/schema";
import { user } from "../schema";
import { userInstructorProfile } from "./instructor/schema";
import {
	userProfile,
	userProfileContactInfo,
	userProfileI18n,
	userProfileOrgMembership,
	userProfileOrgMembershipProductAttribution,
	userProfileOrgMembershipProductAttributionRevenue,
} from "./schema";

export const userProfileRelations = relations(userProfile, ({ many, one }) => ({
	user: one(user, {
		fields: [userProfile.userId],
		references: [user.id],
	}),
	translations: many(userProfileI18n),
	contacts: many(userProfileContactInfo),
	instructorProfiles: many(userInstructorProfile),
	orgsMembership: many(userProfileOrgMembership),
}));
export const userProfileI18nRelations = relations(userProfileI18n, ({ one }) => ({
	/**
	 * @localeKey Unique locale identifier for translations
	 * @immutable Once set, should not change to maintain translation integrity
	 */
	locale: one(locale, {
		fields: [userProfileI18n.localeKey],
		references: [locale.key],
	}),

	/**
	 * @seoMetadata SEO metadata for translated instructor profiles
	 */
	seoMetadata: one(seoMetadata, {
		fields: [userProfileI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),

	/**
	 * @instructorProfileLink Links translation to the main instructor profile
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
export const userProfileOrgMembershipRelations = relations(
	userProfileOrgMembership,
	({ many, one }) => ({
		userProfile: one(userProfile, {
			fields: [userProfileOrgMembership.userProfileId],
			references: [userProfile.id],
		}),
		orgMember: one(orgMember, {
			fields: [userProfileOrgMembership.orgMemberId],
			references: [orgMember.id],
		}),
		orgProductAttribution: many(userProfileOrgMembershipProductAttribution),
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
	}),
);
export const userProfileOrgMembershipProductAttributionRelations = relations(
	userProfileOrgMembershipProductAttribution,
	({ one }) => ({
		membership: one(userProfileOrgMembership, {
			fields: [userProfileOrgMembershipProductAttribution.membershipId],
			references: [userProfileOrgMembership.id],
		}),
		product: one(orgProduct, {
			fields: [userProfileOrgMembershipProductAttribution.productId],
			references: [orgProduct.id],
		}),
	}),
);
export const userProfileOrgMembershipProductAttributionRevenueRelations = relations(
	userProfileOrgMembershipProductAttributionRevenue,
	({ one }) => ({
		orderItem: one(orgMemberProductOrderItem, {
			fields: [userProfileOrgMembershipProductAttributionRevenue.orderItemId],
			references: [orgMemberProductOrderItem.id],
		}),
		attributedMember: one(userProfileOrgMembershipProductAttribution, {
			fields: [userProfileOrgMembershipProductAttributionRevenue.attributedMemberId],
			references: [userProfileOrgMembershipProductAttribution.id],
		}),
	}),
);
