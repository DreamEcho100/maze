import { eq, isNotNull } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

import { createdAt, deletedAt, fk, id, name, slug, table, updatedAt } from "../_utils/helpers.js";
import { country, currency, marketTemplate } from "../currency-and-market/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { systemPermission } from "../system/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";

/**
 * @fileoverview Organization Schema - Multi-Tenant ABAC Context
 *
 * @architecture Multi-Tenant ABAC (Attribute-Based Access Control)
 * Implements organizational boundaries as primary ABAC contexts where subjects (users)
 * are assigned permission attributes within specific organizational scopes. Each organization
 * operates as an isolated tenant with its own permission groups, teams, departments, and
 * market configurations.
 *
 * @designPattern Context Boundary + Hierarchical Authorization
 * - Context Boundary: Organizations provide isolation and permission scope
 * - Hierarchical Structure: Departments → Teams → Members with flexible many-to-many relationships
 * - Permission Delegation: System permissions assigned through organization-specific groups
 *
 * @abacFlow
 * ```
 * Subject (User) + Context (Organization) + Attributes (Permissions via Groups) + Resource → Decision
 * User → Organization Member → Permission Groups → System Permissions → Access Decision
 * ```
 *
 * @integrationPoints
 * - Authentication: User identity resolution within organizational context
 * - Authorization: Permission evaluation for organization-scoped resources
 * - Content Management: Organization-specific content and configurations
 * - Billing/Commerce: Market-based pricing and currency management
 * - Internationalization: Organization-specific locales and translations
 *
 * @businessValue
 * Enables SaaS multi-tenancy with fine-grained access control, supporting organizations
 * of varying sizes and structures while maintaining data isolation and security boundaries.
 * Provides foundation for B2B features like team collaboration, department management,
 * and role-based access control.
 *
 * @scalingDesign
 * - Horizontal: Organizations scale independently
 * - Permission Groups: Template-based for rapid organization onboarding
 * - Market Configuration: Supports global organizations with regional variations
 */

export const memberBaseRoleEnum = pgEnum("member_base_role", [
	"admin", // Admins have full access to the organization, can manage members, teams, and settings
	"member", // Organization members have access to the organization's resources, and it will be based on the permissions group they belong to
]);

const organizationMetadataJsonb = jsonb("metadata");

/**
 * Organization Context Boundary
 *
 * @abacRole Primary Context for Multi-Tenant Authorization
 * Serves as the fundamental isolation boundary in the ABAC system. All permission
 * evaluations occur within the context of a specific organization, ensuring complete
 * tenant data isolation and security.
 *
 * @businessLogic
 * Organizations represent customer entities (companies, agencies, institutions) that
 * subscribe to the platform. Each organization operates independently with its own
 * users, content, permissions, and configurations.
 *
 * @tenantIsolation
 * - Data: All organization-scoped tables reference this for isolation
 * - Permissions: All access control decisions include organization context
 * - Configuration: Markets, currencies, and locales are organization-specific
 *
 * @scalingStrategy
 * Designed for horizontal scaling where organizations can grow independently
 * without affecting other tenants' performance or data access patterns.
 */
export const organization = table(
	"organization",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		/**
		 * @abacContext Creator becomes first admin with full organizational permissions
		 * @businessRule Organization creator automatically gets admin role and all permissions
		 */
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		/**
		 * @businessRule Unique across platform for branding and identification
		 * @uiContext Used in organization selection and branding displays
		 */
		name: name.notNull().unique("uq_organization_name"),
		/**
		 * @businessRule URL-safe identifier for routing and API endpoints
		 * @integrationContext Used in subdomain routing and API path parameters
		 */
		slug: slug.notNull().unique("uq_organization_slug"),
		logo: varchar("logo", { length: 2096 }),
		metadata:
			/** @type {ReturnType<typeof organizationMetadataJsonb.$type<Record<string, any>>>} */ (
				organizationMetadataJsonb
			),
		// The following fields are commented because they are not used right now, but can be added later if needed
		// status: varchar("status", { length: 20 }).default("active"), // 'active', 'suspended', 'closed'
		// organizationType: varchar("type", { length: 50 }).default("company"), // 'company', 'agency', 'freelancer'
		// billingEmail: varchar("billing_email", { length: 256 }),
		// website: varchar("website", { length: 512 }),
		// industry: varchar("industry", { length: 100 })
	},
	(table) => [
		index("idx_organization_created_at").on(table.createdAt),
		index("idx_organization_updated_at").on(table.updatedAt),
		index("idx_organization_name").on(table.name),
		index("idx_organization_slug").on(table.slug),
	],
);

/**
 * Organizational Team Structure
 *
 * @abacRole Permission Context Grouping
 * Teams provide flexible organizational units that can span departments and
 * serve as permission assignment contexts. Supports various organizational
 * patterns from traditional hierarchies to modern cross-functional structures.
 *
 * @businessLogic
 * Teams represent working groups that collaborate on specific projects, functions,
 * or goals. Unlike departments (which are often structural), teams are dynamic
 * and can be project-based or permanent functional units.
 *
 * @flexibilityDesign
 * - Cross-departmental membership support
 * - Multiple team types (project, functional, permanent)
 * - Department relationships through junction table
 *
 * @permissionContext
 * Teams can have specific permission groups assigned, enabling team-scoped
 * access control beyond department-level permissions.
 */
export const organizationTeam = table(
	"organization_team",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		/**
		 * @abacContext Team creator gets admin role within team context
		 * @auditTrail Tracks team creation for organizational governance
		 */
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: name.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		/**
		 * @businessLogic Supports diverse organizational structures
		 * @organizationalFlexibility Enables both traditional and modern team patterns
		 */
		teamType: text("team_type").default("cross_functional"), // "departmental", "cross_functional", "project", "permanent"

		/**
		 * @abacPolicy Controls whether team can have members from multiple departments
		 * @permissionBoundary Affects how permissions are inherited and evaluated
		 */
		allowsCrossDepartmentMembers: boolean("allows_cross_department_members").default(true),

		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_team_created_at").on(table.createdAt),
		index("idx_organization_team_updated_at").on(table.updatedAt),
		index("idx_organization_team_name").on(table.name),
		uniqueIndex("uq_organization_team_name_org").on(table.name, table.organizationId),
	],
);

/**
 * Organization Member (ABAC Subject)
 *
 * @abacRole Primary Subject in Authorization Decisions
 * Represents users within organizational context. All permission evaluations
 * center around organization members as the subject in ABAC decisions.
 *
 * @businessLogic
 * Members are users who have been invited to and accepted membership in an
 * organization. They serve as the bridge between platform users and
 * organization-specific roles, permissions, and access patterns.
 *
 * @membershipLifecycle
 * Invitation → Acceptance → Active Membership → Potential Deactivation
 * Tracks complete member lifecycle with timestamps and status management.
 *
 * @permissionInheritance
 * Members inherit permissions through multiple paths:
 * - Base role (admin/member)
 * - Permission group assignments
 * - Team-specific permissions
 * - Department-based permissions
 */
export const organizationMember = table(
	"organization_member",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/**
		 * @abacRole Base organizational permission level
		 * @permissionLayer Foundation layer before granular permission groups
		 */
		role: memberBaseRoleEnum("role").notNull().default("member"),
		status: varchar("status", { length: 20 }).default("active"),
		invitedAt: timestamp("invited_at", { precision: 3 }),
		invitedBy: text("invited_by").references(() => user.id),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(table) => [
		index("idx_organization_member_created_at").on(table.createdAt),
		uniqueIndex("uq_organization_member_user_org").on(table.userId, table.organizationId),
	],
);

/**
 * Organizational Department Structure
 *
 * @abacRole Structural Permission Context
 * Departments provide traditional organizational structure and serve as
 * permission inheritance contexts. Support both hierarchical and flat
 * organizational models.
 *
 * @businessLogic
 * Departments represent functional or structural divisions within organizations
 * (Engineering, Marketing, Sales, etc.). They provide both organizational
 * structure and permission grouping mechanisms.
 *
 * @defaultDepartmentPattern
 * Each organization gets a default "General" department during onboarding,
 * ensuring all members have a department assignment for permission resolution.
 *
 * @permissionInheritance
 * Department membership can influence permission inheritance, especially
 * when combined with department-specific permission groups or team assignments.
 */
export const organizationDepartment = table(
	"organization_department",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: name.notNull(),
		description: text("description"),
		color: text("color"), // For UI categorization (#FF5733)
		/**
		 * @businessRule Exactly one default department per organization
		 * @onboardingPattern Default department created during organization setup
		 */
		isDefault: boolean("is_default").default(false),
		isActive: boolean("is_active").default(true),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		uniqueIndex("uq_organization_department_name").on(t.organizationId, t.name),
		uniqueIndex("uq_organization_department_default")
			.on(t.organizationId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_organization_department_organization").on(t.organizationId),
		index("idx_organization_department_active").on(t.isActive),
	],
);

/**
 * Member-Department Many-to-Many Assignment
 *
 * @abacRole Permission Context Assignment
 * Enables flexible organizational structures where members can belong to
 * multiple departments, supporting modern organizational patterns.
 *
 * @businessLogic
 * Many-to-many relationship supports:
 * - Cross-functional roles
 * - Matrix organizational structures
 * - Temporary department assignments
 * - Primary department designation
 *
 * @permissionImplication
 * Member's effective permissions are combination of all department-based
 * permissions plus explicit permission group assignments.
 */
export const organizationMemberDepartment = table(
	"organization_member_department",
	{
		id: id.notNull(),
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		departmentId: text("department_id")
			.notNull()
			.references(() => organizationDepartment.id, { onDelete: "cascade" }),
		/**
		 * @businessRule One primary department per member for UI/reporting
		 * @permissionContext Primary department may have special permission inheritance
		 */
		isDefault: boolean("is_default").default(false), // Primary department for the member
		joinedAt: timestamp("joined_at").defaultNow(),
		createdAt,
	},
	(t) => [
		uniqueIndex("uq_member_department").on(t.memberId, t.departmentId),
		uniqueIndex("uq_member_default_department")
			.on(t.memberId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_member_department_member").on(t.memberId),
		index("idx_member_department_department").on(t.departmentId),
	],
);

export const organizationMemberTeamRoleEnum = pgEnum("organization_member_team_role", [
	"admin", // Admins have full access to the team, can manage members and settings
	"member", // Members have access to the team's resources, and it will be based on the permissions group they belong to
]);

/**
 * Member-Team Many-to-Many Assignment
 *
 * @abacRole Dynamic Permission Context
 * Enables flexible team membership with role-based permissions within
 * team contexts. Supports both permanent and temporary team assignments.
 *
 * @businessLogic
 * Team membership represents active collaboration relationships and can
 * influence permission inheritance depending on team-specific permission
 * configurations.
 *
 * @roleBasedAccess
 * Team roles (admin/member) provide additional permission layer specifically
 * within team context, enabling team-scoped administrative capabilities.
 */
export const organizationMemberTeam = table(
	"organization_member_team",
	{
		id: id.notNull(),
		createdAt,
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => organizationTeam.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).default("active"), // 'pending', 'active', 'suspended', 'left'
		/**
		 * @abacRole Team-scoped permission level
		 * @permissionContext Team admin role enables team management permissions
		 */
		role: organizationMemberTeamRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }), // When they accepted invitation
	},
	(table) => [
		index("idx_organization_member_team_created_at").on(table.createdAt),
		index("idx_organization_member_team_status").on(table.status),
		index("idx_organization_member_team_role").on(table.role),
		index("idx_organization_member_team_joined_at").on(table.joinedAt),
		uniqueIndex("uq_member_team").on(table.memberId, table.teamId),
	],
);

/**
 * Team-Department Many-to-Many Relationship
 *
 * @abacRole Cross-Context Permission Bridge
 * Links teams to departments for complex organizational structures where
 * teams span multiple departments or departments sponsor multiple teams.
 *
 * @businessLogic
 * Supports organizational patterns like:
 * - Cross-departmental project teams
 * - Department-sponsored initiatives
 * - Matrix management structures
 * - Shared resource teams
 *
 * @permissionBridge
 * Relationship metadata (isPrimary, relationshipType) can influence
 * permission inheritance and resource access patterns.
 */
export const organizationTeamDepartment = table(
	"organization_team_department",
	{
		id: id.notNull(),
		teamId: fk("team_id")
			.references(() => organizationTeam.id, { onDelete: "cascade" })
			.notNull(),
		departmentId: fk("department_id")
			.references(() => organizationDepartment.id, { onDelete: "cascade" })
			.notNull(),

		/**
		 * @businessRule One primary department per team for reporting/accountability
		 * @permissionContext Primary department may influence team permission inheritance
		 */
		isPrimary: boolean("is_primary").default(false), // Which department leads this team

		/**
		 * @organizationalContext Defines nature of team-department relationship
		 * @businessLogic Influences resource allocation and permission patterns
		 */
		relationshipType: text("relationship_type").default("collaboration"), // "lead", "collaboration", "support"

		createdAt,
	},
	(t) => [
		uniqueIndex("uq_team_department").on(t.teamId, t.departmentId),
		uniqueIndex("uq_team_primary_department")
			.on(t.teamId, t.isPrimary)
			.where(eq(t.isPrimary, true)),
		index("idx_team_department_team").on(t.teamId),
		index("idx_team_department_department").on(t.departmentId),
	],
);

/**
 * Permission Group Assignment (ABAC Attribute Assignment)
 *
 * @abacRole Attribute Assignment Mechanism
 * Core ABAC implementation - assigns system permission attributes to subjects
 * (members) within organizational contexts through permission groups.
 *
 * @businessLogic
 * Junction table that implements the ABAC attribute assignment model:
 * Subject (Member) + Context (Organization) + Attributes (Permissions via Groups)
 *
 * @permissionResolution
 * Member's effective permissions = Union of all assigned permission groups
 * Enables complex permission combinations and role-based access patterns.
 */
export const organizationMemberPermissionsGroup = table(
	"organization_member_permissions_group",
	{
		id: id.notNull(),
		createdAt,
		/**
		 * @auditTrail Tracks who assigned permissions for compliance
		 * @abacGovernance Required for permission assignment accountability
		 */
		createdBy: text("created_by").references(() => user.id),
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, {
				onDelete: "cascade",
			}),
	},
	(table) => [
		uniqueIndex("uq_member_permission_group").on(table.memberId, table.permissionsGroupId),
		index("idx_member_permission_group_member_id").on(table.memberId),
		index("idx_member_permission_group_group_id").on(table.permissionsGroupId),
	],
);

/**
 * Organization Permission Groups (ABAC Attribute Collections)
 *
 * @abacRole Permission Attribute Containers
 * Groups system permissions into logical collections that can be assigned
 * to organization members. Implements role-based permission management
 * within the ABAC framework.
 *
 * @businessLogic
 * Permission groups enable:
 * - Role templates (Editor, Manager, Admin)
 * - Functional permissions (Content Creator, User Manager)
 * - Project-specific permissions
 * - Temporary permission assignments
 *
 * @systemGroups
 * System groups are template groups created during organization onboarding
 * to provide standard role patterns. User-defined groups enable custom roles.
 *
 * @permissionComposition
 * Groups reference system permissions, ensuring all permissions are centrally
 * defined while allowing organization-specific permission combinations.
 */
export const organizationPermissionsGroup = table(
	"organization_permissions_group",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by").references(() => user.id), // It's nullable since it's seeded at first
		name: name.notNull(),
		description: varchar("description", { length: 256 }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		/**
		 * @businessRule System groups are templates, user groups are custom
		 * @onboardingPattern System groups created during organization setup
		 */
		isSystem: boolean("is_system").default(false), // True if this is a system-defined group, false if it's user-defined
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_permissions_group_created_at").on(table.createdAt),
		index("idx_organization_permissions_group_updated_at").on(table.updatedAt),
		index("idx_organization_permissions_group_is_system").on(table.isSystem),
		uniqueIndex("uq_organization_permissions_group_name").on(table.name, table.organizationId),
	],
);

/**
 * Permission Group to System Permission Mapping
 *
 * @abacRole Attribute Definition Bridge
 * Links organization permission groups to system-defined permission attributes.
 * Implements the ABAC model where organization-specific attribute collections
 * reference centrally-defined permission attributes.
 *
 * @businessLogic
 * Junction table enabling:
 * - Multiple permissions per group
 * - Same permission in multiple groups
 * - Audit trail of permission assignments
 * - Granular permission combinations
 *
 * @systemIntegration
 * References system permissions (defined in system schema) within
 * organization contexts, maintaining separation between system permission
 * definitions and organization-specific permission assignments.
 */
export const organizationPermissionsGroupPermission = table(
	"organization_permissions_group_permission",
	{
		id: id.notNull(),
		createdAt,
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, {
				onDelete: "cascade",
			}),
		/**
		 * @abacCore Links to system permission registry
		 * @systemIntegration References centrally-defined permission attributes
		 */
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
		/**
		 * @auditTrail Tracks permission assignment for governance
		 * @complianceRequirement Required for permission audit trails
		 */
		assignedBy: text("assigned_by").references(() => user.id),
	},
	(table) => [
		uniqueIndex("uq_group_permission").on(table.permissionsGroupId, table.systemPermissionId),
		index("idx_group_permission_group_id").on(table.permissionsGroupId),
		index("idx_group_permission_permission_id").on(table.systemPermissionId),
	],
);

export const organizationMemberInvitationStatusEnum = pgEnum(
	"organization_member_invitation_status",
	[
		"pending", // Invitation is pending
		"accepted", // Invitation has been accepted
		"declined", // Invitation has been declined
		// No need as it can be inferred from `expiresAt` field
		// "expired", // Invitation has expired
		"cancelled", // Invitation has been cancelled
		"revoked", // Invitation has been revoked by the inviter
	],
);

/**
 * Organization Member Invitation System
 *
 * @abacRole Pre-Authorization Subject Registration
 * Manages the invitation workflow for bringing new subjects into the
 * organizational ABAC context. Handles the transition from invitation
 * to active organization membership.
 *
 * @businessLogic
 * Invitation workflow:
 * 1. Admin sends invitation with base role
 * 2. Email-based invitation delivery
 * 3. Invitation acceptance creates organization member
 * 4. Permission groups can be assigned post-acceptance
 *
 * @securityPattern
 * Time-limited invitations with status tracking prevent unauthorized
 * access and provide audit trail for membership management.
 */
export const organizationMemberInvitation = table(
	"organization_member_invitation",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		email: varchar("email", { length: 256 }).notNull(),
		/**
		 * @auditTrail Tracks invitation source for accountability
		 * @businessRule Only existing organization members can invite
		 */
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		/**
		 * @securityMeasure Prevents indefinite invitation validity
		 * @businessRule Expired invitations cannot be accepted
		 */
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		status: organizationMemberInvitationStatusEnum("status").notNull().default("pending"),

		/**
		 * @abacPreset Base role assigned upon invitation acceptance
		 * @permissionLayer Foundation permission level before group assignments
		 */
		role: memberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"), // Personal invitation message
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
		/**
		 * @lifecycleLink Links invitation to created member upon acceptance
		 * @businessRule Set when invitation is accepted and member is created
		 */
		memberId: text("member_id").references(() => organizationMember.id),
	},
	(table) => [
		index("idx_organization_member_invitation_created_at").on(table.createdAt),
		index("idx_organization_member_invitation_updated_at").on(table.updatedAt),
		index("idx_organization_member_invitation_status").on(table.status),
		index("idx_organization_member_invitation_expires_at").on(table.expiresAt),
		index("idx_organization_member_invitation_email").on(table.email),
		index("idx_organization_member_invitation_invited_by_user_id").on(table.invitedByUserId),
		index("idx_organization_member_invitation_organization_id").on(table.organizationId),
		uniqueIndex("uq_organization_member_invitation_email_org").on(
			table.email,
			table.organizationId,
		),
	],
);

// The following is commented out as it is not needed for now.
// Organization-specific locale settings
// The following is commented out as it is not needed for now.
// Organization-specific locale settings
// export const organizationLocale = table(
// 	"organization_locale",
// 	{
// 		organizationId: text("organization_id")
// 			.notNull()
// 			.references(() => organization.id, { onDelete: "cascade" }),
// 		locale: text("locale").notNull(), // e.g. "en-US", "ar-EG"
// 		isDefault: boolean("is_default").default(false),
// 		isActive: boolean("is_active").default(true),

// 		// Locale-specific settings
// 		numberFormat: text("number_format").default("en-US"), // e.g., "en-US", "fr-FR"
// 		currencyFormat: text("currency_format").default("USD"), // e.g., "USD", "EUR"
// 		dateFormat: text("date_format").default("MM/DD/YYYY"),
// 		timeFormat: text("time_format").default("12h"),
// 		weekStart: integer("week_start").default(0), // 0 = Sunday
// 		createdAt,
// 	},
// 	(t) => [
// 		primaryKey({ columns: [t.organizationId, t.locale] }),
// 		uniqueIndex("uq_org_default_locale")
// 			.on(t.organizationId, t.isDefault)
// 			.where(eq(t.isDefault, true)),
// 		index("idx_org_locale_active").on(t.organizationId, t.isActive),
// 	],
// );

/**
 * Organization Currency Configuration
 *
 * @businessLogic Organization-specific currency preferences and formatting
 * Supports multi-currency organizations with regional currency preferences
 * and display formatting customization.
 *
 * @integrationContext
 * Works with market configuration to provide currency context for
 * pricing, billing, and financial reporting within organization scope.
 */
export const organizationCurrencySettings = table(
	"organization_currency_settings",
	{
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		/**
		 * @businessRule One default currency per organization
		 * @billingContext Default currency for organization billing and reporting
		 */
		isDefault: boolean("is_default").default(false),
		displayFormat: text("display_format"), // e.g., "$1,234.56", "1.234,56 €"
		roundingMode: text("rounding_mode").default("round"), // round, floor, ceil
		roundingIncrement: decimal("rounding_increment", {
			precision: 10,
			scale: 6,
		}), // e.g., 0.05 for rounding to nearest nickel
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		primaryKey({ columns: [t.organizationId, t.currencyCode] }),
		uniqueIndex("uq_organization_currency_default")
			.on(t.organizationId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

/**
 * Organization Market Configuration
 *
 * @businessLogic Regional market configuration for global organizations
 * Enables organizations to operate in multiple geographical markets with
 * market-specific pricing, currencies, and localization.
 *
 * @templatePattern
 * Supports both template-based markets (from global templates) and
 * custom markets for organization-specific regional requirements.
 *
 * @integrationContext
 * Markets provide context for pricing zones, currency settings, and
 * localized content delivery within organizational boundaries.
 */
// TODO: How to ease the flow when the users (can?) switch between markets dynamically?
export const organizationMarket = table(
	"organization_market",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		/**
		 * @templatePattern References global market templates for standardization
		 * @businessLogic Null for custom markets, populated for template-based markets
		 */
		templateId: text("template_id").references(() => marketTemplate.id), // nullable
		isCustom: boolean("is_custom").default(false),
		name, // ✅ Should be nullable for template fallback
		slug, // ✅ Should be nullable for template fallback
		currencyCode: text("currency_code").references(() => currency.code),
		// defaultLocale: text("default_locale"),
		priority: integer("priority").default(0), // for ordering
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_organization_market_organization").on(t.organizationId),
		index("idx_organization_market_currency").on(t.currencyCode),
		// index("idx_organization_market_locale").on(t.defaultLocale),
		index("idx_organization_market_priority").on(t.priority),
		index("idx_organization_market_deleted_at").on(t.deletedAt),
		// Unique slug per organization when slug exists
		uniqueIndex("uq_organization_market_org_slug")
			.on(t.organizationId, t.slug)
			.where(isNotNull(t.slug)),
		index("idx_organization_market_template_custom").on(t.templateId, t.isCustom),
	],
);

/**
 * Market-Country Geographic Assignment
 *
 * @businessLogic Defines geographical coverage for organization markets
 * Enables precise market-to-country mapping for pricing, tax, and
 * regulatory compliance within organizational context.
 */
export const organizationMarketCountry = table(
	"organization_market_country",
	{
		organizationMarketId: text("organization_market_id")
			.notNull()
			.references(() => organizationMarket.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.organizationMarketId, t.countryId] }),
		uniqueIndex("uq_organization_market_country_default")
			.on(t.organizationMarketId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

/**
 * Market Localization and Translation
 *
 * @businessLogic Market-specific content localization within organizations
 * Enables market names, descriptions, and SEO content to be translated
 * for different locales while maintaining market-specific context.
 *
 * @integrationContext
 * Works with SEO system to provide market-specific, localized content
 * for organizations operating in multiple markets and languages.
 */
export const organizationMarketTranslation = table(
	"organization_market_translation",
	{
		id: id.notNull(),
		organizationMarketId: text("organization_market_id")
			.notNull()
			.references(() => organizationMarket.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id), // null for global organizationMarkets
		locale: text("locale").notNull(), // e.g., "en-US", "fr-FR"
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),

		/**
		 * @integrationContext Links to SEO system for market-specific optimization
		 * @businessLogic Optional SEO optimization for market pages
		 */
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_organization_market_translation_unique").on(t.organizationMarketId, t.locale),
		uniqueIndex("uq_organization_market_translation_default")
			.on(t.organizationMarketId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_organization_market_translation_organization").on(t.organizationId),
		index("idx_organization_market_translation_locale").on(t.locale),
	],
);

/**
 * Geo-location Based Pricing Zones
 *
 * @businessLogic Regional pricing strategy implementation
 * Enables organizations to implement geographic pricing strategies
 * with zone-specific currencies, tax rates, and pricing tiers.
 *
 * @integrationContext
 * Works with product pricing system to provide location-based
 * pricing within organizational market structures.
 */
export const organizationPricingZone = table(
	"organization_pricing_zone",
	{
		id: id.notNull(),
		organizationId: text("organization_id").references(() => organization.id),
		name: name.notNull(),
		description: text("description"),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),
		isActive: boolean("is_active").default(true),
		priority: integer("priority").default(0),
		createdAt,
	},
	(t) => [
		index("idx_organization_pricing_zone_organization").on(t.organizationId),
		index("idx_organization_pricing_zone_currency").on(t.currencyCode),
		index("idx_organization_pricing_zone_active").on(t.isActive),
		index("idx_organization_pricing_zone_priority").on(t.priority),
		index("idx_organization_pricing_zone_name").on(t.name),
	],
);

/**
 * Pricing Zone Geographic Coverage
 *
 * @businessLogic Maps countries to pricing zones for precise
 * geographic pricing strategy implementation within organizations.
 */
export const organizationPricingZoneCountry = table(
	"organization_pricing_zone_country",
	{
		zoneId: text("zone_id")
			.notNull()
			.references(() => organizationPricingZone.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.zoneId, t.countryId] })],
);

/**
 * Organization Brand Identity
 *
 * @businessLogic Organization's brand representation for content attribution
 * Used for corporate course branding and professional content creation
 */
export const organizationBrand = table(
	"organization_brand",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description"),
		logo: text("logo"),
		brandCategory: text("brand_category"),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		uniqueIndex("uq_org_brand_slug").on(t.organizationId, t.slug),
		index("idx_org_brand_category").on(t.brandCategory),
	],
);
export const organizationBrandTranslation = table(
	"organization_brand_translation",
	{
		id: id.notNull(),
		organizationBrandId: fk("organization_brand_id")
			.references(() => organizationBrand.id, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// Translatable brand fields
		name: text("name"),
		description: text("description"),
		story: text("story"),

		// SEO metadata reference
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_organization_brand_translation_locale").on(t.organizationBrandId, t.locale),
		uniqueIndex("uq_organization_brand_translation_default")
			.on(t.organizationBrandId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

export const organizationBrandMetrics = table("organization_brand_metrics", {
	id: id.notNull(),
	organizationBrandId: fk("vendor_brand_id")
		.references(() => organizationBrand.id, { onDelete: "cascade" })
		.notNull(),

	// // Brand-specific metrics
	// brandRecognition: decimal("brand_recognition", { precision: 5, scale: 2 }),
	// contentCertifications: integer("content_certifications").default(0),
	// partnerOrganizations: integer("partner_organizations").default(0),
	// brandedCourses: integer("branded_courses").default(0),

	lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
	createdAt,
	updatedAt,
});

export const affiliationTypeEnum = pgEnum("affiliation_type", [
	"owner",
	"employee",
	"contractor",
	"guest",
	"partner",
	"volunteer",
]);

export const affiliationStatusEnum = pgEnum("affiliation_status", [
	"pending",
	"active",
	"suspended",
	"terminated",
]);

export const compensationTypeEnum = pgEnum("compensation_type", [
	"revenue_share",
	"flat_fee",
	"hourly",
	"salary",
	"per_course",
	"none",
]);

/**
 * Instructor-Organization Affiliations
 *
 * @businessLogic Instructor's relationship with specific organization
 * Enables cross-organizational course creation and collaboration
 */
export const instructorOrganizationAffiliation = table(
	"instructor_organization_affiliation",
	{
		id,
		instructorId: text("instructor_id")
			.notNull()
			.references(() => userInstructorProfile.id),
		memberId: fk("member_id").references(() => organizationMember.id, {
			onDelete: "set null",
		}),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		joinedAt: timestamp("joined_at").defaultNow(),
		createdAt,

		// Relationship context
		/**
		 * @affiliationModel Defines instructor-organization relationship type
		 * @compensationContext Influences compensation structure and permissions
		 */
		affiliationType: affiliationTypeEnum("affiliation_type").notNull(),
		role: text("role"), // "lead_instructor", "subject_expert", "guest_lecturer", "content_reviewer"
		title: text("title"), // "Senior Training Manager", "Principal Instructor"

		// The following is commented out because it should be handled in another way, not like this, needs to be well thought out
		// // Permissions within this organization
		// canCreateCourses: boolean("can_create_courses").default(true),
		// canManageStudents: boolean("can_manage_students").default(false),
		// canAccessAnalytics: boolean("can_access_analytics").default(true),
		// canManageOtherInstructors: boolean("can_manage_other_instructors").default(
		// 	false,
		// ),
		// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"

		/**
		 * @compensationStructure Flexible payment models for instructor relationships
		 * @businessModel Supports various instructor compensation strategies
		 */
		compensationType: compensationTypeEnum("compensation_type").default("revenue_share"),
		compensationAmount: decimal("compensation_amount", {
			precision: 10,
			scale: 2,
		}),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),

		// Relationship lifecycle
		status: affiliationStatusEnum("status").default("pending"),
		startedAt: timestamp("started_at").defaultNow(),
		endedAt: timestamp("ended_at"),

		/**
		 * @workflowTracking Affiliation creation and approval workflow management
		 * @auditTrail Complete lifecycle tracking for governance and compliance
		 */
		connectionMethod: text("connection_method"), // "self_created_org", "invited", "applied", "imported", "transferred"
		invitedBy: fk("invited_by").references(() => user.id),
		applicationNotes: text("application_notes"),
		// The approval process is optional, but if used:
		// - If the organization requires approval, the affiliation is pending until approved
		// - If the organization does not require approval, the affiliation is active immediately
		// - If the affiliation is approved, the status changes to active
		// - If the affiliation is rejected, the status changes to rejected
		// The approval is done by an organization member with the appropriate permissions
		approvedBy: fk("approved_by").references(() => organizationMember.id),
		approvedAt: timestamp("approved_at"),
	},
	(t) => [
		uniqueIndex("uq_instructor_org_affiliation").on(t.instructorId, t.organizationId),
		index("idx_instructor_affiliation_org").on(t.organizationId),
		index("idx_instructor_affiliation_member").on(t.memberId),
	],
);
