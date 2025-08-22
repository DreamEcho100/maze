// ## user

import { relations } from "drizzle-orm";
import { locale } from "../0-local/00-schema.js";
import { orgTeam } from "../3-org/2-team-and-department/schema.js";
import {
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
} from "../3-org/4-product/1-by-type/course/schema.js";
import { orgMemberProductVariantPaymentPlanSubscription } from "../3-org/4-product/payment/schema.js";
import { accountTransactionUserContext } from "../4-account/schema.js";
import {
	userEmailVerificationRequest,
	userPasswordResetSession,
	userSession,
} from "./0-auth/00-schema.js";
import { userCategory, userCategoryI18n } from "./0-category/schema.js";
import { userLocale } from "./0-locale/00-schema.js";
import { userProfile } from "./1-profile/schema.js";
import { user } from "./00-schema.js";

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
