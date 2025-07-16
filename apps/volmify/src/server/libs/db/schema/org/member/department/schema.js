import {
	foreignKey,
	index,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import {
	createdAt,
	deletedAt,
	fk,
	id,
	name,
	table,
	updatedAt,
} from "../../../_utils/helpers.js";
import { orgTableName } from "../../_utils/helpers.js";
import { org } from "../../schema.js";
import { orgTeam } from "../team/schema.js";

const orgDepartmentTableName = `${orgTableName}_department`;
/**
 * Organizational Department Structure
 *
 * @abacRole Structural Grouping
 * Traditional department construct for hierarchical orgs. Provides
 * structure and influences default permissions for members and teams.
 */
export const orgDepartment = table(
	orgDepartmentTableName,
	{
		id: id.notNull(),

		orgId: fk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		/**
		 * @domain
		 * Departmental units used for org charts and structured ABAC.
		 */
		name: name.notNull(),
		description: text("description"),

		// isDefault: boolean("is_default").default(false), // Only one per org
		// isActive: boolean("is_active").default(true),

		/**
		 * @optional
		 * Used to define nested department structures (e.g., HR > Payroll)
		 */
		parentId: fk("parent_id"), // .references(() => departments.id),

		createdAt,
		updatedAt,
		deletedAt,

		metadata: jsonb("metadata"),
	},
	(t) => [
		foreignKey({
			columns: [t.parentId],
			foreignColumns: [t.id],
			name: `fk_${orgDepartmentTableName}_parent`,
		}),
		uniqueIndex(`uq_${orgDepartmentTableName}_name`).on(t.orgId, t.name),
		// uniqueIndex(`uq_${orgDepartmentTableName}_default`)
		// 	.on(t.orgId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${orgDepartmentTableName}_active`).on(t.isActive),
		index(`idx_${orgDepartmentTableName}_org_id`).on(t.orgId),
		index(`idx_${orgDepartmentTableName}_parent_id`).on(t.parentId),
	],
);

const orgDepartmentMembershipTableName = `${orgDepartmentTableName}_membership`;
export const orgDepartmentMembershipStatusEnum = pgEnum(
	`${orgDepartmentMembershipTableName}_status`,
	["active", "inactive", "pending", "removed"],
);

// NOTE: is the following needed?
// /**
//  * Member-Department Assignment (M:M)
//  *
//  * @abacRole Structural Permission Grouping
//  * Members can belong to one or more departments. This informs both permission
//  * inheritance and UI logic (like filtering or default views).
//  */
// export const orgDepartmentMembership = table(
// 	orgDepartmentMembershipTableName,
// 	{
// 		memberId: text("member_id")
// 			.notNull()
// 			.references(() => orgMember.id, { onDelete: "cascade" }),

// 		departmentId: text("department_id")
// 			.notNull()
// 			.references(() => orgDepartment.id, { onDelete: "cascade" }),

// 		status: orgDepartmentMembershipStatusEnum("status")
// 			.notNull()
// 			.default("active"),
// 		// isDefault: boolean("is_default").default(false), // Only one per member
// 		joinedAt: timestamp("joined_at").defaultNow(),

// 		createdAt,
// 		updatedAt,
// 	},
// 	(t) => [
// 		primaryKey({ columns: [t.memberId, t.departmentId] }),
// 		// uniqueIndex(`uq_${orgDepartmentMembershipTableName}`).on(
// 		// 	t.memberId,
// 		// 	t.departmentId,
// 		// ),
// 		// uniqueIndex(`uq_${orgDepartmentMembershipTableName}_default`)
// 		// 	.on(t.memberId, t.isDefault)
// 		// 	.where(eq(t.isDefault, true)),
// 		index(`idx_${orgDepartmentMembershipTableName}_member_id`).on(t.memberId),
// 		index(`idx_${orgDepartmentMembershipTableName}_department_id`).on(
// 			t.departmentId,
// 		),
// 		index(`idx_${orgDepartmentMembershipTableName}_status`).on(t.status),
// 		index(`idx_${orgDepartmentMembershipTableName}_joined_at`).on(t.joinedAt),
// 		index(`idx_${orgDepartmentMembershipTableName}_created_at`).on(t.createdAt),
// 		index(`idx_${orgDepartmentMembershipTableName}_updated_at`).on(t.updatedAt),
// 	],
// );

const orgTeamDepartmentTableName = `${orgDepartmentTableName}_team`;
export const orgTeamDepartmentRelationshipTypeEnum = pgEnum(
	`${orgTeamDepartmentTableName}_relationship_type`,
	["lead", "collaboration", "support"],
);
/**
 * Team ⇄ Department Mapping
 *
 * @abacRole Cross-Domain Access Bridge
 * Connects teams with departments to support matrix-style org charts and
 * permission inheritance across domains.
 */
export const orgTeamDepartment = table(
	`${orgTeamDepartmentTableName}`,
	{
		teamId: fk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		departmentId: fk("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		// isPrimary: boolean("is_primary").default(false), // Single primary department per team
		relationshipType: orgTeamDepartmentRelationshipTypeEnum("relationship_type")
			.notNull()
			.default("collaboration"),

		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_team_department`;
		return [
			primaryKey({ columns: [t.teamId, t.departmentId] }),
			// uniqueIndex(`uq_${base}_primary`)
			// 	.on(t.teamId, t.isPrimary)
			// 	.where(eq(t.isPrimary, true)),
			index(`idx_${base}_team_id`).on(t.teamId),
			index(`idx_${base}_department_id`).on(t.departmentId),
		];
	},
);
