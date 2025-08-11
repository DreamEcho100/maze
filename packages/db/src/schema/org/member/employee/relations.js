// 📁 apps/volmify/src/server/libs/db/schema/org/member/employee/relations.js
import { relations } from "drizzle-orm";
import {
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
} from "#schema/general/category/schema.js";
import { accountTransaction, accountTransactionEmployeeContext } from "../../../account/schema.js";
import { userJobProfile } from "../../../user/profile/job/schema.js";
import { orgGiftCard } from "../../product/offers/schema.js";
import { orgProductRevenuePool } from "../../product/schema.js";
import { org } from "../../schema.js";
import { orgTaxRateSnapshot } from "../../tax/schema.js";
import { orgDepartmentEmployee } from "../department/schema.js";
import { orgMember } from "../schema.js";
import { orgTeamEmployee } from "../team/schema.js";
import { orgEmployeeInvitation } from "./invitation/schema.js";
import { orgEmployee } from "./schema.js";

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
	orgsCategoriesCreated: many(orgCategory, { relationName: "orgsCategoriesCreated" }),
	orgsCategoriesLastUpdated: many(orgCategory, { relationName: "orgsCategoriesLastUpdated" }),
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
