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
import { org } from "../../schema.js";
import { orgMember } from "../schema.js";
import { orgTeam } from "../team/schema.js";

/**
 * Organizational Department Structure
 *
 * @abacRole Structural Grouping
 * Traditional department construct for hierarchical orgs. Provides
 * structure and influences default permissions for members and teams.
 */
export const orgDepartment = table(
	`${orgTableName}_department`,
	{
		id: id.notNull(),

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		name: name.notNull(),
		description: text("description"),
		color: text("color"),

		isDefault: boolean("is_default").default(false), // Only one per org

		isActive: boolean("is_active").default(true),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => {
		const base = `${orgTableName}_department`;
		return [
			uniqueIndex(`uq_${base}_name`).on(t.orgId, t.name),
			uniqueIndex(`uq_${base}_default`)
				.on(t.orgId, t.isDefault)
				.where(eq(t.isDefault, true)),
			index(`idx_${base}_org`).on(t.orgId),
			index(`idx_${base}_active`).on(t.isActive),
		];
	},
);

/**
 * Member-Department Assignment (M:M)
 *
 * @abacRole Structural Permission Grouping
 * Members can belong to one or more departments. This informs both permission
 * inheritance and UI logic (like filtering or default views).
 */
export const orgMemberDepartment = table(
	`${orgTableName}_member_department`,
	{
		id: id.notNull(),

		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),

		departmentId: text("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		isDefault: boolean("is_default").default(false), // Only one per member

		joinedAt: timestamp("joined_at").defaultNow(),

		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_member_department`;
		return [
			uniqueIndex(`uq_${base}`).on(t.memberId, t.departmentId),
			uniqueIndex(`uq_${base}_default`)
				.on(t.memberId, t.isDefault)
				.where(eq(t.isDefault, true)),
			index(`idx_${base}_member`).on(t.memberId),
			index(`idx_${base}_department`).on(t.departmentId),
		];
	},
);

/**
 * Team ⇄ Department Mapping
 *
 * @abacRole Cross-Domain Access Bridge
 * Connects teams with departments to support matrix-style org charts and
 * permission inheritance across domains.
 */
export const orgTeamDepartment = table(
	`${orgTableName}_team_department`,
	{
		id: id.notNull(),
		teamId: fk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		departmentId: fk("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		isPrimary: boolean("is_primary").default(false), // Single primary department per team
		relationshipType: text("relationship_type").default("collaboration"), // 'lead' | 'collaboration' | 'support'

		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_team_department`;
		return [
			uniqueIndex(`uq_${base}`).on(t.teamId, t.departmentId),
			uniqueIndex(`uq_${base}_primary`)
				.on(t.teamId, t.isPrimary)
				.where(eq(t.isPrimary, true)),
			index(`idx_${base}_team`).on(t.teamId),
			index(`idx_${base}_department`).on(t.departmentId),
		];
	},
);
