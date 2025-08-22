import { text, timestamp } from "drizzle-orm/pg-core";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table, tEnum } from "../../_utils/tables.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
	userProfileTableName,
} from "../../2-user/1-profile/schema.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../3-org/1-member-and-employee/0_utils/index.js";

const userProfileOrgMembershipTableName = `${userProfileTableName}_org_membership`;
export const userProfileOrgMembershipAffiliationTypeEnum = tEnum(
	`${userProfileOrgMembershipTableName}_affiliation_type`,
	[
		// "member",
		// "admin",
		// "owner",
		// "job",
		// "student",
		"owner",
		"employee",
		"contractor",
		"guest",
		"partner",
		"volunteer",
	],
);
export const userProfileOrgMembershipConnectionMethodEnum = tEnum(
	`${userProfileOrgMembershipTableName}_connection_method`,
	["other", "email", "phone", "in-person"],
);
export const userProfileOrgMembership = table(
	userProfileOrgMembershipTableName,
	{
		// IMP
		// Q: make the primary key a `id` field or a compound primary key of `userProfileId` and `orgMemberId`?
		id: textCols.idPk().notNull(),
		userProfileId: userProfileIdFkCol().notNull(),
		orgMemberId: orgMemberIdFkCol().notNull(),

		// status

		joinedAt: temporalCols.activity.joinedAt().defaultNow(),
		approvedAt: timestamp("approved_at", {
			precision: 3,
			withTimezone: true,
		}),
		startedAt: timestamp("started_at", {
			precision: 3,
			withTimezone: true,
		}).defaultNow(),
		endedAt: timestamp("ended_at", { precision: 3, withTimezone: true }),

		affiliationType: userProfileOrgMembershipAffiliationTypeEnum("affiliation_type").notNull(),
		connectionMethod: userProfileOrgMembershipConnectionMethodEnum("connection_method"),
		applicationNotes: text("application_notes"),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...userProfileIdFkExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
		}),
		...orgMemberIdFkExtraConfig({
			tName: userProfileOrgMembershipTableName,
			cols,
			colFkKey: "orgMemberId",
		}),
		uniqueIndex({
			tName: userProfileOrgMembershipTableName,
			cols: [cols.userProfileId, cols.orgMemberId],
		}),
		...multiIndexes({
			tName: userProfileOrgMembershipTableName,
			colsGrps: [
				{ cols: [cols.joinedAt] },
				{ cols: [cols.approvedAt] },
				{ cols: [cols.startedAt] },
				{ cols: [cols.endedAt] },
				{ cols: [cols.affiliationType] },
				{ cols: [cols.connectionMethod] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
