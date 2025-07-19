import { relations } from "drizzle-orm";

import { user } from "../../user/schema.js";
import {
	orgGiftCard,
	orgMemberGiftCardUsage,
	orgMemberOrderDiscountUsage,
} from "../product/offers/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../product/payment/schema.js";
import { org } from "../schema.js";
import { orgMember, orgMemberInvitation } from "./schema";
import { orgTeamMembership } from "./team/schema.js";

export const orgMemberRelations = relations(orgMember, ({ one, many }) => ({
	org: one(org, {
		fields: [orgMember.orgId],
		references: [org.id],
	}),
	user: one(user, {
		fields: [orgMember.userId],
		references: [user.id],
	}),
	invitations: many(orgMemberInvitation),
	teamsMemberships: many(orgTeamMembership),
	departmentMemberships: many(org),
	productsVariantsPaymentPlansSubscriptions: many(orgMemberProductVariantPaymentPlanSubscription),
	ordersDiscountsUsages: many(orgMemberOrderDiscountUsage),
	ordersDiscountsUsage: many(orgMemberOrderDiscountUsage),
	issuedGiftCardsTo: many(orgGiftCard),
	giftCardsUsage: many(orgMemberGiftCardUsage),

	// groups: many(orgMemberPermissionsGroup),
	// productsCoursesEnrollments: many(productCourseEnrollment),
	// lessons: many(lesson),
}));

export const orgMemberInvitationRelations = relations(orgMemberInvitation, ({ one }) => ({
	org: one(org, {
		fields: [orgMemberInvitation.orgId],
		references: [org.id],
	}),
	invitedByUser: one(user, {
		fields: [orgMemberInvitation.invitedByUserId],
		references: [user.id],
	}),
	invitedMember: one(orgMember, {
		fields: [orgMemberInvitation.memberId],
		references: [orgMember.id],
		relationName: "member_invitation",
	}),
}));
