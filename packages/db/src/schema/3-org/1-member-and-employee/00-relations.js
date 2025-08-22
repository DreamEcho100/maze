// ## org -> member

import { relations } from "drizzle-orm";
import { userProfile } from "../../2-user/1-profile/schema.js";
import { account, accountTransaction } from "../../4-account/schema.js";
import {
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
	orgMemberProductCourseEnrollment,
} from "../4-product/1-by-type/course/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../4-product/payment/schema.js";
import { orgMemberGiftCardUsage, orgMemberOrderDiscountUsage } from "../5-offers/schema.js";
import { orgMemberOrder } from "../6-orders/schema.js";
import { org } from "../00-schema.js";
import { orgMemberInvitation } from "./1-invitation/schema.js";
import { orgMember } from "./00-schema.js";
import { orgEmployee } from "./employee/schema.js";

export const orgMemberRelations = relations(orgMember, ({ one, many }) => ({
	org: one(org, {
		fields: [orgMember.orgId],
		references: [org.id],
	}),
	employee: one(orgEmployee, {
		fields: [orgMember.id],
		references: [orgEmployee.memberId],
	}),
	productsVariantsPaymentPlansSubscriptions: many(orgMemberProductVariantPaymentPlanSubscription),
	ordersDiscountsUsages: many(orgMemberOrderDiscountUsage),
	ordersDiscountsUsage: many(orgMemberOrderDiscountUsage),
	giftCardsUsage: many(orgMemberGiftCardUsage),
	invitationsReceived: many(orgMemberInvitation, {
		relationName: "org_member_invitation_received",
	}),
	invitationsApproved: many(orgMemberInvitation, {
		relationName: "org_member_invitation_approved",
	}),
	invitationsSent: many(orgMemberInvitation, {
		relationName: "org_member_invitation_sent",
	}),
	userProfile: one(userProfile, {
		fields: [orgMember.userProfileId],
		references: [userProfile.id],
	}),

	// groups: many(orgMemberPermissionsGroup),
	// productsCoursesEnrollments: many(productCourseEnrollment),
	// lessons: many(lesson),

	courseEnrollments: many(orgMemberProductCourseEnrollment),
	courseChallengeRatings: many(orgMemberProductCourseChallengeRating),
	learningProfiles: many(orgMemberLearningProfile),
	orders: many(orgMemberOrder),

	// Q: Can/Should the member have one or more accounts with a default one?
	accounts: many(account),
	refundTransactions: many(accountTransaction),
}));

// ---- org -> member -> employee -> invitation

// --- org -> member -> employee

// -- org -> member
