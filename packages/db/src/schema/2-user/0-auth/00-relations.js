// ## user

import { relations } from "drizzle-orm";
import { user } from "../00-schema.js";
import {
	userEmailVerificationRequest,
	userPasswordResetSession,
	userSession,
} from "./00-schema.js";

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

// -- user
