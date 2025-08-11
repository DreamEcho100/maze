import { relations } from "drizzle-orm";
import { orgLocale } from "../../locale-region/schema.js";
import { org } from "../../schema.js";
import { orgEmployee } from "../employee/schema.js";
import { orgTeam } from "../team/schema.js";
import {
	orgDepartment,
	orgDepartmentEmployee,
	orgDepartmentI18n,
	orgDepartmentTeam,
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
