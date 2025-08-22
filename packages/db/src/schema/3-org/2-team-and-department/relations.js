// ##  org -> department

import { relations } from "drizzle-orm";
import { user } from "../../2-user/00-schema.js";
import { orgEmployee } from "../../schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { org } from "../00-schema.js";
import {
	orgDepartment,
	orgDepartmentEmployee,
	orgDepartmentI18n,
	orgDepartmentTeam,
	orgTeam,
	orgTeamEmployee,
	orgTeamI18n,
} from "./schema.js";

export const orgDepartmentRelations = relations(orgDepartment, ({ many, one }) => ({
	org: one(org, {
		fields: [orgDepartment.orgId],
		references: [org.id],
	}),
	parent: one(orgDepartment, {
		fields: [orgDepartment.parentId],
		references: [orgDepartment.id],
		relationName: "parent_department",
	}),
	children: many(orgDepartment, {
		relationName: "children_departments",
	}),
	employees: many(orgDepartmentEmployee),
	teams: many(orgDepartmentTeam),
	translations: many(orgDepartmentI18n),
}));
export const orgDepartmentI18nRelations = relations(orgDepartmentI18n, ({ one }) => ({
	department: one(orgDepartment, {
		fields: [orgDepartmentI18n.departmentId],
		references: [orgDepartment.id],
	}),
	locale: one(orgLocale, {
		fields: [orgDepartmentI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));

export const orgDepartmentEmployeeRelations = relations(orgDepartmentEmployee, ({ one }) => ({
	employee: one(orgEmployee, {
		fields: [orgDepartmentEmployee.employeeId],
		references: [orgEmployee.id],
	}),
	department: one(orgDepartment, {
		fields: [orgDepartmentEmployee.departmentId],
		references: [orgDepartment.id],
	}),
}));
export const orgDepartmentTeamRelations = relations(orgDepartmentTeam, ({ one }) => ({
	department: one(orgDepartment, {
		fields: [orgDepartmentTeam.departmentId],
		references: [orgDepartment.id],
	}),
	team: one(orgTeam, {
		fields: [orgDepartmentTeam.teamId],
		references: [orgTeam.id],
	}),
	// employees: many(orgDepartmentEmployee),
}));
// --  org -> department

// ##  org -> team

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
// --  org -> team

// --- member

// ### org -> product
