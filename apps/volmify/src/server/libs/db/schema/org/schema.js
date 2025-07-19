import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
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
	getLocaleKey,
	idCol,
	idFkCol,
	name,
	slug,
	table,
	updatedAt,
} from "../_utils/helpers.js";
import { currency, locale } from "../general/locale-currency-market/schema.js";
import { seoMetadata } from "../general/seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { user } from "../user/schema.js";
import { orgTableName } from "./_utils/helpers.js";
import { orgMember } from "./member/schema.js";

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
		id: idCol.notNull(),
		createdAt,
		updatedAt,
		deletedAt,
		/**
		 * Creator becomes the first `admin` and is granted full permissions.
		 * Enables automatic role provisioning during onboarding.
		 */
		createdById: text("created_by_id")
			.references(() => user.id)
			.notNull(),

		// TODO: owner connection

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
			index(`idx_${base}_created_by_id`).on(table.createdById),
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
		orgId: idFkCol(`${orgTableName}_id`)
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

/**
 * Org Brand Configuration
 *
 * @businessLogic Represents orgal branding used across
 * content, marketing, and course attribution.
 */
export const orgBrand = table(
	`${orgTableName}_brand`,
	{
		id: idCol.notNull(),
		orgId: idFkCol(`${orgTableName}_id`)
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
		id: idCol.notNull(),
		brandId: idFkCol("brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
		story: text("story"),
		seoMetadataId: idFkCol("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => {
		const base = `${orgTableName}_brand_translation`;
		return [
			uniqueIndex(`uq_${base}_locale`).on(t.brandId, t.localeKey),
			uniqueIndex(`uq_${base}_default`).on(t.brandId, t.isDefault).where(eq(t.isDefault, true)),
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
		id: idCol.notNull(),
		orgBrandId: idFkCol("vendor_brand_id")
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

export const instructorOrgAffiliationTypeEnum = pgEnum("instructor_org_affiliation_type", [
	"owner",
	"employee",
	"contractor",
	"guest",
	"partner",
	"volunteer",
]);
export const instructorOrgAffiliationStatusEnum = pgEnum("instructor_org_affiliation_status", [
	"pending",
	"active",
	"suspended",
	"terminated",
]);
export const instructorOrgAffiliationCompensationTypeEnum = pgEnum(
	"instructor_org_affiliation_compensation_type",
	["revenue_share", "flat_fee", "hourly", "salary", "per_course", "none"],
);
/**
 * Instructor-Org Affiliation
 *
 * @businessLogic Connects instructors to orgs for content creation,
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
		id: idCol.notNull(),
		instructorId: text("instructor_id")
			.notNull()
			.references(() => userInstructorProfile.id),
		memberId: idFkCol("member_id").references(() => orgMember.id, {
			onDelete: "set null",
		}),
		orgId: idFkCol(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id),
		joinedAt: timestamp("joined_at").defaultNow(),
		createdAt,

		affiliationType: instructorOrgAffiliationTypeEnum("affiliation_type").notNull(),
		role: text("role"),
		title: text("title"),

		compensationType:
			instructorOrgAffiliationCompensationTypeEnum("compensation_type").default("revenue_share"),
		compensationAmount: decimal("compensation_amount", {
			precision: 10,
			scale: 2,
		}),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),

		status: instructorOrgAffiliationStatusEnum("status").default("pending"),
		startedAt: timestamp("started_at").defaultNow(),
		endedAt: timestamp("ended_at"),

		connectionMethod: text("connection_method"),
		invitedBy: idFkCol("invited_by").references(() => user.id),
		applicationNotes: text("application_notes"),
		approvedBy: idFkCol("approved_by").references(() => orgMember.id),
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
// export const orgLocale = table(
// 	`${orgTableName}_locale`,
// 	{
// 		orgId: text(`org_id`)
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
// orgType: varchar("type", { length: 50 }).default("company"), // 'company', 'agency', 'freelancer'
// billingEmail: varchar("billing_email", { length: 256 }),
// website: varchar("website", { length: 512 }),
// industry: varchar("industry", { length: 100 })

// // Brand-specific metrics
// brandRecognition: decimal("brand_recognition", { precision: 5, scale: 2 }),
// contentCertifications: integer("content_certifications").default(0),
// partnerOrganizations: integer("partner_orgs").default(0),
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
