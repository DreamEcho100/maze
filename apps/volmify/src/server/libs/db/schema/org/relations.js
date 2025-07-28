import { relations } from "drizzle-orm";
import { account, accountTransaction } from "../account/schema.js";
import { currency } from "../general/locale-and-currency/schema.js";
import { seoMetadata } from "../general/seo/schema.js";
import { skill } from "../general/skill/schema.js";
import { user } from "../user/schema.js";
import { orgFunnel } from "./funnel/schema.js";
import { orgLesson } from "./lesson/schema.js";
import { orgLocale, orgRegion } from "./locale-region/schema.js";
import { orgDepartment } from "./member/department/schema.js";
import {
	orgEmployee,
	orgEmployeeInvitation,
	orgEmployeeProductAttribution,
} from "./member/employee/schema.js";
import { orgMember, orgMemberInvitation } from "./member/schema.js";
import { orgTeam } from "./member/team/schema.js";
// import { orgLesson, skill } from "./product/by-type/course/schema.js";
import { orgCoupon, orgDiscount, orgGiftCard, orgPromotion } from "./product/offers/schema.js";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
} from "./product/payment/schema.js";
import { orgProductBrandAttribution } from "./product/schema.js";
import { org, orgBrand, orgBrandTranslation, orgCurrencySettings } from "./schema.js";

/**
 * @fileoverview Multi-Tenant ABAC-Scoped Org Relationship Map
 *
 * @abacScope Centralized Org Context
 * @architecturePattern Hub-and-Spoke with Federated Attributes
 * @integrationContext Role propagation via departments, teams, and permission groups
 * @businessLogic Drives contextual access resolution and org scoping
 * @auditTrail Relationships enable fine-grained authorization visibility
 */

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
	skillsCreated: many(skill),
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
}));

/**
 * @invitationFlow Member Invitation
 * @abacOnboarding Pre-authorization mechanism prior to subject activation
 * @lifecycleBridge Connects invite to eventual member record
 */
export const orgMemberInvitationRelations = relations(orgMemberInvitation, ({ one }) => ({
	org: one(org, {
		fields: [orgMemberInvitation.orgId],
		references: [org.id],
	}),
	invitedByUser: one(user, {
		fields: [orgMemberInvitation.invitedByMemberId],
		references: [user.id],
	}),
	member: one(orgMember, {
		fields: [orgMemberInvitation.memberId],
		references: [orgMember.id],
	}),
}));

/**
 * @currencyContext Org–Currency Association
 * @financialGovernance Tracks preferred billing and payout currencies
 */
export const orgCurrencySettingsRelations = relations(orgCurrencySettings, ({ one }) => ({
	org: one(org, {
		fields: [orgCurrencySettings.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgCurrencySettings.currencyCode],
		references: [currency.code],
	}),
}));

/**
 * @brandContext Org Brand
 * @contentAttribution Enables multiple brands per org for product identity
 */
export const orgBrandRelations = relations(orgBrand, ({ one, many }) => ({
	org: one(org, {
		fields: [orgBrand.orgId],
		references: [org.id],
	}),
	productAttributions: many(orgProductBrandAttribution),
	translations: many(orgBrandTranslation),
}));

/**
 * @localizationBridge Brand Translation
 * @seoIntegration SEO metadata per brand locale
 */
export const orgBrandTranslationRelations = relations(orgBrandTranslation, ({ one }) => ({
	brand: one(orgBrand, {
		fields: [orgBrandTranslation.brandId],
		references: [orgBrand.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgBrandTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(orgLocale, {
		fields: [orgBrandTranslation.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
