import { relations } from "drizzle-orm";
import { user } from "../../../user/schema.js";
import { orgLocale } from "../../locale-region/schema.js";
import { org } from "../../schema.js";
import { orgDepartmentTeam } from "../department/schema.js";
import { orgEmployee } from "../employee/schema.js";
import { orgTeam, orgTeamEmployee, orgTeamI18n } from "./schema.js";

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
