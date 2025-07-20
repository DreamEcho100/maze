import { isNotNull, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../../../_utils/helpers.js";
import { user } from "../../../../user/schema.js";
import { orgTableName } from "../../../_utils/helpers.js";
import { orgDepartment } from "../../department/schema.js";
import { orgMember } from "../../schema.js";
import { orgTeam } from "../../team/schema.js";

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 ABAC Permission System - Complete Policy Architecture
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fine-Grained Permission Definitions
 *
 * @domain Permissions
 * @description Defines atomic actions that can be granted via policies
 * @examples "edit_invoice", "view_reports", "manage_members", "create_courses"
 */
const orgPermissionTableName = `${orgTableName}_permission`;
export const orgPermissionScopeEnum = pgEnum(`${orgPermissionTableName}_scope`, [
	"global", // Applies to all resources in the org
	"org", // Applies to all resources within the org
	"resource", // Applies to a specific resource
	"team", // Applies to all resources within a specific team
	"department", // Applies to all resources within a specific department
	"member", // Applies to all resources owned by a specific member
]);

export const orgPermission = table(
	orgPermissionTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @key Unique identifier used in code and policies
		 * @examples "courses.create", "members.invite", "reports.view", "invoices.edit"
		 */
		key: textCols.key().notNull(),

		/**
		 * @display Human-readable permission name for UI
		 */
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),

		/**
		 * @scope Permission scope for ABAC evaluation
		 */
		scope: orgPermissionScopeEnum("scope").notNull().default("org"),

		/**
		 * @category Logical grouping for permission management UI
		 * @examples "course_management", "member_management", "financial", "reporting"
		 */
		category: varchar("category", { length: 64 }),

		/**
		 * @system System permissions cannot be deleted, only disabled
		 */
		isSystem: sharedCols.isSystem(),
		isActive: sharedCols.isActive(),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
		createdBy: textCols.idFk("created_by").references(() => user.id),
	},
	(t) => [
		uniqueIndex(`uq_${orgPermissionTableName}_key_org`).on(t.key, t.orgId),
		index(`idx_${orgPermissionTableName}_scope`).on(t.scope),
		index(`idx_${orgPermissionTableName}_category`).on(t.category),
		index(`idx_${orgPermissionTableName}_active`).on(t.isActive),
		index(`idx_${orgPermissionTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Permission Policy Groups
 *
 * @domain ABAC Policies
 * @description Groups of permission rules that define conditional access
 * @examples "Content Creator Policy", "Department Manager Policy", "Financial Admin Policy"
 */
const orgPolicyTableName = `${orgTableName}_policy`;
export const orgPolicy = table(
	orgPolicyTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @policy Policy identification and management
		 */
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),

		/**
		 * @system System policies are built-in and cannot be deleted
		 */
		isSystem: sharedCols.isSystem(),
		isActive: sharedCols.isActive(),

		/**
		 * @metadata Additional policy configuration and context
		 */
		metadata: jsonb("metadata"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
		createdBy: textCols.idFk("created_by").references(() => user.id),
	},
	(t) => [
		uniqueIndex(`uq_${orgPolicyTableName}_name_org`).on(t.name, t.orgId),
		index(`idx_${orgPolicyTableName}_active`).on(t.isActive),
		index(`idx_${orgPolicyTableName}_system`).on(t.isSystem),
		index(`idx_${orgPolicyTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgPolicyTableName}_updated_at`).on(t.updatedAt),
	],
);

/**
 * Policy Permission Rules
 *
 * @domain ABAC Rules
 * @description Links permissions to policies with conditional access logic
 */
const orgPolicyRuleTableName = `${orgPolicyTableName}_rule`;
export const orgPolicyRuleEffectEnum = pgEnum(`${orgPolicyRuleTableName}_effect`, [
	"allow", // Grants permission if conditions are met
	"deny", // Explicitly denies permission if conditions are met
]);

export const orgPolicyRule = table(
	orgPolicyRuleTableName,
	{
		id: textCols.id().notNull(),
		policyId: textCols
			.idFk("policy_id")
			.references(() => orgPolicy.id, { onDelete: "cascade" })
			.notNull(),
		permissionId: textCols
			.idFk("permission_id")
			.references(() => orgPermission.id, { onDelete: "cascade" })
			.notNull(),

		/**
		 * @abac ABAC-style conditional logic
		 * @examples
		 * - null (always applies)
		 * - '{"resource.departmentId": "$subject.departmentId"}' (same department)
		 * - '{"resource.createdBy": "$subject.userId"}' (resource owner)
		 * - '{"time.hour": {"$gte": 9, "$lte": 17}}' (business hours)
		 */
		condition: text("condition"),

		/**
		 * @effect Allow or deny effect for rule evaluation
		 */
		effect: orgPolicyRuleEffectEnum("effect").notNull().default("allow"),

		/**
		 * @priority Rule priority for conflict resolution (higher = more priority)
		 */
		priority: integer("priority").default(0),

		/**
		 * @metadata Additional rule context and configuration
		 */
		metadata: jsonb("metadata"),

		// /**
		//  * @departmentScoped Department-level permission boundaries
		//  */
		// departmentScope: fk("department_scope").references(() => orgDepartment.id),
		// // Permissions can be scoped to specific departments (branch-like isolation)

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
	},
	(t) => [
		uniqueIndex(`uq_${orgPolicyRuleTableName}_policy_permission`).on(t.policyId, t.permissionId),
		index(`idx_${orgPolicyRuleTableName}_effect`).on(t.effect),
		index(`idx_${orgPolicyRuleTableName}_priority`).on(t.priority),
		index(`idx_${orgPolicyRuleTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Role Templates (Policy Groupings)
 *
 * @domain Role Management
 * @description Pre-defined role templates that bundle multiple policies
 * @examples "Content Creator", "Department Manager", "Org Admin"
 */
const orgRoleTableName = `${orgTableName}_role`;
export const orgRole = table(
	orgRoleTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @role Role identification and display
		 */
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),

		/**
		 * @system System roles are built-in templates
		 */
		isSystem: sharedCols.isSystem(),
		isActive: sharedCols.isActive(),

		/**
		 * @metadata Role configuration and UI customization
		 */
		metadata: jsonb("metadata"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
		createdBy: textCols.idFk("created_by").references(() => user.id),
	},
	(t) => [
		uniqueIndex(`uq_${orgRoleTableName}_name_org`).on(t.name, t.orgId),
		index(`idx_${orgRoleTableName}_active`).on(t.isActive),
		index(`idx_${orgRoleTableName}_system`).on(t.isSystem),
		index(`idx_${orgRoleTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Role-Policy Associations
 *
 * @domain Role Templates
 * @description Links roles to their constituent policies
 */
const orgRolePolicyTableName = `${orgRoleTableName}_policy`;
export const orgRolePolicy = table(
	orgRolePolicyTableName,
	{
		roleId: textCols
			.idFk("role_id")
			.references(() => orgRole.id, { onDelete: "cascade" })
			.notNull(),
		policyId: textCols
			.idFk("policy_id")
			.references(() => orgPolicy.id, { onDelete: "cascade" })
			.notNull(),

		/**
		 * @assignment Assignment metadata and audit trail
		 */
		assignedAt: timestamp("assigned_at").defaultNow(),
		assignedBy: textCols.idFk("assigned_by").references(() => user.id),

		createdAt: temporalCols.createdAt(),
	},
	(t) => [
		primaryKey({ columns: [t.roleId, t.policyId] }),
		index(`idx_${orgRolePolicyTableName}_assigned_at`).on(t.assignedAt),
		index(`idx_${orgRolePolicyTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Policy Assignments to Actors
 *
 * @domain ABAC Assignments
 * @description Assigns policies directly to members, teams, or departments
 */
const orgPolicyAssignmentTableName = `${orgPolicyTableName}_assignment`;
export const orgPolicyAssignment = table(
	orgPolicyAssignmentTableName,
	{
		id: textCols.id().notNull(),
		policyId: textCols
			.idFk("policy_id")
			.references(() => orgPolicy.id, { onDelete: "cascade" })
			.notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @actor Assignment target (exactly one must be set)
		 * @constraint Enforced via check constraint - only one actor type per assignment
		 */
		memberId: sharedCols.orgMemberIdFk(),
		teamId: textCols.idFk("team_id").references(() => orgTeam.id, {
			onDelete: "cascade",
		}),
		departmentId: textCols.idFk("department_id").references(() => orgDepartment.id, {
			onDelete: "cascade",
		}),

		/**
		 * @assignment Assignment metadata and audit trail
		 */
		assignedAt: timestamp("assigned_at").defaultNow(),
		assignedBy: textCols.idFk("assigned_by").references(() => orgMember.id),
		expiresAt: temporalCols.expiresAt(), // Optional policy expiration

		/**
		 * @metadata Additional assignment context
		 */
		metadata: jsonb("metadata"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
	},
	(t) => [
		// Ensure only one actor type is set per assignment
		check(
			`ck_${orgPolicyAssignmentTableName}_single_actor`,
			sql`(
                (${t.memberId} IS NOT NULL)::int + 
                (${t.teamId} IS NOT NULL)::int + 
                (${t.departmentId} IS NOT NULL)::int
            ) = 1`,
		),
		// Unique policy assignment per actor
		uniqueIndex(`uq_${orgPolicyAssignmentTableName}_member_policy`)
			.on(t.policyId, t.memberId)
			.where(isNotNull(t.memberId)),
		uniqueIndex(`uq_${orgPolicyAssignmentTableName}_team_policy`)
			.on(t.policyId, t.teamId)
			.where(isNotNull(t.teamId)),
		uniqueIndex(`uq_${orgPolicyAssignmentTableName}_dept_policy`)
			.on(t.policyId, t.departmentId)
			.where(isNotNull(t.departmentId)),
		// Performance indexes
		index(`idx_${orgPolicyAssignmentTableName}_member`).on(t.memberId),
		index(`idx_${orgPolicyAssignmentTableName}_team`).on(t.teamId),
		index(`idx_${orgPolicyAssignmentTableName}_department`).on(t.departmentId),
		index(`idx_${orgPolicyAssignmentTableName}_assigned_at`).on(t.assignedAt),
		index(`idx_${orgPolicyAssignmentTableName}_expires_at`).on(t.expiresAt),
		index(`idx_${orgPolicyAssignmentTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Role Assignments to Actors
 *
 * @domain Role Management
 * @description Assigns role templates to members, teams, or departments
 */
const orgRoleAssignmentTableName = `${orgRoleTableName}_assignment`;
export const orgRoleAssignment = table(
	orgRoleAssignmentTableName,
	{
		id: textCols.id().notNull(),
		roleId: textCols
			.idFk("role_id")
			.references(() => orgRole.id, { onDelete: "cascade" })
			.notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @actor Assignment target (exactly one must be set)
		 */
		memberId: sharedCols.orgMemberIdFk(),
		teamId: textCols.idFk("team_id").references(() => orgTeam.id, {
			onDelete: "cascade",
		}),
		departmentId: textCols.idFk("department_id").references(() => orgDepartment.id, {
			onDelete: "cascade",
		}),

		/**
		 * @assignment Assignment metadata and audit trail
		 */
		assignedAt: timestamp("assigned_at").defaultNow(),
		assignedBy: textCols.idFk("assigned_by").references(() => orgMember.id),
		expiresAt: timestamp("expires_at"), // Optional role expiration

		/**
		 * @metadata Additional assignment context
		 */
		metadata: jsonb("metadata"),

		createdAt: temporalCols.createdAt(),
		updatedAt: temporalCols.updatedAt(),
	},
	(t) => [
		// Ensure only one actor type is set per assignment
		check(
			`ck_${orgRoleAssignmentTableName}_single_actor`,
			sql`(
                (${t.memberId} IS NOT NULL)::int + 
                (${t.teamId} IS NOT NULL)::int + 
                (${t.departmentId} IS NOT NULL)::int
            ) = 1`,
		),
		// Unique role assignment per actor
		uniqueIndex(`uq_${orgRoleAssignmentTableName}_member_role`)
			.on(t.roleId, t.memberId)
			.where(isNotNull(t.memberId)),
		uniqueIndex(`uq_${orgRoleAssignmentTableName}_team_role`)
			.on(t.roleId, t.teamId)
			.where(isNotNull(t.teamId)),
		uniqueIndex(`uq_${orgRoleAssignmentTableName}_dept_role`)
			.on(t.roleId, t.departmentId)
			.where(isNotNull(t.departmentId)),
		// Performance indexes
		index(`idx_${orgRoleAssignmentTableName}_member`).on(t.memberId),
		index(`idx_${orgRoleAssignmentTableName}_team`).on(t.teamId),
		index(`idx_${orgRoleAssignmentTableName}_department`).on(t.departmentId),
		index(`idx_${orgRoleAssignmentTableName}_assigned_at`).on(t.assignedAt),
		index(`idx_${orgRoleAssignmentTableName}_expires_at`).on(t.expiresAt),
		index(`idx_${orgRoleAssignmentTableName}_created_at`).on(t.createdAt),
	],
);

/**
 * Permission Access Audit Log
 *
 * @domain Security Auditing
 * @description Tracks permission evaluations for security and compliance
 */
const orgPermissionAuditLogTableName = `${orgTableName}_permission_audit_log`;
export const orgPermissionAuditLog = table(
	orgPermissionAuditLogTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),

		/**
		 * @audit Core audit information
		 */
		memberId: sharedCols.orgMemberIdFk(),
		permissionKey: varchar("permission_key", { length: 128 }).notNull(),

		/**
		 * @resource Resource context for permission evaluation
		 */
		resourceType: varchar("resource_type", { length: 64 }),
		resourceId: varchar("resource_id", { length: 128 }),

		/**
		 * @evaluation Permission evaluation results
		 */
		granted: boolean("granted").notNull(),
		evaluationReason: text("evaluation_reason"), // Why permission was granted/denied

		/**
		 * @context Additional evaluation context
		 */
		evaluationContext: jsonb("evaluation_context"),
		userAgent: text("user_agent"),
		ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible

		evaluatedAt: timestamp("evaluated_at").defaultNow(),
		createdAt: temporalCols.createdAt(),
	},
	(t) => [
		index(`idx_${orgPermissionAuditLogTableName}_member`).on(t.memberId),
		index(`idx_${orgPermissionAuditLogTableName}_permission`).on(t.permissionKey),
		index(`idx_${orgPermissionAuditLogTableName}_granted`).on(t.granted),
		index(`idx_${orgPermissionAuditLogTableName}_evaluated_at`).on(t.evaluatedAt),
		index(`idx_${orgPermissionAuditLogTableName}_resource`).on(t.resourceType, t.resourceId),
		index(`idx_${orgPermissionAuditLogTableName}_created_at`).on(t.createdAt),
	],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 Permission System Usage Examples & TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════════════════════

/*
// Example Permission Definitions
const permissions = [
  { key: "courses.create", name: "Create Courses", category: "course_management" },
  { key: "courses.edit.own", name: "Edit Own Courses", category: "course_management" },
  { key: "courses.edit.any", name: "Edit Any Course", category: "course_management" },
  { key: "members.invite", name: "Invite Members", category: "member_management" },
  { key: "reports.financial.view", name: "View Financial Reports", category: "financial" },
];

// Example Policy with Conditional Rules
const contentCreatorPolicy = {
  name: "Content Creator Policy",
  rules: [
    { permission: "courses.create", condition: null, effect: "allow" },
    { permission: "courses.edit.own", condition: '{"resource.createdBy": "$subject.userId"}', effect: "allow" },
    { permission: "courses.view.analytics", condition: '{"resource.createdBy": "$subject.userId"}', effect: "allow" },
  ]
};

// Example Role Template
const instructorRole = {
  name: "Course Instructor",
  policies: ["Content Creator Policy", "Basic Member Policy"]
};

// ABAC Evaluation Context
interface ABACContext {
  subject: {
    userId: string;
    memberId: string;
    departmentId?: string;
    teamIds: string[];
  };
  resource: {
    type: string;
    id: string;
    createdBy?: string;
    departmentId?: string;
    teamId?: string;
  };
  environment: {
    time: Date;
    ipAddress: string;
    userAgent: string;
  };
}

// Permission Evaluation Result
interface PermissionResult {
  granted: boolean;
  reason: string;
  appliedPolicies: string[];
  evaluationTime: number;
}
*/
