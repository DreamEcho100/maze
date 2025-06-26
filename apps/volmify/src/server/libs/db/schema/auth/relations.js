import { relations } from "drizzle-orm";

import { passwordResetSession, session, user, userEmailVerificationRequests } from "./schema";

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	userEmailVerificationRequests: many(userEmailVerificationRequests),
	passwordResetSessions: many(passwordResetSession),
	organizationMemberships: many(organizationMember),
	invitationsSent: many(organizationMemberInvitation),
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
