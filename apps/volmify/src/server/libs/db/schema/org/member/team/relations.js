import { relations } from "drizzle-orm";
import { user } from "../../../user/schema";
import { orgLocale } from "../../locale-region/schema";
import { org } from "../../schema";
import { orgTeamDepartment } from "../department/schema";
import { orgMember } from "../schema";
import { orgTeam, orgTeamI18n, orgTeamMembership } from "./schema";

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
export const orgTeamI18nRelations = relations(orgTeamI18n, ({ one }) => ({
	team: one(orgTeam, {
		fields: [orgTeamI18n.teamId],
		references: [orgTeam.id],
	}),
	locale: one(orgLocale, {
		fields: [orgTeamI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
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
