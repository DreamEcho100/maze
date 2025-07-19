import { relations } from "drizzle-orm";
import { currency, locale } from "../general/locale-currency-market/schema.js";
import { seoMetadata } from "../general/seo/schema.js";
import { skill } from "../general/skill/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";
import { orgFunnel } from "./funnel/schema.js";
import { orgLesson } from "./lesson/schema.js";
import { orgLocale, orgRegion } from "./locale-region/schema.js";
import { orgDepartment } from "./member/department/schema.js";
import { orgMember, orgMemberInvitation } from "./member/schema.js";
import { orgTeam } from "./member/team/schema.js";
// import { orgLesson, skill } from "./product/by-type/course/schema.js";
import { orgCoupon, orgDiscount, orgGiftCard, orgPromotion } from "./product/offers/schema.js";
import {
	orgMemberProductVariantPaymentPlanSubscription,
	orgProductVariantPaymentPlan,
} from "./product/payment/schema.js";
import { orgProductBrandAttribution, orgProductInstructorAttribution } from "./product/schema.js";
import {
	instructorOrgAffiliation,
	org,
	orgBrand,
	orgBrandTranslation,
	orgCurrencySettings,
	// orgDepartment,
	// orgDepartmentMembership,
	// orgMember,
	// orgMemberInvitation,
	// orgMemberPermissionsGroup,
	// orgPermissionsGroup,
	// orgPermissionsGroupPermission,
	// orgTeam,
	// orgTeamDepartment,
	// orgTeamMemberships,
} from "./schema.js";

/**
 * @fileoverview Multi-Tenant ABAC-Scoped Org Relationship Map
 *
 * @abacScope Centralized Org Context
 * @architecturePattern Hub-and-Spoke with Federated Attributes
 * @integrationContext Role propagation via departments, teams, and permission groups
 * @businessLogic Drives contextual access resolution and orgal scoping
 * @auditTrail Relationships enable fine-grained authorization visibility
 */

/**
 * @abacRoleContext Org
 * @permissionContext Entity Hub — all ABAC-scoped entities originate from here
 */
export const orgRelations = relations(org, ({ many }) => ({
	members: many(orgMember),
	membersInvitations: many(orgMemberInvitation),
	teams: many(orgTeam),
	departments: many(orgDepartment),
	// permissionGroups: many(orgPermissionsGroup),
	currencySettings: many(orgCurrencySettings),
	brands: many(orgBrand),
	instructorAffiliations: many(instructorOrgAffiliation),
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
		fields: [orgMemberInvitation.invitedByUserId],
		references: [user.id],
	}),
	member: one(orgMember, {
		fields: [orgMemberInvitation.memberId],
		references: [orgMember.id],
		relationName: "member_invitation",
	}),
}));

/**
 * @currencyContext Organization–Currency Association
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
	locale: one(locale, {
		fields: [orgBrandTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * @instructorNetwork Instructor Affiliation
 * @revenueAttribution Connects instructor to org-scoped content ownership
 * @abacScope Instructor–Org–Member bridge for scoped authorization
 */
export const instructorOrganizationAffiliationRelations = relations(
	instructorOrgAffiliation,
	({ one, many }) => ({
		instructor: one(userInstructorProfile, {
			fields: [instructorOrgAffiliation.instructorId],
			references: [userInstructorProfile.id],
		}),
		org: one(org, {
			fields: [instructorOrgAffiliation.orgId],
			references: [org.id],
		}),
		member: one(orgMember, {
			fields: [instructorOrgAffiliation.memberId],
			references: [orgMember.id],
		}),
		productAttributions: many(orgProductInstructorAttribution),
	}),
);
