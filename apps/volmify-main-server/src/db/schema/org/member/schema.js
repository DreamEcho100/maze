import { pgEnum } from "drizzle-orm/pg-core";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-profile-id.js";
import { multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { orgMemberTableName } from "./_utils/index.js";

// - **`orgMember`** = Customer/user presence in org (enrolls in courses, places orders)

export const orgMemberBaseRoleEnum = pgEnum(`${orgMemberTableName}_base_role`, [
	"owner", // Full control over the org; can manage settings, members, and resources
	"member", // Standard member role; actual permissions governed by group mappings
	// "admin", // Full org privileges; manage members, teams, configs
	"employee",
]);

export const orgMemberStatusEnum = pgEnum(`${orgMemberTableName}_status`, [
	"active",
	// Q: What're the possible statuses of a member/user of an org?
	"banned",
	"pending",
	"none_but_invited_as_employee",
]);

/**
 * Org Member (ABAC Subject)
 *
 * @abacRole Subject (User-Org Contextualized Identity)
 * Represents the user within a specific org and acts as the subject
 * in ABAC evaluations. Connects the global user identity to tenant-specific roles.
 */
export const orgMember = table(
	orgMemberTableName,
	{
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		orgId: orgIdFkCol().notNull(),

		userProfileId: userProfileIdFkCol().notNull(),

		// Q: displayName vs customerDisplayName/memberDisplayName
		displayName: textCols.displayName(),
		/**
		 * Determines baseline org access. Most logic uses permission groups for actual decisions.
		 */
		role: orgMemberBaseRoleEnum("role").notNull().default("member"),

		/**
		 * Status can be:
		 */
		status: orgMemberStatusEnum("status").notNull().default("active"),

		joinedAt: temporalCols.activity.joinedAt(),
		lastActiveAt: temporalCols.activity.lastActiveAt(),
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgMemberTableName,
			cols,
		}),
		...userProfileIdFkExtraConfig({
			tName: orgMemberTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgMemberTableName,
			cols: [cols.userProfileId, cols.orgId],
		}),
		multiIndexes({
			tName: orgMemberTableName,
			colsGrps: [
				{ cols: [cols.role] },
				{ cols: [cols.status] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastActiveAt] },
				{ cols: [cols.joinedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);
