import { sql } from "drizzle-orm";
import { jsonb, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../_utils/cols/numeric.js";
import {
	currencyCodeExtraConfig,
	currencyCodeFkCol,
} from "../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdExtraConfig,
	orgEmployeeIdFkCol,
} from "../_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgMemberIdExtraConfig,
	orgMemberIdFkCol,
} from "../_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdExtraConfig, orgIdFkCol } from "../_utils/cols/shared/foreign-keys/org-id.js";
import { userIdExtraConfig, userIdFkCol } from "../_utils/cols/shared/foreign-keys/user-id.js";
import { sharedCols } from "../_utils/cols/shared/index.js";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { check, multiForeignKeys, multiIndexes } from "../_utils/helpers.js";
import { table } from "../_utils/tables.js";

// import { orgMemberIdFkCol } from "../org/member/_utils/fk.js";

// ### **Double-Entry Bookkeeping (Critical Missing!)**

const accountTableName = "account";

export const orgAccountingLedgerAccountTypeEnum = pgEnum(`${accountTableName}_type`, [
	"asset", // `asset`: is "cash", "accounts_receivable", cash equivalents, can be used to pay liabilities
	"liability", // `liability`: is "accounts_payable", "credit_card", "loan", obligations to pay
	"equity", // `equity`: is "retained_earnings", "owner's_equity", residual interest in the assets
	"revenue", // `revenue`: is "sales", "service_income", inflows from primary business activities
	"expense", // `expense`: is "cost_of_goods_sold", "operating_expenses", outflows from primary business activities
]);
export const OrgAccountingLedgerNormalBalanceTypeEnum = pgEnum("balance_type", [
	"debit", // Normal balance for assets and expenses
	"credit", // Normal balance for liabilities, equity, and revenue
]);

// /**
//  * Ledger account types - used to define the behavior of financial accounts.
//  *
//  * Examples:
//  * - Assets: Bank, Cash, Receivables
//  * - Liabilities: Payables, Taxes Payable
//  * - Equity: Retained Earnings
//  * - Revenue: Course Sales, Platform Fees
//  * - Expenses: Job Payouts, Stripe Fees
//  */
// export const accountTypes = table(`${accountTableName}_types`, {
// 	id: textCols.idPk().notNull(),
// 	name: textCols.name().notNull(),
// 	category: textCols.category().notNull(), // 'asset', 'liability', 'revenue', 'expense', 'equity', 'other'.
// 	system: boolean("system").default(false), // If true, internal platform usage
// });

/**
 *  Accounting ledger pattern
 * Chart of accounts - organizational or system accounts that hold balances.
 */
export const account = table(
	accountTableName,
	{
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description").notNull(),

		type: orgAccountingLedgerAccountTypeEnum("type").notNull(), // e.g. 'asset', 'liability', 'equity', 'revenue', 'expense'

		// Balance tracking
		currentBalance: numericCols.currency.amount("current_balance").default("0.00"),
		normalBalance: OrgAccountingLedgerNormalBalanceTypeEnum("normal_balance").notNull(), // e.g. 'debit', 'credit'

		orgId: orgIdFkCol(), // Nullable to allow system/global accounts
		memberId: orgMemberIdFkCol(), // Optional: if account is user/member-specific
		currencyCode: currencyCodeFkCol().notNull(), // Currency for the account balance

		isSystem: sharedCols.isSystem(),
		isActive: sharedCols.isActive(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: accountTableName,
			cols,
		}),
		...orgMemberIdExtraConfig({
			tName: accountTableName,
			cols,
		}),
		...currencyCodeExtraConfig({
			tName: accountTableName,
			cols,
		}),
		...multiIndexes({
			tName: accountTableName,
			colsGrps: [
				{ cols: [cols.name] },
				{ cols: [cols.type] },
				// { cols: [t.isSystem] },
				// { cols: [t.isActive] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
		// TODO:
		// // Ensure current balance is non-negative for assets, liabilities, and equity
		// check(
		// 	`check_${accountTableName}_balance`,
		// 	sql`${t.normalBalance} = '"${OrgAccountingLedgerNormalBalanceTypeEnum.enumName[0]}"' AND ${t.currentBalance} >= 0 OR ${t.normalBalance} = '"${OrgAccountingLedgerNormalBalanceTypeEnum.enumName[1]}"' AND ${t.currentBalance} <= 0`,
		// ),
	],
);

const accountBalanceSnapshotTableName = `${accountTableName}_balance_snapshot`;
/**
 * Snapshots of account balances for historical, reporting, or audit reasons.
 */
export const accountBalanceSnapshot = table(
	accountBalanceSnapshotTableName,
	{
		id: textCols.idPk().notNull(),
		accountId: textCols.idFk("account_id").notNull(),
		// Q: snapshotDate vs createdAt? Should we use createdAt for the snapshot date? consistency vs clarity vs accuracy?
		snapshotDate: temporalCols.business.transactionDate("snapshot_date").notNull(),
		balance: numericCols.currency.amount("balance").notNull(), // Balance at the snapshot date
		// currency: currencyCodeFkCol().notNull(), // Currency for the snapshot

		// Audit
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		isSystem: sharedCols.isSystem(),
		isActive: sharedCols.isActive(),
	},
	(t) => [
		multiForeignKeys({
			tName: accountBalanceSnapshotTableName,
			fkGroups: [
				{
					cols: [t.accountId],
					foreignColumns: [account.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: accountBalanceSnapshotTableName,
			colsGrps: [
				{ cols: [t.snapshotDate] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
				{ cols: [t.isSystem] },
				{ cols: [t.isActive] },
			],
		}),
		// Ensure balance is non-negative
		// Q: Can/Should the balance be negative in the first place?
		check({
			tName: accountBalanceSnapshotTableName,
			postfix: "valid_balance",
			condition: sql`${t.balance} >= 0`,
		}),
	],
);

const accountTransactionTableName = `${accountTableName}_transaction`;

// export const accountTransactionReferenceTypeEnum = pgEnum(
// 	`${accountTransactionTableName}_reference_type`,
// 	[
// 		// Q: What are the possible reference types based on the current system?
// 		"platform",
// 		"payment_processor", // e.g. "stripe_payment_12345"
// 		"org_member_order", // e.g. 'org_member_order_12345'
// 		"org_employee_payout", // e.g. 'org_employee_payout_67890'
// 		"org_member_refund", // e.g. 'org_member_refund_54321'
// 		// TODO: Add more on the future as needed
// 		// "adjustment", // e.g. 'adjustment_98765'
// 		// "transfer", // e.g. 'transfer_112233'
// 		"org_member_gift_card",
// 		"org_employee_gift_card",
// 	],
// );

export const accountTransactionBusinessEntityTypeEnum = pgEnum(
	`${accountTransactionTableName}_business_entity_type`,
	[
		"org_member_order", // Links to order for purchase transactions
		"org_employee_payout", // Links to payout for instructor payments
		"org_member_refund", // Links to refund for customer refunds
		"platform_fee", // Platform-specific transactions
		"payment_processor", // Stripe, PayPal, etc.
		"adjustment", // Manual adjustments
	],
);
/**
 * Double-entry ledger transaction header.
 */
export const accountTransaction = table(
	accountTransactionTableName,
	{
		id: textCols.idPk().notNull(),
		// Q: is there a case where we need to store orgId here? and should it be nullable?
		orgId: orgIdFkCol(), // Org ID for the transaction

		// createdAt: timestamp("created_at").defaultNow().notNull(),
		// description: text("description"),
		// reference: text("reference"), // e.g. 'stripe_payment_123', org_member_orderId, invoiceId
		reference: textCols.tagline("reference").notNull(),

		transactionNumber: textCols.code("transaction_number").notNull(),
		transactionDate: temporalCols.business.transactionDate().notNull(),
		description: textCols.shortDescription("description").notNull(),
		totalAmount: numericCols.currency.amount("total_amount").notNull(),
		currencyCode: currencyCodeFkCol().notNull(),

		// Transaction identification
		// referenceType: accountTransactionReferenceTypeEnum("reference_type"), // "org_member_order", "org_employee_payout", "org_member_refund"
		// referenceId: textCols.idFk("reference_id"), // Order ID, payout ID, etc.

		// Audit
		createdAt: temporalCols.audit.createdAt(),
		createdByEmployeeId: orgEmployeeIdFkCol({ name: "created_by_employee_id" }),

		// Business entity reference (enhances your existing reference system)
		businessEntityType: accountTransactionBusinessEntityTypeEnum("business_entity_type"),
		businessEntityId: textCols.idFk("business_entity_id"), // Points to order, payout, etc.
	},
	(cols) => [
		// uniqueIndex(`uq_${accountTransactionTableName}_reference_entity`).on(
		// 	t.referenceType,
		// 	t.referenceId,
		// ),
		...orgIdExtraConfig({
			tName: accountTransactionTableName,
			cols,
		}),
		...orgEmployeeIdExtraConfig({
			tName: accountTransactionTableName,
			cols,
			colFkKey: "createdByEmployeeId",
		}),
		...currencyCodeExtraConfig({
			tName: accountTransactionTableName,
			cols,
		}),
		...multiIndexes({
			tName: accountTransactionTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.reference] },
				{ cols: [cols.transactionNumber] },
				{ cols: [cols.transactionDate] },
				{ cols: [cols.totalAmount] },
			],
		}),
	],
);

const accountTransactionLineTableName = `${accountTransactionTableName}_line`;
/**
 * Line items for a transaction - this is where the accounting happens.
 *
 * Every transaction must sum to 0 (debits = credits).
 */
export const accountTransactionLine = table(
	accountTransactionLineTableName,
	{
		id: textCols.idPk().notNull(),
		accountId: textCols.idFk("account_id").notNull(),
		transactionId: textCols.idFk("transaction_id").notNull(),

		normalBalance: OrgAccountingLedgerNormalBalanceTypeEnum("normal_balance").notNull(), // e.g. 'debit', 'credit'
		amount: numericCols.currency.amount("amount").notNull(), // Positive for debits, negative for credits
		currency: currencyCodeFkCol().notNull(), // Currency for the line item

		// Q: Should we store the `debitAmount` and `creditAmount` here as well? or is it redundant?
		// // Double-entry amounts
		// debitAmount: numericCols.currency.amount("debit_amount").default("0.00"),
		// creditAmount: numericCols.currency.amount("credit_amount").default("0.00"),

		// description: textCols.shortDescription("description").notNull(),
		// memo: text("memo"),
	}, // , (t) => [
	//   // Ensure double-entry balancing
	//   check(`ck_${accountTransactionLineTableName}_double_entry_balance`,
	//     sql`(${t.debitAmount} > 0 AND ${t.creditAmount} = 0) OR (${t.creditAmount} > 0 AND ${t.debitAmount} = 0)`),
	// ]
	(t) => [
		...multiForeignKeys({
			tName: accountTransactionLineTableName,
			fkGroups: [
				{
					cols: [t.accountId],
					foreignColumns: [account.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [t.transactionId],
					foreignColumns: [accountTransaction.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: accountTransactionLineTableName,
			colsGrps: [{ cols: [t.normalBalance] }, { cols: [t.amount] }, { cols: [t.currency] }],
		}),
	],
);

/**************************************************************************/
/**************************************************************************/
/**************************************************************************/

const accountTransactionContextTableName = `${accountTransactionTableName}_context`;
export const accountTransactionContextTypeEnum = pgEnum(
	`${accountTransactionContextTableName}_type`,
	["primary", "secondary", "derived", "administrative"],
);
export const accountTransactionContextRelationshipTypeEnum = pgEnum(
	`${accountTransactionContextTableName}_relationship_type`,
	["beneficiary", "participant", "creator", "viewer", "administrator"],
);
/**
 *  Base context table (shared metadata across all context types)
 */
export const accountTransactionContext = table(
	accountTransactionContextTableName,
	{
		id: textCols.idPk().notNull(),

		/** @businessLogic Links to your existing transaction record */
		transactionId: textCols.idFk("transaction_id").notNull(),

		/** @professionalContext Context type for access pattern optimization */
		contextType: accountTransactionContextTypeEnum("context_type").notNull(),

		/** @businessRule How this entity relates to the transaction */
		relationshipType: accountTransactionContextRelationshipTypeEnum("relationship_type").notNull(),

		/** @auditTrail When context access was established */
		grantedAt: temporalCols.audit.createdAt(),

		/** @businessLogic Context-specific metadata */
		metadata: jsonb("metadata"),
	},
	(t) => [
		...multiForeignKeys({
			tName: accountTransactionContextTableName,
			fkGroups: [
				{
					cols: [t.transactionId],
					foreignColumns: [accountTransaction.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: accountTransactionContextTableName,
			colsGrps: [
				// { cols: [t.contextType] },
				// { cols: [t.relationshipType] },
				{ cols: [t.grantedAt] },
			],
		}),
	],
);

const accountTransactionUserContextTableName = `${accountTransactionTableName}_user_context`;
export const accountTransactionUserAccessLevelEnum = pgEnum(
	`${accountTransactionUserContextTableName}_access_level`,
	["full", "summary", "viewer", "restricted"],
);
/**
 * User Context (cross-org transaction access)
 */
export const accountTransactionUserContext = table(
	accountTransactionUserContextTableName,
	{
		id: textCols.idPk().notNull(),

		/** @businessLogic Links to base context record */
		contextId: textCols.idFk("context_id").notNull(),

		userId: userIdFkCol().notNull(),

		/** @organizationScope Optional org scoping for filtered views */
		orgId: orgIdFkCol(),

		/** @businessRule User's access level to this transaction */
		accessLevel: accountTransactionUserAccessLevelEnum("access_level").notNull().default("viewer"),

		/** @auditTrail Source of this access grant */
		accessSource: textCols.tagline("access_source"), // "member_activity", "employee_role", "admin_grant"
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: accountTransactionUserContextTableName,
			cols,
		}),
		...userIdExtraConfig({
			tName: accountTransactionUserContextTableName,
			cols,
		}),
		multiForeignKeys({
			tName: accountTransactionUserContextTableName,
			fkGroups: [
				{
					cols: [cols.contextId],
					foreignColumns: [accountTransactionContext.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// ...multiIndexes({
		// 	tName: accountTransactionUserContextTableName,
		// 	colsGrps: [
		// 		// { cols: [t.accessLevel] },
		// 		// { cols: [t.accessSource] },
		// 	],
		// }),
	],
);

const accountTransactionEmployeeContextTableName = `${accountTransactionTableName}_employee_context`;
export const accountTransactionEmployeeRoleEnum = pgEnum(
	`${accountTransactionEmployeeContextTableName}_role`,
	["creator", "beneficiary", "processor", "approver"],
);
/**
 * Employee Context (professional transaction access)
 */
export const accountTransactionEmployeeContext = table(
	accountTransactionEmployeeContextTableName,
	{
		id: textCols.idPk().notNull(),

		contextId: textCols.idFk("context_id").notNull(),

		/** @professionalContext Direct employee foreign key for professional transaction access */
		employeeId: orgEmployeeIdFkCol().notNull(),

		/** @businessRule Employee's role in this transaction */
		employeeRole: accountTransactionEmployeeRoleEnum("employee_role").notNull(),

		/** @revenueContext Attribution percentage for revenue transactions */
		attributionPercentage: numericCols.percentage._("attribution_percentage"),
	},
	(cols) => [
		...orgEmployeeIdExtraConfig({
			tName: accountTransactionEmployeeContextTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: accountTransactionEmployeeContextTableName,
			fkGroups: [
				{
					cols: [cols.contextId],
					foreignColumns: [accountTransactionContext.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		...multiIndexes({
			tName: accountTransactionEmployeeContextTableName,
			colsGrps: [
				// { cols: [t.employeeRole] },
				{ cols: [cols.attributionPercentage] },
			],
		}),
	],
);

const accountTransactionMemberContextTableName = `${accountTransactionTableName}_member_context`;
export const accountTransactionMemberRoleEnum = pgEnum(
	`${accountTransactionMemberContextTableName}_role`,
	["purchaser", "refund_recipient", "participant"],
);
/**
 * Member Context (customer transaction access)
 */
export const accountTransactionMemberContext = table(
	accountTransactionMemberContextTableName,
	{
		id: textCols.idPk().notNull(),

		contextId: textCols.idFk("context_id").notNull(),

		/** @ecommerceContext Direct member foreign key for customer transaction access */
		memberId: orgMemberIdFkCol().notNull(),

		/** @businessRule Member's relationship to transaction */
		memberRole: accountTransactionMemberRoleEnum("member_role").notNull(),
	},
	(cols) => [
		...orgMemberIdExtraConfig({
			tName: accountTransactionMemberContextTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: accountTransactionMemberContextTableName,
			fkGroups: [
				{
					cols: [cols.contextId],
					foreignColumns: [accountTransactionContext.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// ...multiIndexes({
		// 	tName: accountTransactionMemberContextTableName,
		// 	colsGrps: [
		// 		// { cols: [t.memberRole] },
		// 	],
		// }),
	],
);

const accountTransactionOrgContextTableName = `${accountTransactionTableName}_org_context`;
export const accountTransactionOrgRoleEnum = pgEnum(
	`${accountTransactionOrgContextTableName}_role`,
	["revenue", "expense", "administrative"],
);
/**
 * Organization Context (admin transaction access)
 */
export const accountTransactionOrgContext = table(
	accountTransactionOrgContextTableName,
	{
		id: textCols.idPk().notNull(),

		contextId: textCols.idFk("context_id").notNull(),

		/** @organizationScope Direct org foreign key for organizational transaction access */
		orgId: orgIdFkCol().notNull(),

		/** @businessRule Organization's relationship to transaction */
		orgRole: accountTransactionOrgRoleEnum("org_role").notNull(),
	},
	(cols) => [
		...orgIdExtraConfig({
			tName: accountTransactionOrgContextTableName,
			cols,
		}),
		multiForeignKeys({
			tName: accountTransactionOrgContextTableName,
			fkGroups: [
				{
					cols: [cols.contextId],
					foreignColumns: [accountTransactionContext.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		// ...multiIndexes({
		// 	tName: accountTransactionOrgContextTableName,
		// 	colsGrps: [
		// 		// { cols: [t.orgRole] }
		// 	],
		// }),
	],
);
