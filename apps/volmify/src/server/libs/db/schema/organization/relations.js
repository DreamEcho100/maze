import { relations } from "drizzle-orm";
import { country, currency, marketTemplate } from "../currency-and-market/schema.js";
import { lesson, productCourseEnrollment, skill } from "../product/by-type/course/schema.js";
import { productVariantPaymentPlan } from "../product/payment/schema.js";
import { productBrandAttribution, productInstructorAttribution } from "../product/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { systemPermission } from "../system/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";
import {
	instructorOrganizationAffiliation,
	organization,
	organizationBrand,
	organizationBrandTranslation,
	organizationCurrencySettings,
	organizationDepartment,
	organizationMarket,
	organizationMarketCountry,
	organizationMarketTranslation,
	organizationMember,
	organizationMemberDepartment,
	organizationMemberInvitation,
	organizationMemberPermissionsGroup,
	organizationMemberTeam,
	organizationPermissionsGroup,
	organizationPermissionsGroupPermission,
	organizationPricingZone,
	organizationPricingZoneCountry,
	organizationTeam,
	organizationTeamDepartment,
} from "./schema.js";

/**
 * @fileoverview Multi-Tenant ABAC-Scoped Organization Relationship Map
 *
 * @abacScope Centralized Organization Context
 * @architecturePattern Hub-and-Spoke with Federated Attributes
 * @integrationContext Role propagation via departments, teams, and permission groups
 * @businessLogic Drives contextual access resolution and organizational scoping
 * @auditTrail Relationships enable fine-grained authorization visibility
 */

/**
 * @abacRoleContext Organization
 * @permissionContext Entity Hub — all ABAC-scoped entities originate from here
 */
export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(organizationMember),
	teams: many(organizationTeam),
	departments: many(organizationDepartment),
	permissionGroups: many(organizationPermissionsGroup),
	currencySettings: many(organizationCurrencySettings),
	markets: many(organizationMarket),
	pricingZones: many(organizationPricingZone),
	brands: many(organizationBrand),
	instructorAffiliations: many(instructorOrganizationAffiliation),
	skillsCreated: many(skill),
	lessons: many(lesson),
}));

/**
 * @abacSubjectContext Organization Member
 * @permissionResolution Anchor subject for organizational ABAC resolution
 * @identityLink Bridges platform identity to organizational context
 * @onboardingPattern Supports team/departmental affiliation, invites, and groups
 */
export const organizationMemberRelations = relations(organizationMember, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationMember.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [organizationMember.userId],
		references: [user.id],
	}),
	memberTeams: many(organizationMemberTeam),
	memberGroups: many(organizationMemberPermissionsGroup),
	memberInvitations: many(organizationMemberInvitation),
	memberDepartments: many(organizationMemberDepartment),
	productsCoursesEnrollments: many(productCourseEnrollment),
	lessons: many(lesson),
}));

/**
 * @abacInheritance Department Context
 * @permissionBridge Enables department-based inheritance for members and teams
 * @businessLogic Models traditional hierarchy within ABAC modeling
 */
export const organizationDepartmentRelations = relations(
	organizationDepartment,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationDepartment.organizationId],
			references: [organization.id],
		}),
		memberDepartments: many(organizationMemberDepartment),
		teamDepartments: many(organizationTeamDepartment),
		instructorAffiliations: many(instructorOrganizationAffiliation),
	}),
);

/**
 * @permissionBridgeContext Team-Department Bridge
 * @abacImplication Enables contextual inheritance from structural mapping
 */
export const organizationTeamDepartmentRelations = relations(
	organizationTeamDepartment,
	({ one }) => ({
		team: one(organizationTeam, {
			fields: [organizationTeamDepartment.teamId],
			references: [organizationTeam.id],
		}),
		department: one(organizationDepartment, {
			fields: [organizationTeamDepartment.departmentId],
			references: [organizationDepartment.id],
		}),
	}),
);

/**
 * @abacAssignment Member–Department Contextual Assignment
 * @permissionScope Enables scoped permissions based on departmental affiliation
 */
export const organizationMemberDepartmentRelations = relations(
	organizationMemberDepartment,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberDepartment.memberId],
			references: [organizationMember.id],
		}),
		department: one(organizationDepartment, {
			fields: [organizationMemberDepartment.departmentId],
			references: [organizationDepartment.id],
		}),
	}),
);

/**
 * @abacRoleScope Team
 * @permissionContext Enables cross-functional and project-based roles
 * @businessLogic Team-level access scoping for dynamic role assignment
 */
export const organizationTeamRelations = relations(organizationTeam, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationTeam.organizationId],
		references: [organization.id],
	}),
	teamDepartments: many(organizationTeamDepartment),
	memberTeams: many(organizationMemberTeam),
}));

/**
 * @abacAssignment Member–Team Relationship
 * @permissionPath Enables team-scoped permission propagation
 */
export const organizationMemberTeamRelations = relations(organizationMemberTeam, ({ one }) => ({
	member: one(organizationMember, {
		fields: [organizationMemberTeam.memberId],
		references: [organizationMember.id],
	}),
	team: one(organizationTeam, {
		fields: [organizationMemberTeam.teamId],
		references: [organizationTeam.id],
	}),
}));

/**
 * @abacAssignment Permission Group Assignment
 * @permissionAttributes Maps members to permission attribute containers
 * @abacPreset Enables group-based attribute presets
 */
export const organizationMemberPermissionsGroupRelations = relations(
	organizationMemberPermissionsGroup,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberPermissionsGroup.memberId],
			references: [organizationMember.id],
		}),
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationMemberPermissionsGroup.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
	}),
);

/**
 * @abacContainer Permission Group
 * @permissionContext Groups as reusable permission attribute containers
 * @systemBridge Links org-specific grouping to central system permissions
 */
export const organizationPermissionsGroupRelations = relations(
	organizationPermissionsGroup,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationPermissionsGroup.organizationId],
			references: [organization.id],
		}),
		groupPermissions: many(organizationPermissionsGroupPermission),
		memberGroups: many(organizationMemberPermissionsGroup),
	}),
);

/**
 * @abacAttributeBridge Permission Group → System Permission
 * @systemIntegration Maps org-defined groups to core permission registry
 */
export const organizationPermissionsGroupPermissionRelations = relations(
	organizationPermissionsGroupPermission,
	({ one }) => ({
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationPermissionsGroupPermission.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
		systemPermission: one(systemPermission, {
			fields: [organizationPermissionsGroupPermission.systemPermissionId],
			references: [systemPermission.id],
		}),
	}),
);

/**
 * @invitationFlow Member Invitation
 * @abacOnboarding Pre-authorization mechanism prior to subject activation
 * @lifecycleBridge Connects invite to eventual member record
 */
export const organizationMemberInvitationRelations = relations(
	organizationMemberInvitation,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationMemberInvitation.organizationId],
			references: [organization.id],
		}),
		invitedByUser: one(user, {
			fields: [organizationMemberInvitation.invitedByUserId],
			references: [user.id],
		}),
		member: one(organizationMember, {
			fields: [organizationMemberInvitation.memberId],
			references: [organizationMember.id],
			relationName: "member_invitation",
		}),
	}),
);

/**
 * @currencyContext Organization–Currency Association
 * @financialGovernance Tracks preferred billing and payout currencies
 */
export const organizationCurrencySettingsRelations = relations(
	organizationCurrencySettings,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationCurrencySettings.organizationId],
			references: [organization.id],
		}),
		currency: one(currency, {
			fields: [organizationCurrencySettings.currencyCode],
			references: [currency.code],
		}),
	}),
);

/**
 * @marketContext Organization Market Structure
 * @i18nPattern Supports localized market experience with pricing templates
 * @complianceScope Currency-specific regional configurations
 */
export const organizationMarketRelations = relations(organizationMarket, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationMarket.organizationId],
		references: [organization.id],
	}),
	template: one(marketTemplate, {
		fields: [organizationMarket.templateId],
		references: [marketTemplate.id],
	}),
	currency: one(currency, {
		fields: [organizationMarket.currencyCode],
		references: [currency.code],
	}),
	countries: many(organizationMarketCountry),
	translations: many(organizationMarketTranslation),
	productVariantsPaymentPlans: many(productVariantPaymentPlan),
}));

/**
 * @regionalMapping Market–Country Bridge
 * @i18nScope Enables country-scoped market operations
 */
export const organizationMarketCountryRelations = relations(
	organizationMarketCountry,
	({ one }) => ({
		organizationMarket: one(organizationMarket, {
			fields: [organizationMarketCountry.organizationMarketId],
			references: [organizationMarket.id],
		}),
		country: one(country, {
			fields: [organizationMarketCountry.countryId],
			references: [country.id],
		}),
	}),
);

/**
 * @localizationBridge Market Translation
 * @seoIntegration Includes SEO metadata per locale
 */
export const organizationMarketTranslationRelations = relations(
	organizationMarketTranslation,
	({ one }) => ({
		organizationMarket: one(organizationMarket, {
			fields: [organizationMarketTranslation.organizationMarketId],
			references: [organizationMarket.id],
		}),
		organization: one(organization, {
			fields: [organizationMarketTranslation.organizationId],
			references: [organization.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [organizationMarketTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);

/**
 * @pricingZone Pricing Zone Configuration
 * @multiRegionSupport Enables regionally-scoped pricing per currency
 */
export const organizationPricingZoneRelations = relations(
	organizationPricingZone,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationPricingZone.organizationId],
			references: [organization.id],
		}),
		currency: one(currency, {
			fields: [organizationPricingZone.currencyCode],
			references: [currency.code],
		}),
		countries: many(organizationPricingZoneCountry),
	}),
);

export const organizationPricingZoneCountryRelations = relations(
	organizationPricingZoneCountry,
	({ one }) => ({
		zone: one(organizationPricingZone, {
			fields: [organizationPricingZoneCountry.zoneId],
			references: [organizationPricingZone.id],
		}),
		country: one(country, {
			fields: [organizationPricingZoneCountry.countryId],
			references: [country.id],
		}),
	}),
);

/**
 * @brandContext Organization Brand
 * @contentAttribution Enables multiple brands per org for product identity
 */
export const organizationBrandRelations = relations(organizationBrand, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationBrand.organizationId],
		references: [organization.id],
	}),
	productAttributions: many(productBrandAttribution),
	translations: many(organizationBrandTranslation),
}));

/**
 * @localizationBridge Brand Translation
 * @seoIntegration SEO metadata per brand locale
 */
export const organizationBrandTranslationRelations = relations(
	organizationBrandTranslation,
	({ one }) => ({
		brand: one(organizationBrand, {
			fields: [organizationBrandTranslation.organizationBrandId],
			references: [organizationBrand.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [organizationBrandTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);

/**
 * @instructorNetwork Instructor Affiliation
 * @revenueAttribution Connects instructor to org-scoped content ownership
 * @abacScope Instructor–Org–Member bridge for scoped authorization
 */
export const instructorOrganizationAffiliationRelations = relations(
	instructorOrganizationAffiliation,
	({ one, many }) => ({
		instructor: one(userInstructorProfile, {
			fields: [instructorOrganizationAffiliation.instructorId],
			references: [userInstructorProfile.id],
		}),
		organization: one(organization, {
			fields: [instructorOrganizationAffiliation.organizationId],
			references: [organization.id],
		}),
		member: one(organizationMember, {
			fields: [instructorOrganizationAffiliation.memberId],
			references: [organizationMember.id],
		}),
		productAttributions: many(productInstructorAttribution),
	}),
);
