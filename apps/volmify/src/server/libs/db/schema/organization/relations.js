import { relations } from "drizzle-orm";

import { user } from "../auth/schema.js";
import {
	country,
	currency,
	marketTemplate,
} from "../currency-and-market/schema.js";
import { productPrice, productZonePrice } from "../product/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { systemPermission } from "../system/schema.js";
import { instructorOrganizationAffiliation, vendor } from "../vendor/schema.js";
import {
	organization,
	organizationCurrencySettings,
	organizationDepartment,
	// organizationLocale,
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
	organizationTeam,
	organizationTeamDepartment,
	pricingZone,
	pricingZoneCountry,
} from "./schema.js";

/**
 * @fileoverview Organization Schema Relations - Multi-Tenant ABAC Context
 *
 * @abacRelationships
 * Defines the relational structure for multi-tenant attribute-based access control
 * within organizational contexts. Relations enable permission inheritance, context
 * boundaries, and cross-organizational resource access patterns.
 *
 * @designPattern Hub-and-Spoke with Many-to-Many Overlays
 * - Hub: Organization as central context boundary
 * - Spokes: All organization-scoped entities
 * - Overlays: Many-to-many relationships for flexible organizational structures
 *
 * @permissionFlow
 * User → Organization Member → Permission Groups → System Permissions
 * User → Organization Member → Teams/Departments → Context-specific Access
 */

/**
 * Organization Relations (ABAC Context Hub)
 *
 * @abacRole Central Context Boundary
 * Organization serves as the primary context for all ABAC decisions,
 * providing tenant isolation and permission scope boundaries.
 *
 * @multiTenantPattern
 * All organization-scoped entities relate back to organization for
 * data isolation and context-aware permission evaluation.
 */
export const organizationRelations = relations(organization, ({ many }) => ({
	/**
	 * @abacSubjects Organization members are subjects in ABAC system
	 * @permissionContext All permission evaluations center on organization members
	 */
	members: many(organizationMember),

	/**
	 * @organizationalStructure Flexible team structures within organization
	 * @permissionContext Teams can have specific permission contexts
	 */
	teams: many(organizationTeam),

	/**
	 * @organizationalStructure Traditional department hierarchies
	 * @permissionInheritance Departments can influence permission inheritance
	 */
	departments: many(organizationDepartment),

	/**
	 * @abacCore Permission attribute containers for organization
	 * @permissionManagement Core ABAC attribute assignment mechanism
	 */
	permissionGroups: many(organizationPermissionsGroup),

	// The following is commented out as it is not needed for now.
	// locales: many(organizationLocale),
	currencySettings: many(organizationCurrencySettings),
	markets: many(organizationMarket),
	pricingZones: many(pricingZone),
	vendors: many(vendor),
	instructorAffiliations: many(instructorOrganizationAffiliation),
}));

/**
 * Organization Member Relations (ABAC Subject)
 *
 * @abacRole Primary Subject in Authorization System
 * Organization members are the central subjects in all ABAC permission
 * evaluations, with relationships defining permission inheritance paths.
 *
 * @permissionInheritancePaths
 * - Direct: Base role + explicit permission group assignments
 * - Team-based: Team membership + team-specific permissions
 * - Department-based: Department membership + department permissions
 * - Invitation-based: Pre-authorization through invitation system
 */
export const organizationMemberRelations = relations(
	organizationMember,
	({ one, many }) => ({
		/**
		 * @abacContext Organization provides permission evaluation boundary
		 */
		organization: one(organization, {
			fields: [organizationMember.organizationId],
			references: [organization.id],
		}),

		/**
		 * @abacSubject Links to platform user identity
		 * @identityResolution Connects organization context to user identity
		 */
		user: one(user, {
			fields: [organizationMember.userId],
			references: [user.id],
		}),

		/**
		 * @abacPermissionPath Team-based permission inheritance
		 * @organizationalFlexibility Many-to-many team membership
		 */
		memberTeams: many(organizationMemberTeam),

		/**
		 * @abacCore Direct permission attribute assignments
		 * @permissionManagement Primary mechanism for permission assignment
		 */
		memberGroups: many(organizationMemberPermissionsGroup),

		/**
		 * @membershipLifecycle Invitation-to-member workflow tracking
		 */
		memberInvitations: many(organizationMemberInvitation),

		/**
		 * @abacPermissionPath Department-based permission inheritance
		 * @organizationalStructure Many-to-many department membership
		 */
		memberDepartments: many(organizationMemberDepartment),
	}),
);

/**
 * Department Relations (Structural Permission Context)
 *
 * @abacRole Structural Permission Inheritance Context
 * Departments provide traditional organizational structure and can serve
 * as permission inheritance contexts within the ABAC system.
 *
 * @organizationalPattern
 * Supports both flat and hierarchical department structures through
 * many-to-many member relationships and team associations.
 */
export const organizationDepartmentRelations = relations(
	organizationDepartment,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationDepartment.organizationId],
			references: [organization.id],
		}),

		/**
		 * @abacSubjects Members can belong to multiple departments
		 * @permissionInheritance Department membership affects permission evaluation
		 */
		memberDepartments: many(organizationMemberDepartment),

		/**
		 * @organizationalFlexibility Teams can span multiple departments
		 * @permissionBridge Links team and department permission contexts
		 */
		teamDepartments: many(organizationTeamDepartment),

		instructorAffiliations: many(instructorOrganizationAffiliation),
	}),
);

/**
 * Team-Department Bridge Relations
 *
 * @abacRole Cross-Context Permission Bridge
 * Enables complex organizational structures where teams span departments
 * and departments support multiple teams, affecting permission inheritance.
 *
 * @permissionImplication
 * Relationship metadata (isPrimary, relationshipType) can influence
 * how permissions are inherited across team-department boundaries.
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
 * Member-Department Assignment Relations
 *
 * @abacRole Permission Context Assignment
 * Many-to-many relationship enabling flexible organizational structures
 * and department-based permission inheritance patterns.
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
 * Team Relations (Dynamic Permission Context)
 *
 * @abacRole Dynamic Permission Context Container
 * Teams provide flexible organizational units that can have specific
 * permission contexts and span traditional departmental boundaries.
 *
 * @permissionFlexibility
 * Teams enable project-based, cross-functional, and temporary permission
 * assignments within the organizational ABAC context.
 */
export const organizationTeamRelations = relations(
	organizationTeam,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationTeam.organizationId],
			references: [organization.id],
		}),

		/**
		 * @organizationalFlexibility Teams can span multiple departments
		 * @permissionBridge Enables complex team-department permission relationships
		 */
		teamDepartments: many(organizationTeamDepartment),

		/**
		 * @abacSubjects Team members with role-based team permissions
		 * @permissionContext Team membership can provide additional permission layers
		 */
		memberTeams: many(organizationMemberTeam),
	}),
);

/**
 * Member-Team Assignment Relations
 *
 * @abacRole Dynamic Permission Assignment
 * Enables team-based permission inheritance with role-specific
 * permissions within team contexts.
 */
export const organizationMemberTeamRelations = relations(
	organizationMemberTeam,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberTeam.memberId],
			references: [organizationMember.id],
		}),
		team: one(organizationTeam, {
			fields: [organizationMemberTeam.teamId],
			references: [organizationTeam.id],
		}),
	}),
);

/**
 * Member-Permission Group Relations (ABAC Attribute Assignment)
 *
 * @abacRole Core Attribute Assignment Mechanism
 * Implements the primary ABAC attribute assignment pattern where
 * subjects (members) are assigned permission attributes through groups.
 *
 * @permissionResolution
 * Member's effective permissions = Union of all assigned permission groups
 * within the organizational context.
 */
export const organizationMemberPermissionsGroupRelations = relations(
	organizationMemberPermissionsGroup,
	({ one }) => ({
		/**
		 * @abacSubject Target of permission assignment
		 */
		member: one(organizationMember, {
			fields: [organizationMemberPermissionsGroup.memberId],
			references: [organizationMember.id],
		}),

		/**
		 * @abacAttributes Permission attribute collection being assigned
		 */
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationMemberPermissionsGroup.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
	}),
);

/**
 * Permission Group Relations (ABAC Attribute Container)
 *
 * @abacRole Permission Attribute Container
 * Permission groups serve as collections of system permissions that
 * can be assigned to organization members as ABAC attributes.
 *
 * @roleBasedPattern
 * Groups enable role-based permission management within the ABAC
 * framework while maintaining attribute-based flexibility.
 */
export const organizationPermissionsGroupRelations = relations(
	organizationPermissionsGroup,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationPermissionsGroup.organizationId],
			references: [organization.id],
		}),

		/**
		 * @abacAttributes System permissions contained in this group
		 * @systemIntegration Links to centrally-defined permission attributes
		 */
		groupPermissions: many(organizationPermissionsGroupPermission),

		/**
		 * @abacAssignments Members who have been assigned this permission group
		 * @permissionResolution Used in permission evaluation queries
		 */
		memberGroups: many(organizationMemberPermissionsGroup),
	}),
);

/**
 * Permission Group-System Permission Relations (ABAC Attribute Bridge)
 *
 * @abacRole System-Organization Permission Bridge
 * Links organization-specific permission groups to system-defined
 * permission attributes, implementing the ABAC attribute reference pattern.
 *
 * @systemIntegration
 * Bridges system permission registry with organization-specific
 * permission management, maintaining centralized permission definitions
 * while enabling organization-specific permission combinations.
 */
export const organizationPermissionsGroupPermissionRelations = relations(
	organizationPermissionsGroupPermission,
	({ one }) => ({
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationPermissionsGroupPermission.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),

		/**
		 * @abacCore References centrally-defined permission attributes
		 * @systemIntegration Links to system permission registry
		 */
		systemPermission: one(systemPermission, {
			fields: [organizationPermissionsGroupPermission.systemPermissionId],
			references: [systemPermission.id],
		}),
	}),
);

/**
 * Member Invitation Relations
 *
 * @abacRole Pre-Authorization Subject Registration
 * Manages invitation workflow for bringing new subjects into the
 * organizational ABAC context with pre-defined permission assignments.
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
		/**
		 * @lifecycleLink Links invitation to created member upon acceptance
		 * @abacTransition Invitation acceptance triggers ABAC subject creation
		 */
		member: one(organizationMember, {
			fields: [organizationMemberInvitation.memberId],
			references: [organizationMember.id],
			relationName: "member_invitation",
		}),
	}),
);

// Currency, Market, and Pricing Relations (supporting organization context)
// [Rest of the existing relations with minimal JSDoc additions for business context]

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

export const organizationMarketRelations = relations(
	organizationMarket,
	({ one, many }) => ({
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
		productPrices: many(productPrice),
	}),
);

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

export const pricingZoneRelations = relations(pricingZone, ({ one, many }) => ({
	organization: one(organization, {
		fields: [pricingZone.organizationId],
		references: [organization.id],
	}),
	currency: one(currency, {
		fields: [pricingZone.currencyCode],
		references: [currency.code],
	}),
	countries: many(pricingZoneCountry),
	productZonePrices: many(productZonePrice),
}));

export const pricingZoneCountryRelations = relations(
	pricingZoneCountry,
	({ one }) => ({
		zone: one(pricingZone, {
			fields: [pricingZoneCountry.zoneId],
			references: [pricingZone.id],
		}),
		country: one(country, {
			fields: [pricingZoneCountry.countryId],
			references: [country.id],
		}),
	}),
);
