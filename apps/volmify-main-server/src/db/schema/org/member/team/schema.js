import { boolean, pgEnum, text } from "drizzle-orm/pg-core";
import {
	orgEmployeeIdExtraConfig,
	orgEmployeeIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdExtraConfig, orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import { userIdExtraConfig } from "#db/schema/_utils/cols/shared/foreign-keys/user-id.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#db/schema/_utils/helpers.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { table } from "../../../_utils/tables.js";
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
			// .references(() => user.id)
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
	(cols) => [
		...orgIdExtraConfig({
			tName: orgTeamTableName,
			cols,
		}),
		...userIdExtraConfig({
			tName: orgTeamTableName,
			cols,
			colFkKey: "createdById",
			// onDelete: "set null",
		}),
		uniqueIndex({
			tName: orgTeamTableName,
			cols: [cols.slug, cols.orgId],
		}),
		...multiIndexes({
			tName: orgTeamTableName,
			colsGrps: [{ cols: [cols.createdAt] }, { cols: [cols.lastUpdatedAt] }, { cols: [cols.slug] }],
		}),
	],
);

export const orgTeamI18n = buildOrgI18nTable(orgTeamTableName)(
	{
		teamId: textCols
			.idFk("team_id")
			// .references(() => orgTeam.id)
			.notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "teamId",
		extraConfig: (cols, tName) => [
			...multiForeignKeys({
				tName: tName,
				indexAll: true,
				fkGroups: [
					{
						cols: [cols.teamId],
						foreignColumns: [orgTeam.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.teamId, cols.name] }],
			}),
		],
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
		teamId: textCols.idFk("team_id").notNull(),
		// .references(() => orgTeam.id, { onDelete: "cascade" }),
		status: orgTeamEmployeeStatusEnum("status").notNull().default("pending"),
		role: orgTeamEmployeeRoleEnum("role").notNull().default("employee"),
		joinedAt: temporalCols.activity.joinedAt(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		compositePrimaryKey({ tName: orgTeamEmployeeTableName, cols: [cols.teamId, cols.employeeId] }),
		...orgEmployeeIdExtraConfig({
			tName: orgTeamEmployeeTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgTeamEmployeeTableName,
			fkGroups: [
				{
					cols: [cols.teamId],
					foreignColumns: [orgTeam.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: orgTeamEmployeeTableName,
			colsGrps: [
				{ cols: [cols.teamId, cols.status] },
				{ cols: [cols.teamId, cols.role] },
				{ cols: [cols.joinedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
