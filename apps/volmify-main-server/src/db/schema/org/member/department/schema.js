import { boolean, pgEnum } from "drizzle-orm/pg-core";
import {
	orgEmployeeIdExtraConfig,
	orgEmployeeIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdExtraConfig, orgIdFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
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
import { orgTeam } from "../team/schema.js";

const orgDepartmentTableName = `${orgTableName}_department`;

export const orgDepartmentTypeEnum = pgEnum(`${orgDepartmentTableName}_type`, [
	"department",
	"division",
	"business_unit",
	"office",
	"region",
	// "branch", // Franchise branches
]);

// Q: will the following be able to achieve the following or it's missing something?
// - Departments are typically for employees, not customers
// - Engineering Department (employees work here)
// - Marketing Department (employees have roles here)
// - Sales Department (employees are assigned here)
// - Salary allocation by department
// - Team budget management
// - Performance reviews by department
// - Reporting structure (manager → team → department)
// - EMPLOYEE permissions are department/team based
// - Engineering team has code repository access
// - Marketing team has campaign management access
// - Finance team has accounting system access

// // Enhanced department schema with branch capabilities
// export const orgDepartmentTypeEnum = pgEnum(`${orgDepartmentTableName}_type`, [
//   // Functional types
//   "department",        // Traditional functional department
//   "team",             // Sub-department team

//   // Branch types
//   "branch",           // Geographic or business branch
//   "division",         // Business unit division
//   "business_unit",    // Semi-autonomous business unit
//   "office",           // Physical office location
//   "region",           // Regional operation
//   "subsidiary",       // Legal subsidiary
//   "franchise",        // Franchise location
// ]);

/**
 * Org Department Structure
 *
 * @abacRole Structural Grouping
 * Traditional department construct for hierarchical orgs. Provides
 * structure and influences default permissions for employees and teams.
 */
export const orgDepartment = table(
	orgDepartmentTableName,
	{
		id: textCols.idPk().notNull(),

		orgId: orgIdFkCol().notNull(),
		slug: textCols.slug().notNull(),

		// isDefault: boolean("is_default").default(false), // Only one per org
		// isActive: boolean("is_active").default(true),

		/**
		 * @optional
		 * Used to define nested department structures (e.g., HR > Payroll)
		 */
		parentId: textCols.idFk("parent_id"), // .references(() => departments.id),

		/**
		 * @branchLike
		 * Project teams with departmental support
		 */
		allowsCrossDepartmentEmployees: boolean("allows_cross_department_employees").default(false),

		// /**
		//  * @branchLike Enhanced department capabilities
		//  */
		// Q: an enum or a separate table category like structure?
		// type: orgDepartmentTypeEnum("type").default("department"),
		// // "department", "division", "business_unit", "office", "region"

		// isAutonomous: boolean("is_autonomous").default(false), // Semi-independent operations
		// budgetAuthority: boolean("budget_authority").default(false), // Can manage budgets
		// canHireEmployees: boolean("can_hire_employees").default(false),

		// /**
		//  * @geographic Geographic context for office-like departments
		//  */
		// // physicalLocation: jsonb("physical_location"), // Address, timezone, etc.
		// regionId: fk("region_id").references(() => orgRegion.id), // Link to market region
		// // // TODO: add contact info join connection

		// /**
		//  * @business Business unit context
		//  */
		// profitLossResponsibility: boolean("profit_loss_responsibility").default(false),
		// localComplianceRequired: boolean("local_compliance_required").default(false),

		// /**
		//  * @management Local management structure
		//  */
		// hasLocalManagement: boolean("has_local_management").default(false),
		// localManagerId: fk("local_manager_id").references(() => orgEmployee.id),

		/*
// Configuration examples for different department types:

const departmentConfigurations = {
  // Traditional functional department
  "department": {
    isAutonomous: false,
    budgetAuthority: false,
    canHireEmployees: false,
    profitLossResponsibility: false
  },
  
  // Geographic branch office
  "branch": {
    isAutonomous: true,
    budgetAuthority: true,
    canHireEmployees: true,
    profitLossResponsibility: true,
    hasLocalManagement: true
  },
  
  // Business unit division
  "division": {
    isAutonomous: true,
    budgetAuthority: true,
    canHireEmployees: true,
    profitLossResponsibility: true
  },
  
  // Physical office location
  "office": {
    isAutonomous: false,
    budgetAuthority: false,
    hasLocalManagement: true,
    requiresPhysicalLocation: true
  }
};

// Different permission patterns based on department type:

const permissionPatterns = {
  // Functional departments inherit from parent
  "department": {
    inheritancePattern: "hierarchical",
    scopeType: "functional"
  },
  
  // Branches have more autonomous permissions
  "branch": {
    inheritancePattern: "autonomous_with_oversight", 
    scopeType: "geographic_or_business_unit",
    additionalPermissions: [
      "local_hiring", "budget_management", "local_compliance"
    ]
  },
  
  // Offices have location-specific permissions
  "office": {
    inheritancePattern: "location_scoped",
    scopeType: "geographic",
    additionalPermissions: [
      "facility_management", "local_operations"
    ]
  }
};
*/
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		// metadata: jsonb("metadata"),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: orgDepartmentTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgDepartmentTableName,
			fkGroups: [
				{
					cols: [cols.parentId],
					foreignColumns: [cols.id],
				},
			],
		}),
		uniqueIndex({
			cols: [cols.orgId, cols.slug],
			tName: orgDepartmentTableName,
		}),
		// uniqueIndex(`uq_${orgDepartmentTableName}_default`)
		// 	.on(t.orgId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		...multiIndexes({
			tName: orgDepartmentTableName,
			colsGrps: [
				{ cols: [cols.slug] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

export const orgDepartmentI18n = buildOrgI18nTable(orgDepartmentTableName)(
	{
		departmentId: textCols
			.idFk("department_id")
			.references(() => orgDepartment.id)
			.notNull(),
		/**
		 * @domain
		 * Departmental units used for org charts and structured ABAC.
		 */
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "departmentId",
		extraConfig: (cols, tName) => [
			// index(`idx_${tName}_name`).on(cols.name)
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.departmentId],
						foreignColumns: [orgDepartment.id],
					},
				],
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.name] }],
			}),
		],
	},
);

const orgDepartmentEmployeesTableName = `${orgDepartmentTableName}_employees`;
export const orgDepartmentEmployeesStatusEnum = pgEnum(
	`${orgDepartmentEmployeesTableName}_status`,
	["active", "inactive", "pending", "removed"],
);

/**
 * Employee-Department Assignment (M:M)
 *
 * @abacRole Structural Permission Grouping
 * Employees can belong to one or more departments. This informs both permission
 * inheritance and UI logic (like filtering or default views).
 */
export const orgDepartmentEmployee = table(
	orgDepartmentEmployeesTableName,
	{
		employeeId: orgEmployeeIdFkCol().notNull(),

		departmentId: textCols
			.idFk("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		status: orgDepartmentEmployeesStatusEnum("status").notNull().default("active"),
		// role: departmentEmployeesRoleEnum("role"), // "manager", "employee", "lead"
		joinedAt: temporalCols.activity.joinedAt().defaultNow(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgDepartmentEmployeesTableName,
			cols: [cols.employeeId, cols.departmentId],
		}),
		// uniqueIndex(`uq_${orgDepartmentEmployeesTableName}`).on(
		// 	t.employeeId,
		// 	t.departmentId,
		// ),
		// uniqueIndex(`uq_${orgDepartmentEmployeesTableName}_default`)
		// 	.on(t.employeeId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${orgDepartmentEmployeesTableName}_status`).on(t.status),
		// index(`idx_${orgDepartmentEmployeesTableName}_joined_at`).on(t.joinedAt),
		// index(`idx_${orgDepartmentEmployeesTableName}_created_at`).on(t.createdAt),
		// index(`idx_${orgDepartmentEmployeesTableName}_last_updated_at`).on(t.lastUpdatedAt),
		...orgEmployeeIdExtraConfig({
			tName: orgDepartmentEmployeesTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: orgDepartmentEmployeesTableName,
			fkGroups: [
				{
					cols: [cols.departmentId],
					foreignColumns: [orgDepartment.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgDepartmentEmployeesTableName,
			colsGrps: [
				{ cols: [cols.status] },
				{ cols: [cols.joinedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

const orgDepartmentTeamTableName = `${orgDepartmentTableName}_team`;
export const orgDepartmentTeamRelationshipTypeEnum = pgEnum(
	`${orgDepartmentTeamTableName}_relationship_type`,
	["lead", "collaboration", "support"],
);
/**
 * Department ⇄ Team Mapping
 *
 * @abacRole Cross-Domain Access Bridge
 * Connects teams with departments to support matrix-style org charts and
 * permission inheritance across domains.
 */
export const orgDepartmentTeam = table(
	orgDepartmentTeamTableName,
	{
		departmentId: textCols
			.idFk("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),
		teamId: textCols
			.idFk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),

		// isPrimary: boolean("is_primary").default(false), // Single primary department per team
		relationshipType: orgDepartmentTeamRelationshipTypeEnum("relationship_type")
			.notNull()
			.default("collaboration"),

		createdAt: temporalCols.audit.createdAt(),
	},
	(cols) => {
		const _base = `${orgTableName}_team_department`;
		return [
			compositePrimaryKey({
				tName: orgDepartmentTeamTableName,
				cols: [cols.teamId, cols.departmentId],
			}),
			// uniqueIndex(`uq_${base}_primary`)
			// 	.on(t.teamId, t.isPrimary)
			// 	.where(eq(t.isPrimary, true)),
			// index(`idx_${base}_team_id`).on(cols.teamId),
			// index(`idx_${base}_department_id`).on(cols.departmentId),
			...multiForeignKeys({
				tName: orgDepartmentTeamTableName,
				fkGroups: [
					{
						cols: [cols.departmentId],
						foreignColumns: [orgDepartment.id],
					},
					{
						cols: [cols.teamId],
						foreignColumns: [orgTeam.id],
					},
				],
			}),
			...multiIndexes({
				tName: orgDepartmentTeamTableName,
				colsGrps: [{ cols: [cols.createdAt] }],
			}),
		];
	},
);
