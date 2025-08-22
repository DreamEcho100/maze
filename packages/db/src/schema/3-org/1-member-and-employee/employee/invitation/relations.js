import { relations } from "drizzle-orm";
import { userJobProfile } from "../../../../schema.js";
import { org } from "../../../00-schema.js";
import { orgEmployee } from "../schema.js";
import { orgEmployeeInvitation } from "./schema.js";

// #### org -> member -> employee -> invitation
export const orgEmployeeInvitationRelations = relations(orgEmployeeInvitation, ({ one }) => ({
	org: one(org, {
		fields: [orgEmployeeInvitation.orgId],
		references: [org.id],
	}),
	jobProfile: one(userJobProfile, {
		fields: [orgEmployeeInvitation.jobProfileId],
		references: [userJobProfile.userProfileId],
	}),
	invitedByEmployee: one(orgEmployee, {
		fields: [orgEmployeeInvitation.invitedBy],
		references: [orgEmployee.id],
	}),
	approvedByEmployee: one(orgEmployee, {
		fields: [orgEmployeeInvitation.approvedBy],
		references: [orgEmployee.id],
	}),
}));
