import { relations } from "drizzle-orm";
import { currency } from "../general/locale-and-currency/schema.js";
import { orgEmployee } from "../org/member/employee/schema.js";
import { orgMember } from "../org/member/schema.js";
import { org } from "../org/schema.js";
import { user } from "../user/schema.js";
import {
	account,
	accountBalanceSnapshot,
	accountTransaction,
	accountTransactionContext,
	accountTransactionEmployeeContext,
	accountTransactionLine,
	accountTransactionMemberContext,
	accountTransactionOrgContext,
	accountTransactionUserContext,
} from "./schema.js";

export const accountRelations = relations(account, ({ many, one }) => ({
	org: one(org, {
		fields: [account.orgId],
		references: [org.id],
	}),
	member: one(orgMember, {
		fields: [account.memberId],
		references: [orgMember.id],
	}),
	currency: one(currency, {
		fields: [account.currencyCode],
		references: [currency.code],
	}),
	balanceSnapshots: many(accountBalanceSnapshot),
	transactionLines: many(accountTransactionLine),
}));
export const accountBalanceSnapshotRelations = relations(
	accountBalanceSnapshot,
	({ one }) => ({
		account: one(account, {
			fields: [accountBalanceSnapshot.accountId],
			references: [account.id],
		}),
	}),
);
export const accountTransactionRelations = relations(
	accountTransaction,
	({ many, one }) => ({
		org: one(org, {
			fields: [accountTransaction.orgId],
			references: [org.id],
		}),
		// reference: one(accountTransaction, {
		// 	fields: [accountTransaction.referenceId],
		// 	references: [accountTransaction.id],
		// }),
		createdByEmployee: one(orgEmployee, {
			fields: [accountTransaction.createdByEmployeeId],
			references: [orgEmployee.id],
		}),
		lines: many(accountTransactionLine),
		// referencedOrder: one(orgMemberOrder, {
		// 	fields: [accountTransaction.referenceId],
		// 	references: [orgMemberOrder.id],
		// 	// Note: Only valid when referenceType = "org_member_order"
		// }),
		// referencedEmployee: one(orgEmployee, {
		// 	fields: [accountTransaction.referenceId],
		// 	references: [orgEmployee.id],
		// 	// Note: Only valid when referenceType = "org_employee_payout"
		// }),
		// referencedMember: one(orgMember, {
		// 	fields: [accountTransaction.referenceId],
		// 	references: [orgMember.id],
		// 	// Note: Only valid when referenceType = "org_member_refund"
		// }),
	}),
);
export const accountTransactionLineRelations = relations(
	accountTransactionLine,
	({ one }) => ({
		account: one(account, {
			fields: [accountTransactionLine.accountId],
			references: [account.id],
		}),
		transaction: one(accountTransaction, {
			fields: [accountTransactionLine.transactionId],
			references: [accountTransaction.id],
		}),
	}),
);

/* */
/* */
/* */

// User context relations
export const accountTransactionUserContextRelations = relations(
	accountTransactionUserContext,
	({ one }) => ({
		context: one(accountTransactionContext, {
			fields: [accountTransactionUserContext.contextId],
			references: [accountTransactionContext.id],
		}),
		user: one(user, {
			fields: [accountTransactionUserContext.userId],
			references: [user.id],
		}),
	}),
);

// Employee context relations
export const accountTransactionEmployeeContextRelations = relations(
	accountTransactionEmployeeContext,
	({ one }) => ({
		context: one(accountTransactionContext, {
			fields: [accountTransactionEmployeeContext.contextId],
			references: [accountTransactionContext.id],
		}),
		employee: one(orgEmployee, {
			fields: [accountTransactionEmployeeContext.employeeId],
			references: [orgEmployee.id],
		}),
	}),
);

// Member context relations
export const accountTransactionMemberContextRelations = relations(
	accountTransactionMemberContext,
	({ one }) => ({
		context: one(accountTransactionContext, {
			fields: [accountTransactionMemberContext.contextId],
			references: [accountTransactionContext.id],
		}),
		member: one(orgMember, {
			fields: [accountTransactionMemberContext.memberId],
			references: [orgMember.id],
		}),
	}),
);

// Organization context relations
export const accountTransactionOrgContextRelations = relations(
	accountTransactionOrgContext,
	({ one }) => ({
		context: one(accountTransactionContext, {
			fields: [accountTransactionOrgContext.contextId],
			references: [accountTransactionContext.id],
		}),
		org: one(org, {
			fields: [accountTransactionOrgContext.orgId],
			references: [org.id],
		}),
	}),
);
