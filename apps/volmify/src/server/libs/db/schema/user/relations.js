import { relations } from "drizzle-orm";
import {
	productCourseChallengeRating,
	userLearningProfile,
} from "../org/product/by-type/course/schema.js";
import { instructorOrgAffiliation, orgMember, orgMemberInvitation } from "../org/schema.js";
import { userInstructorProfile } from "./profile/instructor/schema.js";
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
	organizationMemberships: many(orgMember),
	invitationsSent: many(orgMemberInvitation),
	affiliations: many(instructorOrgAffiliation),
	instructorProfiles: many(userInstructorProfile),
	courseProductsChallengeRatings: many(productCourseChallengeRating),
	learningProfile: many(userLearningProfile),
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
export const userPasswordResetSessionRelations = relations(userPasswordResetSession, ({ one }) => ({
	user: one(user, {
		fields: [userPasswordResetSession.userId],
		references: [user.id],
	}),
}));
