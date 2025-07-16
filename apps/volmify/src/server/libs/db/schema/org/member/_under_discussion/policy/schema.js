import { isNotNull, sql } from "drizzle-orm";
import {
	check,
	index,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { createdAt, fk, id, name, table, updatedAt } from "../../../../_utils/helpers.js";
// import {
// } from { user } from "../../../user/schema.js";
import { orgTableName } from "../../../_utils/helpers.js";
import { org } from "../../../schema.js";
import { orgDepartment } from "../../department/schema.js";
import { orgMember } from "../../schema.js";
import { orgTeam } from "../../team/schema.js";

const prgPermissionTableName = `${orgTableName}_permission`;
export const orgPermissionScopeEnum = pgEnum(`${prgPermissionTableName}_scope`, [
	"global", // Applies to all resources in the org
	"organization", // Applies to all resources within the organization
	"resource", // Applies to a specific resource
	// "team", // Applies to all resources within a specific team
	// "department", // Applies to all resources within a specific department
	// "member", // Applies to all resources owned by a specific member
	// "custom", // Custom scope defined by the application
]);
/**
 * @domain Permissions
 * @description A fine-grained action that can be granted via a policy (e.g., "edit_invoice").
 */
export const orgPermission = table(
	prgPermissionTableName,
	{
		id: id.notNull(),

		/**
		 * @key
		 * Used in policies and code to reference specific permissions.
		 */
		key: varchar("key", { length: 64 }).notNull(), // e.g., "view_reports"
		description: text("description"),
		// scope: varchar('scope', { length: 16 }).$type<'global' | 'organization' | 'resource'>().default('organization').notNull(),
		scope: orgPermissionScopeEnum("scope").notNull().default("organization"), // e.g., "global", "organization", "resource"

		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${prgPermissionTableName}_created_at`).on(t.createdAt),
		index(`idx_${prgPermissionTableName}_updated_at`).on(t.updatedAt),
	],
);

const orgPolicyTableName = `${orgTableName}_policy`;
/**
 * @domain ABAC
 * @description A policy is a group of permission rule that define conditional access.
 */
export const orgPolicy = table(
	orgPolicyTableName,
	{
		id: id.notNull(),
		orgId: fk(`${orgTableName}_id`)
			.references(() => org.id)
			.notNull(),

		name: name.notNull(),
		description: text("description"),
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgPolicyTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgPolicyTableName}_updated_at`).on(t.updatedAt),
		uniqueIndex(`uq_${orgPolicyTableName}_name`).on(t.name, t.orgId),
	],
);

const orgPolicyRuleTableName = `${orgPolicyTableName}_rule`;
export const orgPolicyRuleEffectEnum = pgEnum(`${orgPolicyTableName}_rule_effect`, [
	"allow", // Grants permission if conditions are met
	"deny", // Explicitly denies permission if conditions are met
]);

// 🎭 Role-to-Policy Grouping & Templates
// *   A “Role” is a template made of policies.
// *   When a role is assigned to a user, all linked policies are added to their assignments.
// *   You can render roles as presets in the admin panel.
const orgRoleTableName = `${orgTableName}_role`;
export const orgRole = table(
	orgRoleTableName,
	{
		id: id.notNull(),
		name: varchar("name", { length: 64 }).notNull(),
		description: varchar("description", { length: 256 }),
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgRoleTableName}_name`).on(t.name),
		index(`idx_${orgRoleTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgRoleTableName}_updated_at`).on(t.updatedAt),
		uniqueIndex(`uq_${orgRoleTableName}_name`).on(t.name),
	],
);
export const rolePolicyAssignments = table(
	"role_policy_assignments",
	{
		roleId: fk("role_id")
			.references(() => orgRole.id)
			.notNull(),
		policyId: fk("policy_id")
			.references(() => orgPolicy.id)
			.notNull(),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.roleId, t.policyId] }),
		index("idx_role_policy_assignments_created_at").on(t.createdAt),
	],
);

/**
 * @domain ABAC
 * @description A conditional rule that links a permission to a policy.
 */
export const orgPolicyRule = table(orgPolicyRuleTableName, {
	id: id.notNull(),
	policyId: fk("policy_id")
		.references(() => orgPolicy.id)
		.notNull(),
	permissionId: fk("permission_id")
		.references(() => orgPermission.id)
		.notNull(),

	/**
	 * @abac
	 * Optional ABAC-style condition (as JSON or DSL)
	 * e.g. { "resource.department_id": "$member.department_id" }
	 */
	condition: text("condition"),

	/**
	 * @note
	 * Can represent allow/deny, priority, or scoped rule logic
	 */
	effect: orgPolicyRuleEffectEnum("effect").notNull().default("allow"),

	// json_logic: jsonb('json_logic'), // optional override of raw DSL
});

const orgPolicyAssignmentTableName = `${orgPolicyTableName}_assignment`;
/**
 * @domain ABAC
 * @description Binds a policy to a specific actor (member/team/department).
 */
export const orgPolicyAssignment = table(
	orgPolicyAssignmentTableName,
	{
		id: id.notNull(),
		policyId: fk("policy_id")
			.references(() => orgPolicy.id)
			.notNull(),

		orgId: fk(`${orgTableName}_id`)
			.references(() => org.id)
			.notNull(),

		/**
		 * @actor
		 * Only one of these should be set for each row (enforced at app layer).
		 */
		memberId: fk("member_id").references(() => orgMember.id),
		teamId: fk("team_id").references(() => orgTeam.id),
		departmentId: fk("department_id").references(() => orgDepartment.id),

		assignedAt: timestamp("assigned_at").defaultNow(),
		assignedBy: text("assigned_by").references(() => orgMember.id),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
	},
	(t) => [
		index(`idx_${orgPolicyAssignmentTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgPolicyAssignmentTableName}_updated_at`).on(t.updatedAt),
		uniqueIndex(`uq_${orgPolicyAssignmentTableName}_policy_actor`).on(
			t.policyId,
			t.memberId,
			t.teamId,
			t.departmentId,
		),
		check(
			`ck_${orgPolicyAssignmentTableName}_one_actor`,
			sql`(
				${isNotNull(t.memberId)} OR
				${isNotNull(t.teamId)} OR
				${isNotNull(t.departmentId)}
			) AND NOT (
				${isNotNull(t.memberId)} AND
				${isNotNull(t.teamId)} AND
				${isNotNull(t.departmentId)}
			)`,
		),
	],
);

// // Audit Logging (Who tried what, when, and why)
// export const accessLogs = table('access_logs', {
//   id: id.notNull(),
//   member_id: fk('member_id').notNull(),
//   permission: varchar('permission', { length: 64 }).notNull(),
//   resource_type: varchar('resource_type', { length: 64 }),
//   resource_id: varchar('resource_id', { length: 128 }),
//   result: varchar('result', { length: 8 }).$type<'allow' | 'deny'>().notNull(),
//   context: text('context'),
//   timestamp: timestamp('timestamp').defaultNow(),

//   permission_key: varchar('permission_key', { length: 64 }).notNull(),
//   granted: boolean('granted').notNull(),
//   evaluated_at: timestamp('evaluated_at').defaultNow(),
//   context_json: jsonb('context_json'), // includes scope, member, rules used
// });

/*
interface Condition {
  field: string;
  operator: '$eq' | '$ne' | '$gt' | '$lt' | '$in' | '$any';
  value: string;
};
interface ExportablePolicy {
  name: string;
  description?: string;
  permissions: {
    permissionKey: string;
    effect: 'allow' | 'deny';
    condition: string; // ABAC DSL string
  }[];
};
interface PermissionGraph {
  memberId: string;
  permissions: {
    key: string;
    effect: 'allow' | 'deny';
    source: 'direct' | 'team' | 'department' | 'role';
    ruleId: string;
    policyId: string;
    via?: string; // role name or team name
  }[];
};
*/
