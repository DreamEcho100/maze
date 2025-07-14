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

import {
	createdAt,
	deletedAt,
	fk,
	getLocaleKey,
	id,
	name,
	orgTableName,
	slug,
	table,
	updatedAt,
} from "../_utils/helpers.js";
import {
	country,
	currency,
	locale,
	marketTemplate,
} from "../system/locale-currency-market/schema.js";
import { systemPermission } from "../system/schema.js";
import { seoMetadata } from "../system/seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";

/**
 * @fileoverview Org Schema - Multi-Tenant ABAC Context
 *
 * @architecture Multi-Tenant ABAC (Attribute-Based Access Control)
 * Organizations define the root context for access control. Each tenant has its
 * own permission groups, departments, teams, users, and configuration. All access
 * evaluations resolve within a specific org boundary.
 *
 * @designPattern Context Boundary + Hierarchical Delegation
 * - Context Boundary: `org` is the primary tenant unit.
 * - Hierarchy: Users → Members → Departments & Teams → Permission Groups → System Permissions
 *
 * @abacFlow
 * ```
 * Subject (User) + Context (Org) + Attributes (Permissions via Groups) + Resource → Decision
 * ```
 *
 * @integrationPoints
 * - Authentication: Identifies user in context of org
 * - Authorization: ABAC policy enforcement via member/group mappings
 * - Commerce: Market-level currency, tax, and pricing configs
 * - i18n: Locale and content strategies per org
 *
 * @businessValue
 * Enables scalable B2B SaaS architecture with clean tenant isolation,
 * granular access controls, and flexible org structures (departments, teams, roles).
 */

export const memberBaseRoleEnum = pgEnum("member_base_role", [
	"admin", // Full organizational privileges; manage members, teams, configs
	"member", // Standard member role; actual permissions governed by group mappings
]);

const orgMetadataJsonb = jsonb("metadata");

/**
 * Org Context Boundary
 *
 * @abacRole Root Scope for Multi-Tenant Access Control
 * Serves as the foundational boundary for all access control, configuration, and content ownership.
 *
 * @businessLogic
 * Represents a company, institution, or customer account in a SaaS context.
 * Each org has isolated content, users, permission groups, and market settings.
 */
export const org = table(
	orgTableName,
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
		name: name.notNull(),

		/**
		 * Unique slug used in URLs and subdomain routing.
		 * E.g., `acme` → acme.yourdomain.com or /org/acme
		 */
		slug: slug.notNull(),

		logo: varchar("logo", { length: 2096 }),

		/** Arbitrary JSON for custom org-specific metadata, preferences, etc. */
		metadata: /** @type {ReturnType<typeof orgMetadataJsonb.$type<Record<string, any>>>} */ (
			orgMetadataJsonb
		),
	},
	(table) => {
		const base = orgTableName;
		return [
			uniqueIndex(`uq_${base}_slug`).on(table.slug),
			uniqueIndex(`uq_${base}_name`).on(table.name),
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_updated_at`).on(table.updatedAt),
			index(`idx_${base}_name`).on(table.name),
			index(`idx_${base}_slug`).on(table.slug),
		];
	},
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
export const orgTeam = table(
	`${orgTableName}_team`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: name.notNull(),

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		/**
		 * Indicates structural intent of the team for UI and policy logic.
		 */
		type: text("team_type").default("cross_functional"), // Options: departmental, cross_functional, project, permanent

		/**
		 * Whether this team can include members from multiple departments.
		 */
		allowsCrossDepartmentMembers: boolean("allows_cross_department_members").default(true),

		metadata: jsonb("metadata"),
	},
	(table) => {
		const base = `${orgTableName}_team`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			index(`idx_${base}_updated_at`).on(table.updatedAt),
			index(`idx_${base}_name`).on(table.name),
			uniqueIndex(`uq_${base}_name_org`).on(table.name, table.orgId),
		];
	},
);

/**
 * Org Member (ABAC Subject)
 *
 * @abacRole Subject (User-Org Contextualized Identity)
 * Represents the user within a specific org and acts as the subject
 * in ABAC evaluations. Connects the global user identity to tenant-specific roles.
 */
export const orgMember = table(
	`${orgTableName}_member`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

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
	(table) => {
		const base = `${orgTableName}_member`;
		return [
			index(`idx_${base}_created_at`).on(table.createdAt),
			uniqueIndex(`uq_${base}_user_org`).on(table.userId, table.orgId),
		];
	},
);

/**
 * Organizational Department Structure
 *
 * @abacRole Structural Grouping
 * Traditional department construct for hierarchical orgs. Provides
 * structure and influences default permissions for members and teams.
 */
export const orgDepartment = table(
	`${orgTableName}_department`,
	{
		id: id.notNull(),

		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),

		name: name.notNull(),
		description: text("description"),
		color: text("color"),

		isDefault: boolean("is_default").default(false), // Only one per org

		isActive: boolean("is_active").default(true),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => {
		const base = `${orgTableName}_department`;
		return [
			uniqueIndex(`uq_${base}_name`).on(t.orgId, t.name),
			uniqueIndex(`uq_${base}_default`).on(t.orgId, t.isDefault).where(eq(t.isDefault, true)),
			index(`idx_${base}_organization`).on(t.orgId),
			index(`idx_${base}_active`).on(t.isActive),
		];
	},
);

/**
 * Member-Department Assignment (M:M)
 *
 * @abacRole Structural Permission Grouping
 * Members can belong to one or more departments. This informs both permission
 * inheritance and UI logic (like filtering or default views).
 */
export const orgMemberDepartment = table(
	`${orgTableName}_member_department`,
	{
		id: id.notNull(),

		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),

		departmentId: text("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		isDefault: boolean("is_default").default(false), // Only one per member

		joinedAt: timestamp("joined_at").defaultNow(),

		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_member_department`;
		return [
			uniqueIndex(`uq_${base}`).on(t.memberId, t.departmentId),
			uniqueIndex(`uq_${base}_default`).on(t.memberId, t.isDefault).where(eq(t.isDefault, true)),
			index(`idx_${base}_member`).on(t.memberId),
			index(`idx_${base}_department`).on(t.departmentId),
		];
	},
);

export const orgMemberTeamRoleEnum = pgEnum(`${orgTableName}_member_team_role`, [
	"admin", // Full access to manage team members, settings, and permissions
	"member", // Scoped access based on permission groups assigned within the team
]);

/**
 * Org Member ⇄ Team Assignment
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
export const orgMemberTeam = table(
	`${orgTableName}_member_team`,
	{
		id: id.notNull(),
		createdAt,
		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).default("active"), // 'pending' | 'active' | 'suspended' | 'left'
		role: orgMemberTeamRoleEnum("role").notNull().default("member"),
		joinedAt: timestamp("joined_at", { precision: 3 }),
	},
	(t) => {
		const base = `${orgTableName}_member_team`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_role`).on(t.role),
			index(`idx_${base}_joined_at`).on(t.joinedAt),
			uniqueIndex(`uq_${base}`).on(t.memberId, t.teamId),
		];
	},
);

/**
 * Team ⇄ Department Mapping
 *
 * @abacRole Cross-Domain Access Bridge
 * Connects teams with departments to support matrix-style org charts and
 * permission inheritance across domains.
 */
export const orgTeamDepartment = table(
	`${orgTableName}_team_department`,
	{
		id: id.notNull(),
		teamId: fk("team_id")
			.notNull()
			.references(() => orgTeam.id, { onDelete: "cascade" }),
		departmentId: fk("department_id")
			.notNull()
			.references(() => orgDepartment.id, { onDelete: "cascade" }),

		isPrimary: boolean("is_primary").default(false), // Single primary department per team
		relationshipType: text("relationship_type").default("collaboration"), // 'lead' | 'collaboration' | 'support'

		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_team_department`;
		return [
			uniqueIndex(`uq_${base}`).on(t.teamId, t.departmentId),
			uniqueIndex(`uq_${base}_primary`).on(t.teamId, t.isPrimary).where(eq(t.isPrimary, true)),
			index(`idx_${base}_team`).on(t.teamId),
			index(`idx_${base}_department`).on(t.departmentId),
		];
	},
);

/**
 * Member ⇄ Permission Group Assignment
 *
 * @abacRole Attribute Assignment Model
 * Links members to organizational permission groups for ABAC resolution.
 */
export const orgMemberPermissionsGroup = table(
	`${orgTableName}_member_permissions_group`,
	{
		id: id.notNull(),
		createdAt,
		createdBy: text("created_by").references(() => user.id), // Optional audit trail
		memberId: text("member_id")
			.notNull()
			.references(() => orgMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => orgPermissionsGroup.id, {
				onDelete: "cascade",
			}),
	},
	(t) => {
		const base = `${orgTableName}_member_permissions_group`;
		return [
			uniqueIndex(`uq_${base}`).on(t.memberId, t.permissionsGroupId),
			index(`idx_${base}_member_id`).on(t.memberId),
			index(`idx_${base}_group_id`).on(t.permissionsGroupId),
		];
	},
);

/**
 * Permission Groups (Role Templates)
 *
 * @abacRole Attribute Container
 * Permission groups represent collections of system permissions applied within
 * an org's scope to simplify permission management and reuse.
 */
export const orgPermissionsGroup = table(
	`${orgTableName}_permissions_group`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by").references(() => user.id), // Nullable for seeded/system roles
		name: name.notNull(),
		description: varchar("description", { length: 256 }),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		isSystem: boolean("is_system").default(false), // Flag for system-defined groups
		metadata: jsonb("metadata"),
	},
	(t) => {
		const base = `${orgTableName}_permissions_group`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
			index(`idx_${base}_is_system`).on(t.isSystem),
			uniqueIndex(`uq_${base}_name`).on(t.name, t.orgId),
		];
	},
);

/**
 * Permission Group ⇄ System Permission Mapping
 *
 * @abacRole Permission Attribute Resolver
 * Binds permission groups to low-level system permissions (defined globally)
 * enabling context-specific role composition.
 */
export const orgPermissionsGroupPermission = table(
	`${orgTableName}_permissions_group_permission`,
	{
		id: id.notNull(),
		createdAt,
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => orgPermissionsGroup.id, {
				onDelete: "cascade",
			}),
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
		assignedBy: text("assigned_by").references(() => user.id),
	},
	(t) => {
		const base = `${orgTableName}_permissions_group_permission`;
		return [
			uniqueIndex(`uq_${base}`).on(t.permissionsGroupId, t.systemPermissionId),
			index(`idx_${base}_group_id`).on(t.permissionsGroupId),
			index(`idx_${base}_permission_id`).on(t.systemPermissionId),
		];
	},
);

export const orgMemberInvitationStatusEnum = pgEnum(`${orgTableName}_member_invitation_status`, [
	"pending", // Awaiting response
	"accepted", // Member joined org
	"declined", // Invitee declined
	"cancelled", // Invite cancelled by sender
	"revoked", // Revoked access before action
]);

/**
 * Member Invitation Table
 *
 * @abacRole Pre-Membership Identity Provisioning
 * Handles invitation issuance and acceptance into the ABAC org model.
 */
export const orgMemberInvitation = table(
	`${orgTableName}_member_invitation`,
	{
		id: id.notNull(),
		createdAt,
		updatedAt,
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		email: varchar("email", { length: 256 }).notNull(),
		invitedByUserId: text("invited_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
		status: orgMemberInvitationStatusEnum("status").notNull().default("pending"),
		role: memberBaseRoleEnum("role").notNull().default("member"),
		message: text("message"),
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
		memberId: text("member_id").references(() => orgMember.id),
	},
	(t) => {
		const base = `${orgTableName}_member_invitation`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_expires_at`).on(t.expiresAt),
			index(`idx_${base}_email`).on(t.email),
			index(`idx_${base}_invited_by_user_id`).on(t.invitedByUserId),
			index(`idx_${base}_org_id`).on(t.orgId),
			uniqueIndex(`uq_${base}_email_org`).on(t.email, t.orgId),
		];
	},
);

/**
 * Org Currency Settings
 *
 * @integrationPoint Market + Billing Configuration
 * Allows org-level currency preferences and rounding strategies.
 */
export const orgCurrencySettings = table(
	`${orgTableName}_currency_settings`,
	{
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
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
	(t) => {
		const base = `${orgTableName}_currency_settings`;
		return [
			primaryKey({ columns: [t.orgId, t.currencyCode] }),
			uniqueIndex(`uq_${base}_default`).on(t.orgId, t.isDefault).where(eq(t.isDefault, true)),
		];
	},
);

// TODO: How to ease the flow when the users (can?) switch between markets dynamically?
/**
 * Org Market Configuration
 *
 * @businessLogic Supports multi-regional operations by linking an org
 * to one or more market contexts, enabling localized pricing, currencies,
 * and content.
 *
 * @templatePattern Can inherit structure from global market templates while
 * allowing org-specific overrides.
 *
 * @integrationContext Integrates with pricing, currency, and localization
 * systems for contextual delivery based on the active market.
 */
export const orgMarket = table(
	`${orgTableName}_market`,
	{
		id: id.notNull(),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),

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
	(t) => {
		const base = `${orgTableName}_market`;
		return [
			index(`idx_${base}_organization`).on(t.orgId),
			index(`idx_${base}_currency`).on(t.currencyCode),
			index(`idx_${base}_priority`).on(t.priority),
			index(`idx_${base}_deleted_at`).on(t.deletedAt),
			uniqueIndex(`uq_${base}_org_slug`).on(t.orgId, t.slug).where(isNotNull(t.slug)),
			index(`idx_${base}_template_custom`).on(t.templateId, t.isCustom),
		];
	},
);

/**
 * Market-to-Country Mapping
 *
 * @businessLogic Assigns countries to org markets for geographic
 * targeting, pricing logic, and compliance.
 */
export const orgMarketCountry = table(
	`${orgTableName}_market_country`,
	{
		orgMarketId: text(`${orgTableName}_market_id`)
			.notNull()
			.references(() => orgMarket.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt,
	},
	(t) => {
		const base = `${orgTableName}_market_country`;
		return [
			primaryKey({ columns: [t.orgMarketId, t.countryId] }),
			uniqueIndex(`uq_${base}_default`).on(t.orgMarketId, t.isDefault).where(eq(t.isDefault, true)),
		];
	},
);

/**
 * Market Translation (i18n)
 *
 * @businessLogic Allows market names and descriptions to be localized
 * per language and region.
 *
 * @integrationContext Connects to SEO for localized optimization.
 */
export const orgMarketTranslation = table(
	`${orgTableName}_market_translation`,
	{
		// Placeholder columns to avoid type errors; replace with actual columns when implementing
		id: id.notNull(),
		orgMarketId: text(`${orgTableName}_market_id`)
			.notNull()
			.references(() => orgMarket.id, { onDelete: "cascade" }),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
	},
	(t) => {
		const base = `${orgTableName}_market_translation`;
		return [
			uniqueIndex(`uq_${base}_unique`).on(t.orgMarketId, t.localeKey),
			uniqueIndex(`uq_${base}_default`).on(t.orgMarketId, t.isDefault).where(eq(t.isDefault, true)),
			index(`idx_${base}_organization`).on(t.orgId),
			index(`idx_${base}_locale_key`).on(t.localeKey),
		];
	},
);

/**
 * Pricing Zones by Geography
 *
 * @businessLogic Enables differential pricing strategies per region.
 *
 * @integrationContext Works with product pricing, tax, and currency
 * configuration systems.
 */
export const orgPricingZone = table(
	`${orgTableName}_pricing_zone`,
	{
		id: id.notNull(),
		orgId: text(`${orgTableName}_id`).references(() => org.id),
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
	(t) => {
		const base = `${orgTableName}_pricing_zone`;
		return [
			index(`idx_${base}_organization`).on(t.orgId),
			index(`idx_${base}_currency`).on(t.currencyCode),
			index(`idx_${base}_active`).on(t.isActive),
			index(`idx_${base}_priority`).on(t.priority),
			index(`idx_${base}_name`).on(t.name),
		];
	},
);

/**
 * Pricing Zone to Country Mapping
 *
 * @businessLogic Maps countries to pricing zones for regional pricing strategies.
 */
export const orgPricingZoneCountry = table(
	`${orgTableName}_pricing_zone_country`,
	{
		zoneId: text("zone_id")
			.notNull()
			.references(() => orgPricingZone.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.zoneId, t.countryId] })],
);

/**
 * Org Brand Configuration
 *
 * @businessLogic Represents organizational branding used across
 * content, marketing, and course attribution.
 */
export const orgBrand = table(
	`${orgTableName}_brand`,
	{
		id: id.notNull(),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),
		name: name.notNull(),
		slug: slug.notNull(),
		description: text("description"),
		logo: text("logo"),
		brandCategory: text("brand_category"),
		metadata: jsonb("metadata"),
		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => {
		const base = `${orgTableName}_brand`;
		return [
			uniqueIndex(`uq_${base}_slug`).on(t.orgId, t.slug),
			index(`idx_${base}_category`).on(t.brandCategory),
		];
	},
);

/**
 * Org Brand Localization
 *
 * @businessLogic Localized branding content for internationalization.
 */
export const orgBrandTranslation = table(
	`${orgTableName}_brand_translation`,
	{
		id: id.notNull(),
		orgBrandId: fk(`${orgTableName}_brand_id`)
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
		story: text("story"),
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => {
		const base = `${orgTableName}_brand_translation`;
		return [
			uniqueIndex(`uq_${base}_locale`).on(t.orgBrandId, t.localeKey),
			uniqueIndex(`uq_${base}_default`).on(t.orgBrandId, t.isDefault).where(eq(t.isDefault, true)),
		];
	},
);

/**
 * Brand Metrics and Performance Data
 *
 * @businessLogic Tracks metrics and usage data for brand content.
 */
export const orgBrandMetrics = table(
	`${orgTableName}_brand_metrics`,
	{
		id: id.notNull(),
		orgBrandId: fk("vendor_brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
		createdAt,
		updatedAt,
	},
	(t) => {
		const base = `${orgTableName}_brand_metrics`;
		return [
			index(`idx_${base}_last_updated`).on(t.lastUpdatedAt),
			index(`idx_${base}_created_at`).on(t.createdAt),
			uniqueIndex(`uq_${base}_org_brand`).on(t.orgBrandId),
		];
	},
);

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
 * Instructor-Org Affiliation
 *
 * @businessLogic Connects instructors to organizations for content creation,
 * collaboration, and payment.
 *
 * @compensationContext Enables flexible payment strategies per affiliation.
 *
 * @workflowTracking Tracks affiliation lifecycle, including invitations,
 * approval, and status transitions.
 */
export const instructorOrgAffiliation = table(
	`instructor_${org}_affiliation`,
	{
		id: id.notNull(),
		instructorId: text("instructor_id")
			.notNull()
			.references(() => userInstructorProfile.id),
		memberId: fk("member_id").references(() => orgMember.id, {
			onDelete: "set null",
		}),
		orgId: text(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),
		joinedAt: timestamp("joined_at").defaultNow(),
		createdAt,

		affiliationType: affiliationTypeEnum("affiliation_type").notNull(),
		role: text("role"),
		title: text("title"),

		compensationType: compensationTypeEnum("compensation_type").default("revenue_share"),
		compensationAmount: decimal("compensation_amount", {
			precision: 10,
			scale: 2,
		}),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),

		status: affiliationStatusEnum("status").default("pending"),
		startedAt: timestamp("started_at").defaultNow(),
		endedAt: timestamp("ended_at"),

		connectionMethod: text("connection_method"),
		invitedBy: fk("invited_by").references(() => user.id),
		applicationNotes: text("application_notes"),
		approvedBy: fk("approved_by").references(() => orgMember.id),
		approvedAt: timestamp("approved_at"),
	},
	(t) => {
		const base = `instructor_${orgTableName}_affiliation`;
		return [
			uniqueIndex(`uq_${base}`).on(t.instructorId, t.orgId),
			index(`idx_${base}_org`).on(t.orgId),
			index(`idx_${base}_member`).on(t.memberId),
			index(`idx_${base}_instructor`).on(t.instructorId),
			index(`idx_${base}_status`).on(t.status),
			index(`idx_${base}_affiliation_type`).on(t.affiliationType),
			index(`idx_${base}_compensation_type`).on(t.compensationType),
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_joined_at`).on(t.joinedAt),
			index(`idx_${base}_started_at`).on(t.startedAt),
			index(`idx_${base}_ended_at`).on(t.endedAt),
		];
	},
);

// The following is commented out as it is not needed for now.
// Org-specific locale settings
// The following is commented out as it is not needed for now.
// Org-specific locale settings
// export const organizationLocale = table(
// 	`${orgTableName}_locale`,
// 	{
// 		orgId: text(`${orgTableName}_id`)
// 			.notNull()
// 			.references(() => org.id, { onDelete: "cascade" }),
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
// 		primaryKey({ columns: [t.orgId, t.locale] }),
// 		uniqueIndex("uq_org_default_locale")
// 			.on(t.orgId, t.isDefault)
// 			.where(eq(t.isDefault, true)),
// 		index("idx_org_locale_active").on(t.orgId, t.isActive),
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
// // Permissions within this org
// canCreateCourses: boolean("can_create_courses").default(true),
// canManageStudents: boolean("can_manage_students").default(false),
// canAccessAnalytics: boolean("can_access_analytics").default(true),
// canManageOtherInstructors: boolean("can_manage_other_instructors").default(
// 	false,
// ),
// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"
