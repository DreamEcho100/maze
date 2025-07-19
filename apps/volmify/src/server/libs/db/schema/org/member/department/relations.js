import { relations } from "drizzle-orm";
import { org } from "../../schema";
import { orgMember } from "../schema";
import { orgTeam } from "../team/schema";
import {
	orgDepartment,
	orgDepartmentMembership,
	// orgDepartmentMembership,
	orgTeamDepartment,
} from "./schema";

export const orgDepartmentRelations = relations(
	orgDepartment,
	({ many, one }) => ({
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
		teams: many(orgTeamDepartment),
	}),
);
export const orgDepartmentMembershipRelations = relations(
	orgDepartmentMembership,
	({ one }) => ({
		member: one(orgMember, {
			fields: [orgDepartmentMembership.memberId],
			references: [orgMember.id],
		}),
		department: one(orgDepartment, {
			fields: [orgDepartmentMembership.departmentId],
			references: [orgDepartment.id],
		}),
	}),
);
export const orgDepartmentTeamRelations = relations(
	orgTeamDepartment,
	({ one }) => ({
		department: one(orgDepartment, {
			fields: [orgTeamDepartment.departmentId],
			references: [orgDepartment.id],
		}),
		team: one(orgTeam, {
			fields: [orgTeamDepartment.teamId],
			references: [orgTeam.id],
		}),
		// memberships: many(orgDepartmentMembership),
	}),
);
