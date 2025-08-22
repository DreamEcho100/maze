// ## org

import { relations } from "drizzle-orm";
import { account, accountTransaction, accountTransactionOrgContext } from "../4-account/schema";
import { orgEmployee, orgEmployeeInvitation } from "../schema";
import { orgLocale } from "./0-locale/00-schema";
import { orgMemberInvitation } from "./1-member-and-employee/1-invitation/schema";
import { orgMember } from "./1-member-and-employee/00-schema";
import { orgDepartment, orgTeam } from "./2-team-and-department/schema";
import { orgBrand } from "./3-brand/schema";
import { orgFunnel } from "./3-funnel/schema";
import { orgLesson } from "./3-lesson/schema";
import { orgRegion } from "./3-region/schema";
import { orgCurrencySettings } from "./3-settings/schema";
import { orgEmployeeProductAttribution } from "./4-product/1-approval-revenue-and-attribution/schema";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
} from "./4-product/payment/schema";
import { orgCoupon, orgDiscount, orgGiftCard, orgPromotion } from "./5-offers/schema";
import { org } from "./00-schema";

/**
 * @abacRoleContext Org
 * @permissionContext Entity Hub — all ABAC-scoped entities originate from here
 */
export const orgRelations = relations(org, ({ many }) => ({
	accounts: many(account),
	accountsTransaction: many(accountTransaction),

	members: many(orgMember),
	membersInvitations: many(orgMemberInvitation),
	employees: many(orgEmployee),
	employeesProductsAttributions: many(orgEmployeeProductAttribution),
	employeesInvitations: many(orgEmployeeInvitation),
	teams: many(orgTeam),
	departments: many(orgDepartment),
	// permissionGroups: many(orgPermissionsGroup),
	currencySettings: many(orgCurrencySettings),
	brands: many(orgBrand),
	lessons: many(orgLesson),

	locales: many(orgLocale),
	regions: many(orgRegion),
	funnels: many(orgFunnel),
	membersSubscriptions: many(orgMemberProductVariantPaymentPlanSubscription),
	productsVariantsPaymentPlans: many(orgProductVariantPaymentPlan),

	discounts: many(orgDiscount),
	coupons: many(orgCoupon),
	giftCards: many(orgGiftCard),
	promotions: many(orgPromotion),

	accountTransactions: many(accountTransactionOrgContext),
}));
// -- org
