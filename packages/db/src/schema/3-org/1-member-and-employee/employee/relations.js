import { relations } from "drizzle-orm";
import {
	accountTransaction,
	accountTransactionEmployeeContext,
	orgProductRevenuePool,
	userJobProfile,
} from "../../../schema.js";
import {
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
} from "../../1-category/schema.js";
import { orgDepartmentEmployee, orgTeamEmployee } from "../../2-team-and-department/schema.js";
import { orgTaxRateSnapshot } from "../../3-tax/schema.js";
import { orgGiftCard } from "../../5-offers/schema.js";
import { org } from "../../00-schema.js";
import { orgMember } from "../00-schema.js";
import { orgEmployeeInvitation } from "./invitation/schema.js";
import { orgEmployee } from "./schema.js";

// ### org -> member -> employee
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
	employeeInvitationsSent: many(orgEmployeeInvitation, {
		relationName: "org_employee_invitations_sent",
	}),
	employeeInvitationsApproved: many(orgEmployeeInvitation, {
		relationName: "org_employee_invitations_approved",
	}),
	lastAllocatedRevenuePools: many(orgProductRevenuePool),
	// revenuePoolsManaged: many(orgProductRevenuePool),
	taxRateSnapshotsCreated: many(orgTaxRateSnapshot),
	payoutTransactions: many(accountTransaction, {
		relationName: "org_employee_payout_transactions",
	}),

	accountTransactions: many(accountTransactionEmployeeContext),

	//
	orgsCategoriesCreated: many(orgCategory, {
		relationName: "orgsCategoriesCreated",
	}),
	orgsCategoriesLastUpdated: many(orgCategory, {
		relationName: "orgsCategoriesLastUpdated",
	}),
	orgsCategoriesAssociationsCreated: many(orgCategoryAssociation, {
		relationName: "orgsCategoriesAssociationsCreated",
	}),
	orgsCategoriesAssociationsLastUpdated: many(orgCategoryAssociation, {
		relationName: "orgsCategoriesAssociationsLastUpdated",
	}),
	orgsCategoriesClosuresAncestorsPathsCreated: many(orgCategoryClosureAncestorPath, {
		relationName: "orgsCategoriesClosuresAncestorsPathsCreated",
	}),
	orgsCategoriesClosuresAncestorsPathsLastUpdated: many(orgCategoryClosureAncestorPath, {
		relationName: "orgsCategoriesClosuresAncestorsPathsLastUpdated",
	}),
	orgsCategoriesClosuresCreated: many(orgCategoryClosure, {
		relationName: "orgsCategoriesClosuresCreated",
	}),
	orgsCategoriesClosuresLastUpdated: many(orgCategoryClosure, {
		relationName: "orgsCategoriesClosuresLastUpdated",
	}),
}));

// #### org -> member -> employee -> invitation
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
