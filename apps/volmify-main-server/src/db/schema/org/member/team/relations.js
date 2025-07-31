import { relations } from "drizzle-orm";
import { user } from "../../../user/schema";
import { orgLocale } from "../../locale-region/schema";
import { org } from "../../schema";
import { orgDepartmentTeam } from "../department/schema";
import { orgEmployee } from "../employee/schema";
import { orgTeam, orgTeamEmployee, orgTeamI18n } from "./schema";

export const orgTeamRelations = relations(orgTeam, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [orgTeam.createdById],
		references: [user.id],
	}),
	org: one(org, {
		fields: [orgTeam.orgId],
		references: [org.id],
	}),
	employees: many(orgTeamEmployee),
	departments: many(orgDepartmentTeam),
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

export const orgTeamEmployeeRelations = relations(orgTeamEmployee, ({ one }) => ({
	team: one(orgTeam, {
		fields: [orgTeamEmployee.teamId],
		references: [orgTeam.id],
	}),
	employee: one(orgEmployee, {
		fields: [orgTeamEmployee.employeeId],
		references: [orgEmployee.id],
	}),
}));
