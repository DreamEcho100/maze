import { relations } from "drizzle-orm";
import { accountTransactionUserContext } from "../account/schema.js";
import { userCategory, userCategoryI18n } from "../general/category/schema.js";
import { orgTeam } from "../org/member/team/schema.js";
import {
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
} from "../org/product/by-type/course/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../org/product/payment/schema.js";
import { userLocale } from "./locale/schema.js";
import { userProfile } from "./profile/schema.js";
import {
	user,
	userEmailVerificationRequest,
	userPasswordResetSession,
	userSession,
} from "./schema.js";

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(userSession),
	userEmailVerificationRequests: many(userEmailVerificationRequest),
	passwordResetSessions: many(userPasswordResetSession),
	courseProductsChallengeRatings: many(orgMemberProductCourseChallengeRating),
	learningProfile: many(orgMemberLearningProfile),
	//
	createdTeams: many(orgTeam),

	orgsProductsVariantsPaymentPlansSubscription: many(
		orgMemberProductVariantPaymentPlanSubscription,
	),

	profiles: many(userProfile),
	locales: many(userLocale),

	accountTransactions: many(accountTransactionUserContext),

	categories: many(userCategory),
	categoriesI18n: many(userCategoryI18n),
}));
export const userSessionRelations = relations(userSession, ({ one }) => ({
	user: one(user, {
		fields: [userSession.userId],
		references: [user.id],
	}),
}));
export const userEmailVerificationRequestRelations = relations(
	userEmailVerificationRequest,
	({ one }) => ({
		user: one(user, {
			fields: [userEmailVerificationRequest.userId],
			references: [user.id],
		}),
	}),
);
export const userPasswordResetSessionRelations = relations(
	userPasswordResetSession,
	({ one }) => ({
		user: one(user, {
			fields: [userPasswordResetSession.userId],
			references: [user.id],
		}),
	}),
);
