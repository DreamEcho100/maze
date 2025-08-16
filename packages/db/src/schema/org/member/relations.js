import { relations } from "drizzle-orm";
import { account, accountTransaction } from "../../account/schema.js";
import { userProfile } from "../../user/profile/schema.js";
import {
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
	orgMemberProductCourseEnrollment,
} from "../product/by-type/course/schema.js";
import {
	orgMemberGiftCardUsage,
	orgMemberOrderDiscountUsage,
} from "../product/offers/schema.js";
import { orgMemberOrder } from "../product/orders/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../product/payment/schema.js";
import { org } from "../schema.js";
import { orgEmployee } from "./employee/schema.js";
import { orgMemberInvitation } from "./invitation/schema.js";
import { orgMember } from "./schema.js";

export const orgMemberRelations = relations(orgMember, ({ one, many }) => ({
	org: one(org, {
		fields: [orgMember.orgId],
		references: [org.id],
	}),
	employee: one(orgEmployee, {
		fields: [orgMember.id],
		references: [orgEmployee.memberId],
	}),
	productsVariantsPaymentPlansSubscriptions: many(
		orgMemberProductVariantPaymentPlanSubscription,
	),
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
