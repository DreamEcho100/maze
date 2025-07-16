import { relations } from "drizzle-orm";
import { orgMember, orgMemberInvitation } from "../org/member/schema.js";
import { orgTeam } from "../org/member/team/schema.js";
import {
	productCourseChallengeRating,
	userLearningProfile,
} from "../org/product/by-type/course/schema.js";
import { instructorOrgAffiliation } from "../org/schema.js";
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
	affiliations: many(instructorOrgAffiliation),
	instructorProfiles: many(userInstructorProfile),
	courseProductsChallengeRatings: many(productCourseChallengeRating),
	learningProfile: many(userLearningProfile),
	//
	orgMemberships: many(orgMember),
	invitationsSent: many(orgMemberInvitation),
	createdTeams: many(orgTeam),
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
