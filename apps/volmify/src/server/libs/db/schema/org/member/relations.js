import { relations } from "drizzle-orm";

import { user } from "../../user/schema.js";
import {
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
	orgMemberProductCourseEnrollment,
} from "../product/by-type/course/schema.js";
import {
	orgGiftCard,
	orgMemberGiftCardUsage,
	orgMemberOrderDiscountUsage,
} from "../product/offers/schema.js";
import { orgMemberProductOrder } from "../product/orders/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../product/payment/schema.js";
import { org } from "../schema.js";
import { orgDepartmentMembership } from "./department/schema.js";
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
	teamsMemberships: many(orgTeamMembership),
	departmentMemberships: many(orgDepartmentMembership),
	productsVariantsPaymentPlansSubscriptions: many(orgMemberProductVariantPaymentPlanSubscription),
	ordersDiscountsUsages: many(orgMemberOrderDiscountUsage),
	ordersDiscountsUsage: many(orgMemberOrderDiscountUsage),
	issuedGiftCardsTo: many(orgGiftCard),
	giftCardsUsage: many(orgMemberGiftCardUsage),
	invitationsReceived: many(orgMemberInvitation, {
		relationName: "org_member_invitation_received",
	}),
	invitationsSent: many(orgMemberInvitation, {
		relationName: "org_member_invitation_sent",
	}),

	// groups: many(orgMemberPermissionsGroup),
	// productsCoursesEnrollments: many(productCourseEnrollment),
	// lessons: many(lesson),

	courseEnrollments: many(orgMemberProductCourseEnrollment),
	courseChallengeRatings: many(orgMemberProductCourseChallengeRating),
	learningProfiles: many(orgMemberLearningProfile),
	orders: many(orgMemberProductOrder),
}));

export const orgMemberInvitationRelations = relations(orgMemberInvitation, ({ one }) => ({
	org: one(org, {
		fields: [orgMemberInvitation.orgId],
		references: [org.id],
	}),
	invitedByMember: one(orgMember, {
		fields: [orgMemberInvitation.invitedByMemberId],
		references: [orgMember.id],
		relationName: "org_member_invitation_sent_by",
	}),
	invitedMember: one(orgMember, {
		fields: [orgMemberInvitation.memberId],
		references: [orgMember.id],
		relationName: "org_member_invitation_received_by",
	}),
}));
