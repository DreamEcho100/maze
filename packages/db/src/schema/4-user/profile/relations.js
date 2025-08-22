import { relations } from "drizzle-orm";
import { userProfile } from "../../2-user/1-profile/schema.js";
import { orgMember } from "../../3-org/1-member-and-employee/00-schema.js";
import { userProfileOrgMembership } from "./schema.js";

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
