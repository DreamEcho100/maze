import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

import {
	createdAt,
	deletedAt,
	fk,
	getLocaleKey,
	id,
	name,
	slug,
	table,
	updatedAt,
} from "../../../_utils/helpers.js";
import {
	currency,
	locale,
} from "../../../system/locale-currency-market/schema.js";
import { systemPermission } from "../../../system/schema.js";
import { seoMetadata } from "../../../system/seo/schema.js";
import { userInstructorProfile } from "../../../user/profile/instructor/schema.js";
import { user } from "../../../user/schema.js";
import { orgTableName } from "../../_utils/helpers.js";
import { orgMember } from "../schema.js";
import { org } from "../../schema.js";

/**
 * Organizational Team Structure
 *
 * @abacRole Permission Assignment Unit (Flexible)
 * Teams are non-hierarchical units used for permission scoping and collaboration.
 * They may span multiple departments or operate independently.
 *
 * @businessLogic
 * Teams are used for collaborative grouping (e.g. Project A Team, Content Team).
 * They may be short-lived (project-based) or permanent (functional).
 */
export const orgTeam = table(
	`${orgTableName}_team`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: name.notNull(),

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		/**
		 * Indicates structural intent of the team for UI and policy logic.
		 */
		type: text("team_type").default("cross_functional"), // Options: departmental, cross_functional, project, permanent

		/**
		 * Whether this team can include members from multiple departments.
		 */
		allowsCrossDepartmentMembers: boolean(
			"allows_cross_department_members",
		).default(true),

		metadata: jsonb("metadata"),
	},
	(table) => {
		const base = `${orgTableName}_team`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_updated_at`).on(table.updatedAt),
			index(`idx_${base}_name`).on(table.name),
			uniqueIndex(`uq_${base}_name_org`).on(table.name, table.orgId),
		];
	},
);

export const orgMemberTeamRoleEnum = pgEnum(
	`${orgTableName}_member_team_role`,
	[
		"admin", // Full access to manage team members, settings, and permissions
		"member", // Scoped access based on permission groups assigned within the team
	],
);

/**
 * Org Member ⇄ Team Assignment
 *
 * @abacRole Team-Scoped Subject Role
 * Links members to teams with scoped roles and membership metadata.
 * Enables dynamic collaboration units and layered permissions within orgs.
 *
 * @collaborationModel
 * - Team-based access boundaries
 * - Role-specific access within team scope
 * - Supports transient or permanent collaboration units
 */
export const orgMemberTeam = table(
	`${orgTableName}_member_team`,
	{
		id: id.notNull(),
		createdAt,
		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).default("active"), // 'pending' | 'active' | 'suspended' | 'left'
		role: orgMemberTeamRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(t) => {
		const base = `${orgTableName}_member_team`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_role`).on(t.role),
			index(`idx_${base}_joined_at`).on(t.joinedAt),
			uniqueIndex(`uq_${base}`).on(t.memberId, t.teamId),
		];
	},
);
