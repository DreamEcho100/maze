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

import { createdAt, deletedAt, id, name, slug, table, updatedAt } from "../_utils/helpers.js";
import { user } from "../auth/schema.js";
import { country, currency, marketTemplate } from "../currency-and-market/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { systemPermission } from "../system/schema.js";

export const memberBaseRoleEnum = pgEnum("member_base_role", [
	"admin", // Admins have full access to the organization, can manage members, teams, and settings
	"member", // Organization members have access to the organization's resources, and it will be based on the permissions group they belong to
]);
const organizationMetadataJsonb = jsonb("metadata");
export const organization = table(
	"organization",
	{
		id,
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by")
			.references(() => user.id)
			.notNull(),
		name: name.notNull().unique("uq_organization_name"),
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
export const organizationTeam = table(
	"organization_team",
	{
		id,
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
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("idx_organization_team_created_at").on(table.createdAt),
		index("idx_organization_team_updated_at").on(table.updatedAt),
		index("idx_organization_team_name").on(table.name),
		uniqueIndex("uq_organization_team_name_org").on(table.name, table.organizationId),
	],
);
export const organizationMember = table(
	"organization_member",
	{
		id,
		createdAt,
		updatedAt,
		deletedAt,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
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
export const organizationMemberTeamRoleEnum = pgEnum("organization_member_team_role", [
	"admin", // Admins have full access to the team, can manage members and settings
	"member", // Members have access to the team's resources, and it will be based on the permissions group they belong to
]);
export const organizationMemberTeam = table(
	"organization_member_team",
	{
		id,
		createdAt,
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => organizationTeam.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 }).default("active"), // 'pending', 'active', 'suspended', 'left'
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
export const organizationMemberPermissionsGroup = table(
	"organization_member_permissions_group",
	{
		id,
		createdAt,
		createdBy: text("created_by").references(() => user.id),
		memberId: text("member_id")
			.notNull()
			.references(() => organizationMember.id, { onDelete: "cascade" }),
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("uq_member_permission_group").on(table.memberId, table.permissionsGroupId),
		index("idx_member_permission_group_member_id").on(table.memberId),
		index("idx_member_permission_group_group_id").on(table.permissionsGroupId),
	],
);
export const organizationPermissionsGroup = table(
	"organization_permissions_group",
	{
		id,
		createdAt,
		updatedAt,
		deletedAt,
		createdBy: text("created_by").references(() => user.id), // It's nullable since it's seeded at first
		name: name.notNull(),
		description: varchar("description", { length: 256 }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
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
export const organizationPermissionsGroupPermission = table(
	"organization_permissions_group_permission",
	{
		id,
		createdAt,
		permissionsGroupId: text("permissions_group_id")
			.notNull()
			.references(() => organizationPermissionsGroup.id, { onDelete: "cascade" }),
		systemPermissionId: text("system_permission_id")
			.notNull()
			.references(() => systemPermission.id, { onDelete: "cascade" }),
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
export const organizationMemberInvitation = table(
	"organization_member_invitation",
	{
		id,
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
		message: text("message"), // Personal invitation message
		acceptedAt: timestamp("accepted_at", { precision: 3 }),
		declinedAt: timestamp("declined_at", { precision: 3 }),
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

export const organizationLocale = table(
	"organization_locale",
	{
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(), // e.g. "en-US", "ar-EG"
		isDefault: boolean("is_default").default(false),
		isActive: boolean("is_active").default(true),
		dateFormat: text("date_format").default("MM/DD/YYYY"),
		timeFormat: text("time_format").default("12h"),
		weekStart: integer("week_start").default(0), // 0 = Sunday
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.organizationId, t.locale] }),
		uniqueIndex("uq_org_default_locale")
			.on(t.organizationId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_org_locale_active").on(t.organizationId, t.isActive),
	],
);

// Organization-specific currency settings
export const organizationCurrencySettings = table(
	"organization_currency_settings",
	{
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		isDefault: boolean("is_default").default(false),
		displayFormat: text("display_format"), // e.g., "$1,234.56", "1.234,56 €"
		roundingMode: text("rounding_mode").default("round"), // round, floor, ceil
		roundingIncrement: decimal("rounding_increment", { precision: 10, scale: 6 }), // e.g., 0.05 for rounding to nearest nickel
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

export const organizationMarket = table(
	"organization_market",
	{
		id,
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id),
		templateId: text("template_id").references(() => marketTemplate.id), // nullable
		isCustom: boolean("is_custom").default(false),
		name, // ✅ Should be nullable for template fallback
		slug, // ✅ Should be nullable for template fallback
		currencyCode: text("currency_code").references(() => currency.code),
		defaultLocale: text("default_locale"),
		priority: integer("priority").default(0), // for ordering
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_organization_market_organization").on(t.organizationId),
		index("idx_organization_market_currency").on(t.currencyCode),
		index("idx_organization_market_locale").on(t.defaultLocale),
		index("idx_organization_market_priority").on(t.priority),
		index("idx_organization_market_deleted_at").on(t.deletedAt),
		// Unique slug per organization when slug exists
		uniqueIndex("uq_organization_market_org_slug")
			.on(t.organizationId, t.slug)
			.where(isNotNull(t.slug)),
		index("idx_organization_market_template_custom").on(t.templateId, t.isCustom),
	],
);

// Market-Country relationship (many-to-many)
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

// Market localization
export const organizationMarketTranslation = table(
	"organization_market_translation",
	{
		id,
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

		// SEO reference (optional - not all translations need SEO)
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

// Geo-location based pricing zones
export const pricingZone = table(
	"pricing_zone",
	{
		id,
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
		index("idx_pricing_zone_organization").on(t.organizationId),
		index("idx_pricing_zone_currency").on(t.currencyCode),
		index("idx_pricing_zone_active").on(t.isActive),
		index("idx_pricing_zone_priority").on(t.priority),
		index("idx_pricing_zone_name").on(t.name),
	],
);

// Countries in pricing zones
export const pricingZoneCountry = table(
	"pricing_zone_country",
	{
		zoneId: text("zone_id")
			.notNull()
			.references(() => pricingZone.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.zoneId, t.countryId] })],
);
