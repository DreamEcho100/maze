import { relations } from "drizzle-orm";
import { currency, locale } from "../system/locale-currency-market/schema.js";
import { systemPermission } from "../system/schema.js";
import { seoMetadata } from "../system/seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";
import { orgFunnel } from "./funnel/schema.js";
import { orgLocale, orgRegion } from "./locale-region/schema.js";
import { orgDepartment } from "./member/department/schema.js";
import { orgMember, orgMemberInvitation } from "./member/schema.js";
import { orgTeam } from "./member/team/schema.js";
import { lesson, productCourseEnrollment, skill } from "./product/by-type/course/schema.js";
import { productBrandAttribution, productInstructorAttribution } from "./product/schema.js";
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
	permissionGroups: many(orgPermissionsGroup),
	currencySettings: many(orgCurrencySettings),
	brands: many(orgBrand),
	instructorAffiliations: many(instructorOrgAffiliation),
	skillsCreated: many(skill),
	lessons: many(lesson),

	locales: many(orgLocale),
	regions: many(orgRegion),
	funnels: many(orgFunnel),
}));

/**
 * @abacSubjectContext Org Member
 * @permissionResolution Anchor subject for orgal ABAC resolution
 * @identityLink Bridges platform identity to orgal context
 * @onboardingPattern Supports team/departmental affiliation, invites, and groups
 */
export const orgMemberRelations = relations(orgMember, ({ one, many }) => ({
	org: one(org, {
		fields: [orgMember.orgId],
		references: [org.id],
	}),
	user: one(user, {
		fields: [orgMember.userId],
		references: [user.id],
	}),
	memberTeams: many(orgTeamMemberships),
	memberGroups: many(orgMemberPermissionsGroup),
	memberInvitations: many(orgMemberInvitation),
	memberDepartments: many(orgDepartmentMembership),
	productsCoursesEnrollments: many(productCourseEnrollment),
	lessons: many(lesson),
}));

/**
 * @abacInheritance Department Context
 * @permissionBridge Enables department-based inheritance for members and teams
 * @businessLogic Models traditional hierarchy within ABAC modeling
 */
export const orgDepartmentRelations = relations(orgDepartment, ({ one, many }) => ({
	org: one(org, {
		fields: [orgDepartment.orgId],
		references: [org.id],
	}),
	memberDepartments: many(orgDepartmentMembership),
	teamDepartments: many(orgTeamDepartment),
	instructorAffiliations: many(instructorOrgAffiliation),
}));

/**
 * @permissionBridgeContext Team-Department Bridge
 * @abacImplication Enables contextual inheritance from structural mapping
 */
export const orgTeamDepartmentRelations = relations(orgTeamDepartment, ({ one }) => ({
	team: one(orgTeam, {
		fields: [orgTeamDepartment.teamId],
		references: [orgTeam.id],
	}),
	department: one(orgDepartment, {
		fields: [orgTeamDepartment.departmentId],
		references: [orgDepartment.id],
	}),
}));

/**
 * @abacAssignment Member–Department Contextual Assignment
 * @permissionScope Enables scoped permissions based on departmental affiliation
 */
export const orgDepartmentMembershipRelations = relations(orgDepartmentMembership, ({ one }) => ({
	member: one(orgMember, {
		fields: [orgDepartmentMembership.memberId],
		references: [orgMember.id],
	}),
	department: one(orgDepartment, {
		fields: [orgDepartmentMembership.departmentId],
		references: [orgDepartment.id],
	}),
}));

/**
 * @abacRoleScope Team
 * @permissionContext Enables cross-functional and project-based roles
 * @businessLogic Team-level access scoping for dynamic role assignment
 */
export const orgTeamRelations = relations(orgTeam, ({ one, many }) => ({
	org: one(org, {
		fields: [orgTeam.orgId],
		references: [org.id],
	}),
	teamDepartments: many(orgTeamDepartment),
	memberTeams: many(orgTeamMemberships),
}));

/**
 * @abacAssignment Member–Team Relationship
 * @permissionPath Enables team-scoped permission propagation
 */
export const orgTeamMembershipsRelations = relations(orgTeamMemberships, ({ one }) => ({
	member: one(orgMember, {
		fields: [orgTeamMemberships.memberId],
		references: [orgMember.id],
	}),
	team: one(orgTeam, {
		fields: [orgTeamMemberships.teamId],
		references: [orgTeam.id],
	}),
}));

/**
 * @abacAssignment Permission Group Assignment
 * @permissionAttributes Maps members to permission attribute containers
 * @abacPreset Enables group-based attribute presets
 */
export const orgMemberPermissionsGroupRelations = relations(
	orgMemberPermissionsGroup,
	({ one }) => ({
		member: one(orgMember, {
			fields: [orgMemberPermissionsGroup.memberId],
			references: [orgMember.id],
		}),
		permissionGroup: one(orgPermissionsGroup, {
			fields: [orgMemberPermissionsGroup.permissionsGroupId],
			references: [orgPermissionsGroup.id],
		}),
	}),
);

/**
 * @abacContainer Permission Group
 * @permissionContext Groups as reusable permission attribute containers
 * @systemBridge Links org-specific grouping to central system permissions
 */
export const orgPermissionsGroupRelations = relations(orgPermissionsGroup, ({ one, many }) => ({
	org: one(org, {
		fields: [orgPermissionsGroup.orgId],
		references: [org.id],
	}),
	groupPermissions: many(orgPermissionsGroupPermission),
	memberGroups: many(orgMemberPermissionsGroup),
}));

/**
 * @abacAttributeBridge Permission Group → System Permission
 * @systemIntegration Maps org-defined groups to core permission registry
 */
export const orgPermissionsGroupPermissionRelations = relations(
	orgPermissionsGroupPermission,
	({ one }) => ({
		permissionGroup: one(orgPermissionsGroup, {
			fields: [orgPermissionsGroupPermission.permissionsGroupId],
			references: [orgPermissionsGroup.id],
		}),
		systemPermission: one(systemPermission, {
			fields: [orgPermissionsGroupPermission.systemPermissionId],
			references: [systemPermission.id],
		}),
	}),
);

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
	productAttributions: many(productBrandAttribution),
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
		productAttributions: many(productInstructorAttribution),
	}),
);
