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
 * Organizations define the root context for access control. Each tenant has its
 * own permission groups, departments, teams, users, and configuration. All access
 * evaluations resolve within a specific organization boundary.
 *
 * @designPattern Context Boundary + Hierarchical Delegation
 * - Context Boundary: `organization` is the primary tenant unit.
 * - Hierarchy: Users → Members → Departments & Teams → Permission Groups → System Permissions
 *
 * @abacFlow
 * ```
 * Subject (User) + Context (Organization) + Attributes (Permissions via Groups) + Resource → Decision
 * ```
 *
 * @integrationPoints
 * - Authentication: Identifies user in context of organization
 * - Authorization: ABAC policy enforcement via member/group mappings
 * - Commerce: Market-level currency, tax, and pricing configs
 * - i18n: Locale and content strategies per organization
 *
 * @businessValue
 * Enables scalable B2B SaaS architecture with clean tenant isolation,
 * granular access controls, and flexible org structures (departments, teams, roles).
 */

export const memberBaseRoleEnum = pgEnum("member_base_role", [
	"admin", // Full organizational privileges; manage members, teams, configs
	"member", // Standard member role; actual permissions governed by group mappings
]);

const organizationMetadataJsonb = jsonb("metadata");

/**
 * Organization Context Boundary
 *
 * @abacRole Root Scope for Multi-Tenant Access Control
 * Serves as the foundational boundary for all access control, configuration, and content ownership.
 *
 * @businessLogic
 * Represents a company, institution, or customer account in a SaaS context.
 * Each organization has isolated content, users, permission groups, and market settings.
 */
export const organization = table(
	"organization",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		/**
		 * Creator becomes the first `admin` and is granted full permissions.
		 * Enables automatic role provisioning during onboarding.
		 */
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),

		/**
		 * Unique human-readable identifier (e.g., "Acme Inc.")
		 * Used in dashboards, invitations, and billing.
		 */
		name: name.notNull().unique("uq_organization_name"),

		/**
		 * Unique slug used in URLs and subdomain routing.
		 * E.g., `acme` → acme.yourdomain.com or /org/acme
		 */
		slug: slug.notNull().unique("uq_organization_slug"),

		logo: varchar("logo", { length: 2096 }),

		/** Arbitrary JSON for custom org-specific metadata, preferences, etc. */
		metadata:
			/** @type {ReturnType<typeof organizationMetadataJsonb.$type<Record<string, any>>>} */ (
				organizationMetadataJsonb
			),
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
 * @abacRole Permission Assignment Unit (Flexible)
 * Teams are non-hierarchical units used for permission scoping and collaboration.
 * They may span multiple departments or operate independently.
 *
 * @businessLogic
 * Teams are used for collaborative grouping (e.g. Project A Team, Content Team).
 * They may be short-lived (project-based) or permanent (functional).
 */
export const organizationTeam = table(
	"organization_team",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: name.notNull(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		/**
		 * Indicates structural intent of the team for UI and policy logic.
		 */
		teamType: text("team_type").default("cross_functional"), // Options: departmental, cross_functional, project, permanent

		/**
		 * Whether this team can include members from multiple departments.
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
 * @abacRole Subject (User-Org Contextualized Identity)
 * Represents the user within a specific organization and acts as the subject
 * in ABAC evaluations. Connects the global user identity to tenant-specific roles.
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
		 * Determines baseline org access. Most logic uses permission groups for actual decisions.
		 */
		role: memberBaseRoleEnum("role").notNull().default("member"),

		/**
		 * Status can be: invited, active, suspended, left
		 */
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
 * @abacRole Structural Grouping
 * Traditional department construct for hierarchical orgs. Provides
 * structure and influences default permissions for members and teams.
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
		color: text("color"),

		isDefault: boolean("is_default").default(false), // Only one per org

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
 * Member-Department Assignment (M:M)
 *
 * @abacRole Structural Permission Grouping
 * Members can belong to one or more departments. This informs both permission
 * inheritance and UI logic (like filtering or default views).
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

		isDefault: boolean("is_default").default(false), // Only one per member

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
	"admin", // Full access to manage team members, settings, and permissions
	"member", // Scoped access based on permission groups assigned within the team
]);

/**
 * Organization Member ⇄ Team Assignment
 *
 * @abacRole Team-Scoped Subject Role
 * Links members to teams with scoped roles and membership metadata.
 * Enables dynamic collaboration units and layered permissions within organizations.
 *
 * @collaborationModel
 * - Team-based access boundaries
 * - Role-specific access within team scope
 * - Supports transient or permanent collaboration units
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
		status: varchar("status", { length: 20 }).default("active"), // 'pending' | 'active' | 'suspended' | 'left'
		role: organizationMemberTeamRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(t) => [
		index("idx_organization_member_team_created_at").on(t.createdAt),
		index("idx_organization_member_team_status").on(t.status),
		index("idx_organization_member_team_role").on(t.role),
		index("idx_organization_member_team_joined_at").on(t.joinedAt),
		uniqueIndex("uq_member_team").on(t.memberId, t.teamId),
	],
);

/**
 * Team ⇄ Department Mapping
 *
 * @abacRole Cross-Domain Access Bridge
 * Connects teams with departments to support matrix-style org charts and
 * permission inheritance across domains.
 */
export const organizationTeamDepartment = table(
	"organization_team_department",
	{
		id: id.notNull(),
		teamId: fk("team_id")
			.notNull()
			.references(() => organizationTeam.id, { onDelete: "cascade" }),
		departmentId: fk("department_id")
			.notNull()
			.references(() => organizationDepartment.id, { onDelete: "cascade" }),

		isPrimary: boolean("is_primary").default(false), // Single primary department per team
		relationshipType: text("relationship_type").default("collaboration"), // 'lead' | 'collaboration' | 'support'

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
 * Member ⇄ Permission Group Assignment
 *
 * @abacRole Attribute Assignment Model
 * Links members to organizational permission groups for ABAC resolution.
 */
export const organizationMemberPermissionsGroup = table(
	"organization_member_permissions_group",
	{
		id: id.notNull(),
		createdAt,
		createdBy: text("created_by").references(() => user.id), // Optional audit trail
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("uq_member_permission_group").on(t.memberId, t.permissionsGroupId),
		index("idx_member_permission_group_member_id").on(t.memberId),
		index("idx_member_permission_group_group_id").on(t.permissionsGroupId),
	],
);

/**
 * Permission Groups (Role Templates)
 *
 * @abacRole Attribute Container
 * Permission groups represent collections of system permissions applied within
 * an organization's scope to simplify permission management and reuse.
 */
export const organizationPermissionsGroup = table(
	"organization_permissions_group",
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by").references(() => user.id), // Nullable for seeded/system roles
		name: name.notNull(),
		description: varchar("description", { length: 256 }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		isSystem: boolean("is_system").default(false), // Flag for system-defined groups
		metadata: jsonb("metadata"),
	},
	(t) => [
		index("idx_organization_permissions_group_created_at").on(t.createdAt),
		index("idx_organization_permissions_group_updated_at").on(t.updatedAt),
		index("idx_organization_permissions_group_is_system").on(t.isSystem),
		uniqueIndex("uq_organization_permissions_group_name").on(t.name, t.organizationId),
	],
);

/**
 * Permission Group ⇄ System Permission Mapping
 *
 * @abacRole Permission Attribute Resolver
 * Binds permission groups to low-level system permissions (defined globally)
 * enabling context-specific role composition.
 */
export const organizationPermissionsGroupPermission = table(
	"organization_permissions_group_permission",
	{
		id: id.notNull(),
		createdAt,
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
		assignedBy: text("assigned_by").references(() => user.id),
	},
	(t) => [
		uniqueIndex("uq_group_permission").on(t.permissionsGroupId, t.systemPermissionId),
		index("idx_group_permission_group_id").on(t.permissionsGroupId),
		index("idx_group_permission_permission_id").on(t.systemPermissionId),
	],
);

export const organizationMemberInvitationStatusEnum = pgEnum(
	"organization_member_invitation_status",
	[
		"pending", // Awaiting response
		"accepted", // Member joined organization
		"declined", // Invitee declined
		"cancelled", // Invite cancelled by sender
		"revoked", // Revoked access before action
	],
);

/**
 * Member Invitation Table
 *
 * @abacRole Pre-Membership Identity Provisioning
 * Handles invitation issuance and acceptance into the ABAC org model.
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
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		status: organizationMemberInvitationStatusEnum("status").notNull().default("pending"),
		role: memberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"),
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
		memberId: text("member_id").references(() => organizationMember.id),
	},
	(t) => [
		index("idx_organization_member_invitation_created_at").on(t.createdAt),
		index("idx_organization_member_invitation_updated_at").on(t.updatedAt),
		index("idx_organization_member_invitation_status").on(t.status),
		index("idx_organization_member_invitation_expires_at").on(t.expiresAt),
		index("idx_organization_member_invitation_email").on(t.email),
		index("idx_organization_member_invitation_invited_by_user_id").on(t.invitedByUserId),
		index("idx_organization_member_invitation_organization_id").on(t.organizationId),
		uniqueIndex("uq_organization_member_invitation_email_org").on(t.email, t.organizationId),
	],
);

/**
 * Organization Currency Settings
 *
 * @integrationPoint Market + Billing Configuration
 * Allows org-level currency preferences and rounding strategies.
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
		isDefault: boolean("is_default").default(false), // Used as default for invoices, display
		displayFormat: text("display_format"), // "$1,234.56", "1.234,56 €", etc.
		roundingMode: text("rounding_mode").default("round"), // 'round' | 'floor' | 'ceil'
		roundingIncrement: decimal("rounding_increment", {
			precision: 10,
			scale: 6,
		}),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		primaryKey({ columns: [t.organizationId, t.currencyCode] }),
		uniqueIndex("uq_organization_currency_default")
			.on(t.organizationId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

// TODO: How to ease the flow when the users (can?) switch between markets dynamically?
/**
 * Organization Market Configuration
 *
 * @businessLogic Supports multi-regional operations by linking an organization
 * to one or more market contexts, enabling localized pricing, currencies,
 * and content.
 *
 * @templatePattern Can inherit structure from global market templates while
 * allowing organization-specific overrides.
 *
 * @integrationContext Integrates with pricing, currency, and localization
 * systems for contextual delivery based on the active market.
 */
export const organizationMarket = table(
	"organization_market",
	{
		id: id.notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),

		/**
		 * @templatePattern Optional reference to a global market template
		 * Used for standardizing structure across markets.
		 */
		templateId: text("template_id").references(() => marketTemplate.id),

		isCustom: boolean("is_custom").default(false),

		/**
		 * @localizationOverrides Optional overrides for fallback template values
		 */
		name,
		slug,
		currencyCode: text("currency_code").references(() => currency.code),

		priority: integer("priority").default(0),

		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_organization_market_organization").on(t.organizationId),
		index("idx_organization_market_currency").on(t.currencyCode),
		index("idx_organization_market_priority").on(t.priority),
		index("idx_organization_market_deleted_at").on(t.deletedAt),
		uniqueIndex("uq_organization_market_org_slug")
			.on(t.organizationId, t.slug)
			.where(isNotNull(t.slug)),
		index("idx_organization_market_template_custom").on(t.templateId, t.isCustom),
	],
);

/**
 * Market-to-Country Mapping
 *
 * @businessLogic Assigns countries to organization markets for geographic
 * targeting, pricing logic, and compliance.
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
 * Market Translation (i18n)
 *
 * @businessLogic Allows market names and descriptions to be localized
 * per language and region.
 *
 * @integrationContext Connects to SEO for localized optimization.
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
			.references(() => organization.id),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
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
 * Pricing Zones by Geography
 *
 * @businessLogic Enables differential pricing strategies per region.
 *
 * @integrationContext Works with product pricing, tax, and currency
 * configuration systems.
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
 * Pricing Zone to Country Mapping
 *
 * @businessLogic Maps countries to pricing zones for regional pricing strategies.
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
 * Organization Brand Configuration
 *
 * @businessLogic Represents organizational branding used across
 * content, marketing, and course attribution.
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

/**
 * Organization Brand Localization
 *
 * @businessLogic Localized branding content for internationalization.
 */
export const organizationBrandTranslation = table(
	"organization_brand_translation",
	{
		id: id.notNull(),
		organizationBrandId: fk("organization_brand_id")
			.references(() => organizationBrand.id, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),
		name: text("name"),
		description: text("description"),
		story: text("story"),
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, { onDelete: "set null" }),
	},
	(t) => [
		uniqueIndex("uq_organization_brand_translation_locale").on(t.organizationBrandId, t.locale),
		uniqueIndex("uq_organization_brand_translation_default")
			.on(t.organizationBrandId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

/**
 * Brand Metrics and Performance Data
 *
 * @businessLogic Tracks metrics and usage data for brand content.
 */
export const organizationBrandMetrics = table("organization_brand_metrics", {
	id: id.notNull(),
	organizationBrandId: fk("vendor_brand_id")
		.references(() => organizationBrand.id, { onDelete: "cascade" })
		.notNull(),
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
 * Instructor-Organization Affiliation
 *
 * @businessLogic Connects instructors to organizations for content creation,
 * collaboration, and payment.
 *
 * @compensationContext Enables flexible payment strategies per affiliation.
 *
 * @workflowTracking Tracks affiliation lifecycle, including invitations,
 * approval, and status transitions.
 */
export const instructorOrganizationAffiliation = table(
	"instructor_organization_affiliation",
	{
		id,
		instructorId: text("instructor_id")
			.notNull()
			.references(() => userInstructorProfile.id),
		memberId: fk("member_id").references(() => organizationMember.id, { onDelete: "set null" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		joinedAt: timestamp("joined_at").defaultNow(),
		createdAt,

		affiliationType: affiliationTypeEnum("affiliation_type").notNull(),
		role: text("role"),
		title: text("title"),

		compensationType: compensationTypeEnum("compensation_type").default("revenue_share"),
		compensationAmount: decimal("compensation_amount", { precision: 10, scale: 2 }),
		revenueSharePercentage: decimal("revenue_share_percentage", { precision: 5, scale: 2 }),

		status: affiliationStatusEnum("status").default("pending"),
		startedAt: timestamp("started_at").defaultNow(),
		endedAt: timestamp("ended_at"),

		connectionMethod: text("connection_method"),
		invitedBy: fk("invited_by").references(() => user.id),
		applicationNotes: text("application_notes"),
		approvedBy: fk("approved_by").references(() => organizationMember.id),
		approvedAt: timestamp("approved_at"),
	},
	(t) => [
		uniqueIndex("uq_instructor_org_affiliation").on(t.instructorId, t.organizationId),
		index("idx_instructor_affiliation_org").on(t.organizationId),
		index("idx_instructor_affiliation_member").on(t.memberId),
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

// The following fields are commented because they are not used right now, but can be added later if needed
// status: varchar("status", { length: 20 }).default("active"), // 'active', 'suspended', 'closed'
// organizationType: varchar("type", { length: 50 }).default("company"), // 'company', 'agency', 'freelancer'
// billingEmail: varchar("billing_email", { length: 256 }),
// website: varchar("website", { length: 512 }),
// industry: varchar("industry", { length: 100 })

// // Brand-specific metrics
// brandRecognition: decimal("brand_recognition", { precision: 5, scale: 2 }),
// contentCertifications: integer("content_certifications").default(0),
// partnerOrganizations: integer("partner_organizations").default(0),
// brandedCourses: integer("branded_courses").default(0),

// The following is commented out because it should be handled in another way, not like this, needs to be well thought out
// // Permissions within this organization
// canCreateCourses: boolean("can_create_courses").default(true),
// canManageStudents: boolean("can_manage_students").default(false),
// canAccessAnalytics: boolean("can_access_analytics").default(true),
// canManageOtherInstructors: boolean("can_manage_other_instructors").default(
// 	false,
// ),
// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"
