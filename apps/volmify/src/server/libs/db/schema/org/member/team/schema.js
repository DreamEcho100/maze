import {
	boolean,
	index,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { sharedCols, table, temporalCols, textCols } from "../../../_utils/helpers.js";
import { user } from "../../../user/schema.js";
import { orgTableName } from "../../_utils/helpers.js";

const orgTeamTableName = `${orgTableName}_team`;
/**
 * Org Team Structure
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
	orgTeamTableName,
	{
		id: textCols.id().notNull(),
		createdAt: temporalCols.createdAt(),
		lastUpdatedAt: temporalCols.lastUpdatedAt(),
		deletedAt: temporalCols.deletedAt(),
		createdById: textCols
			.idFk("created_by_id")
			.references(() => user.id)
			.notNull(),

		name: textCols.name().notNull(),
		slug: textCols.slug().notNull(),
		description: textCols.shortDescription("description"),

		orgId: sharedCols.orgIdFk().notNull(),

		// TODO: convert to enum
		/**
		 * Indicates structural intent of the team for UI and policy logic.
		 */
		type: text("team_type").default("cross_functional"), // Options: departmental, cross_functional, project, permanent

		/**
		 * Whether this team can include members from multiple departments.
		 */
		allowsCrossDepartmentMembers: boolean("allows_cross_department_members").default(true),

		// metadata: jsonb("metadata"),
	},
	(table) => [
		uniqueIndex(`uq_${orgTeamTableName}_name_org`).on(table.name, table.orgId),
		index(`idx_${orgTeamTableName}_created_at`).on(table.createdAt),
		index(`idx_${orgTeamTableName}_last_updated_at`).on(table.lastUpdatedAt),
		index(`idx_${orgTeamTableName}_name`).on(table.name),
		index(`idx_${orgTeamTableName}_org`).on(table.orgId),
		index(`idx_${orgTeamTableName}_created_by_id`).on(table.createdById),
	],
);

const orgTeamMembershipTableName = `${orgTeamTableName}_membership`;
export const orgTeamMembershipRoleEnum = pgEnum(`${orgTeamMembershipTableName}_role`, [
	"admin", // Full access to manage team members, settings, and permissions
	"member", // Scoped access based on permission groups assigned within the team
]);
export const orgTeamMembershipStatusEnum = pgEnum(`${orgTeamMembershipTableName}_status`, [
	"pending", // Awaiting acceptance of invitation
	"active", // Currently active member
	"suspended", // Temporarily suspended; cannot access team resources
	"left", // Member has left the team
]);
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
export const orgTeamMembership = table(
	orgTeamMembershipTableName,
	{
		memberId: sharedCols.orgMemberIdFk().notNull(),
		teamId: textCols
			.idFk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		status: orgTeamMembershipStatusEnum("status").notNull().default("pending"),
		role: orgTeamMembershipRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }),
		createdAt: temporalCols.createdAt(),
		lastUpdatedAt: temporalCols.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${orgTeamMembershipTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgTeamMembershipTableName}_status`).on(t.status),
		index(`idx_${orgTeamMembershipTableName}_role`).on(t.role),
		index(`idx_${orgTeamMembershipTableName}_joined_at`).on(t.joinedAt),
		primaryKey({ columns: [t.memberId, t.teamId] }),
	],
);
