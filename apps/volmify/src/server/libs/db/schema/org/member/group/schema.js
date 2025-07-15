import { boolean, index, jsonb, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { createdAt, deletedAt, id, name, table, updatedAt } from "../../../_utils/helpers.js";
import { systemPermission } from "../../../system/schema.js";
import { user } from "../../../user/schema.js";
import { orgTableName } from "../../_utils/helpers.js";
import { org } from "../../schema.js";
import { orgMember } from "../schema.js";

/**
 * Permission Groups (Role Templates)
 *
 * @abacRole Attribute Container
 * Permission groups represent collections of system permissions applied within
 * an org's scope to simplify permission management and reuse.
 */
export const orgPermissionsGroup = table(
	`${orgTableName}_permissions_group`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by").references(() => user.id), // Nullable for seeded/system roles
		name: name.notNull(),
		description: varchar("description", { length: 256 }),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		isSystem: boolean("is_system").default(false), // Flag for system-defined groups
		metadata: jsonb("metadata"),
	},
	(t) => {
		const base = `${orgTableName}_permissions_group`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
			index(`idx_${base}_is_system`).on(t.isSystem),
			uniqueIndex(`uq_${base}_name`).on(t.name, t.orgId),
		];
	},
);

/**
 * Permission Group ⇄ System Permission Mapping
 *
 * @abacRole Permission Attribute Resolver
 * Binds permission groups to low-level system permissions (defined globally)
 * enabling context-specific role composition.
 */
export const orgPermissionsGroupPermission = table(
	`${orgTableName}_permissions_group_permission`,
	{
		id: id.notNull(),
		createdAt,
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => orgPermissionsGroup.id, {
				onDelete: "cascade",
			}),
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
		assignedBy: text("assigned_by").references(() => user.id),
	},
	(t) => {
		const base = `${orgTableName}_permissions_group_permission`;
		return [
			uniqueIndex(`uq_${base}`).on(t.permissionsGroupId, t.systemPermissionId),
			index(`idx_${base}_group_id`).on(t.permissionsGroupId),
			index(`idx_${base}_permission_id`).on(t.systemPermissionId),
		];
	},
);

/**
 * Member ⇄ Permission Group Assignment
 *
 * @abacRole Attribute Assignment Model
 * Links members to orgal permission groups for ABAC resolution.
 */
export const orgMemberPermissionsGroup = table(
	`${orgTableName}_member_permissions_group`,
	{
		id: id.notNull(),
		createdAt,
		createdBy: text("created_by").references(() => user.id), // Optional audit trail
		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => orgPermissionsGroup.id, {
				onDelete: "cascade",
			}),
	},
	(t) => {
		const base = `${orgTableName}_member_permissions_group`;
		return [
			uniqueIndex(`uq_${base}`).on(t.memberId, t.permissionsGroupId),
			index(`idx_${base}_member_id`).on(t.memberId),
			index(`idx_${base}_group_id`).on(t.permissionsGroupId),
		];
	},
);
