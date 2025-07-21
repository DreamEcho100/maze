import { relations } from "drizzle-orm";
import { orgLocale } from "../../locale-region/schema";
import { org } from "../../schema";
import { orgMember } from "../schema";
import { orgTeam } from "../team/schema";
import {
	orgDepartment,
	orgDepartmentI18n,
	orgDepartmentMembership,
	// orgDepartmentMembership,
	orgDepartmentTeam,
} from "./schema";

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
	memberships: many(orgDepartmentMembership),
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

export const orgDepartmentMembershipRelations = relations(orgDepartmentMembership, ({ one }) => ({
	member: one(orgMember, {
		fields: [orgDepartmentMembership.memberId],
		references: [orgMember.id],
	}),
	department: one(orgDepartment, {
		fields: [orgDepartmentMembership.departmentId],
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
	// memberships: many(orgDepartmentMembership),
}));
