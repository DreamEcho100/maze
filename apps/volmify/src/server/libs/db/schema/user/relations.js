import { relations } from "drizzle-orm";

import { instructorOrgAffiliation, orgMember, orgMemberInvitation } from "../org/schema.js";
import {
	productCourseChallengeRating,
	userLearningProfile,
} from "../product/by-type/course/schema.js";
import { userInstructorProfile } from "./profile/instructor/schema.js";
import { passwordResetSession, session, user, userEmailVerificationRequests } from "./schema.js";

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	userEmailVerificationRequests: many(userEmailVerificationRequests),
	passwordResetSessions: many(passwordResetSession),
	organizationMemberships: many(orgMember),
	invitationsSent: many(orgMemberInvitation),
	affiliations: many(instructorOrgAffiliation),
	instructorProfiles: many(userInstructorProfile),
	courseProductsChallengeRatings: many(productCourseChallengeRating),
	learningProfile: many(userLearningProfile),
}));
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));
export const emailVerificationRequestRelations = relations(
	userEmailVerificationRequests,
	({ one }) => ({
		user: one(user, {
			fields: [userEmailVerificationRequests.userId],
			references: [user.id],
		}),
	}),
);
export const passwordResetSessionRelations = relations(passwordResetSession, ({ one }) => ({
	user: one(user, {
		fields: [passwordResetSession.userId],
		references: [user.id],
	}),
}));
