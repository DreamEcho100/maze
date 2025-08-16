import { relations } from "drizzle-orm";
import { org } from "#schema/org/schema.js";
import { userJobProfile } from "#schema/user/profile/job/schema.js";
import { orgEmployee } from "../schema.js";
import { orgEmployeeInvitation } from "./schema.js";

export const orgEmployeeInvitationRelations = relations(
	orgEmployeeInvitation,
	({ one }) => ({
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
	}),
);
