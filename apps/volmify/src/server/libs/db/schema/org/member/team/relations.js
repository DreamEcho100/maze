import { relations } from "drizzle-orm";
import { user } from "../../../user/schema";
import { org } from "../../schema";
import { orgTeamDepartment } from "../department/schema";
import { orgMember } from "../schema";
import { orgTeam, orgTeamMembership } from "./schema";

export const orgTeamRelations = relations(orgTeam, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [orgTeam.createdById],
		references: [user.id],
	}),
	org: one(org, {
		fields: [orgTeam.orgId],
		references: [org.id],
	}),
	memberships: many(orgTeamMembership),
	departments: many(orgTeamDepartment),
}));
export const orgTeamMembershipRelations = relations(orgTeamMembership, ({ one }) => ({
	team: one(orgTeam, {
		fields: [orgTeamMembership.teamId],
		references: [orgTeam.id],
	}),
	member: one(orgMember, {
		fields: [orgTeamMembership.memberId],
		references: [orgMember.id],
	}),
}));
