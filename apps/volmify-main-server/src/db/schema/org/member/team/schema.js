import { boolean, index, pgEnum, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";
import { orgEmployeeIdFkCol } from "#db/schema/org/member/employee/_utils/fk.js";
import { orgIdFkCol } from "#db/schema/org/schema.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
import { user } from "../../../user/schema.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";

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
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
		createdById: textCols
			.idFk("created_by_id")
			.references(() => user.id)
			.notNull(),

		slug: textCols.slug().notNull(),

		orgId: orgIdFkCol().notNull(),

		// TODO: convert to enum
		/**
		 * Indicates structural intent of the team for UI and policy logic.
		 */
		type: text("team_type").default("cross_functional"), // Options: departmental, cross_functional, project, permanent

		/**
		 * Whether this team can include employees from multiple departments.
		 */
		allowsCrossDepartmentEmployees: boolean("allows_cross_department_employees").default(true),

		// metadata: jsonb("metadata"),
	},
	(table) => [
		uniqueIndex(`uq_${orgTeamTableName}_slug_org`).on(table.slug, table.orgId),
		index(`idx_${orgTeamTableName}_created_at`).on(table.createdAt),
		index(`idx_${orgTeamTableName}_last_updated_at`).on(table.lastUpdatedAt),
		index(`idx_${orgTeamTableName}_slug`).on(table.slug),
		index(`idx_${orgTeamTableName}_org`).on(table.orgId),
		index(`idx_${orgTeamTableName}_created_by_id`).on(table.createdById),
	],
);

export const orgTeamI18n = buildOrgI18nTable(orgTeamTableName)(
	{
		teamId: textCols
			.idFk("team_id")
			.references(() => orgTeam.id)
			.notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "teamId",
		extraConfig: (cols, tableName) => [index(`idx_${tableName}_name`).on(cols.name)],
	},
);

const orgTeamEmployeeTableName = `${orgTeamTableName}_employee`;
export const orgTeamEmployeeRoleEnum = pgEnum(`${orgTeamEmployeeTableName}_role`, [
	"admin", // Full access to manage team employees, settings, and permissions
	"employee", // Scoped access based on permission groups assigned within the team
]);
export const orgTeamEmployeeStatusEnum = pgEnum(`${orgTeamEmployeeTableName}_status`, [
	"pending", // Awaiting acceptance of invitation
	"active", // Currently active employee
	"suspended", // Temporarily suspended; cannot access team resources
	"left", // Employee has left the team
]);
/**
 * Org Employee ⇄ Team Assignment
 *
 * @abacRole Team-Scoped Subject Role
 * Links employees to teams with scoped roles and employee metadata.
 * Enables dynamic collaboration units and layered permissions within orgs.
 *
 * @collaborationModel
 * - Team-based access boundaries
 * - Role-specific access within team scope
 * - Supports transient or permanent collaboration units
 */
export const orgTeamEmployee = table(
	orgTeamEmployeeTableName,
	{
		employeeId: orgEmployeeIdFkCol().notNull(),
		teamId: textCols
			.idFk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		status: orgTeamEmployeeStatusEnum("status").notNull().default("pending"),
		role: orgTeamEmployeeRoleEnum("role").notNull().default("employee"),
		joinedAt: temporalCols.activity.joinedAt(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => [
		index(`idx_${orgTeamEmployeeTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgTeamEmployeeTableName}_status`).on(t.status),
		index(`idx_${orgTeamEmployeeTableName}_role`).on(t.role),
		index(`idx_${orgTeamEmployeeTableName}_joined_at`).on(t.joinedAt),
		primaryKey({ columns: [t.employeeId, t.teamId] }),
	],
);
