// 📁 apps/volmify/src/server/libs/db/schema/org/member/employee/relations.js
import { relations } from "drizzle-orm";
import { accountTransaction } from "../../../account/schema.js";
import { userJobProfile } from "../../../user/profile/job/schema.js";
import { orgGiftCard } from "../../product/offers/schema.js";
import { orgProduct, orgProductRevenuePool } from "../../product/schema.js";
import { org } from "../../schema.js";
import { orgTaxRateSnapshot } from "../../tax/schema.js";
import { orgDepartmentEmployee } from "../department/schema.js";
import { orgMember } from "../schema.js";
import { orgTeamEmployee } from "../team/schema.js";
import {
	orgEmployee,
	orgEmployeeInvitation,
	orgEmployeeProductAttribution,
	orgEmployeeProductAttributionRevenue,
} from "./schema.js";

export const orgEmployeeRelations = relations(orgEmployee, ({ one, many }) => ({
	org: one(org, {
		fields: [orgEmployee.orgId],
		references: [org.id],
	}),

	// Employee is upgrade from member
	member: one(orgMember, {
		fields: [orgEmployee.memberId],
		references: [orgMember.id],
	}),

	// Optional job profile link
	jobProfile: one(userJobProfile, {
		fields: [orgEmployee.jobProfileId],
		references: [userJobProfile.userProfileId],
	}),

	// Employee who approved this employee
	approvedByEmployee: one(orgEmployee, {
		fields: [orgEmployee.approvedByEmployeeId],
		references: [orgEmployee.id],
		relationName: "approved_employee",
	}),

	// Department and team memberships
	departments: many(orgDepartmentEmployee),
	teams: many(orgTeamEmployee),

	// Employees this employee approved
	approvedEmployees: many(orgEmployee, {
		relationName: "approved_employees",
	}),
	giftCardsIssued: many(orgGiftCard),

	accountTransactionsCreated: many(accountTransaction),
	employeeInvitationsSent: many(orgEmployeeInvitation),
	employeeInvitationsApproved: many(orgEmployeeInvitation),
	lastAllocatedRevenuePools: many(orgProductRevenuePool),
	// revenuePoolsManaged: many(orgProductRevenuePool),
	taxRateSnapshotsCreated: many(orgTaxRateSnapshot, {
		relationName: "org_employee_tax_rate_snapshot_created",
	}),
	payoutTransactions: many(accountTransaction, {
		relationName: "org_employee_payout_transactions",
	}),
}));

export const orgEmployeeInvitationRelations = relations(orgEmployeeInvitation, ({ one }) => ({
	org: one(org, {
		fields: [orgEmployeeInvitation.orgId],
		references: [org.id],
	}),
	jobProfile: one(userJobProfile, {
		fields: [orgEmployeeInvitation.jobProfileId],
		references: [userJobProfile.userProfileId],
	}),
	invitedByEmployee: one(orgEmployee, {
		fields: [orgEmployeeInvitation.invitedBy],
		references: [orgEmployee.id],
	}),
	approvedByEmployee: one(orgEmployee, {
		fields: [orgEmployeeInvitation.approvedBy],
		references: [orgEmployee.id],
	}),
}));

export const orgEmployeeProductAttributionRelations = relations(
	orgEmployeeProductAttribution,
	({ one, many }) => ({
		employee: one(orgEmployee, {
			fields: [orgEmployeeProductAttribution.employeeId],
			references: [orgEmployee.id],
		}),
		product: one(orgProduct, {
			fields: [orgEmployeeProductAttribution.productId],
			references: [orgProduct.id],
		}),
		revenueAttributions: many(orgEmployeeProductAttributionRevenue),
	}),
);
