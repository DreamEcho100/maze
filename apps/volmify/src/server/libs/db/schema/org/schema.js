import { eq } from "drizzle-orm";
import { index, jsonb, primaryKey, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { numericCols, sharedCols, table, temporalCols, textCols } from "../_utils/helpers.js";

import { user } from "../user/schema.js";
import { buildOrgI18nTable, orgTableName } from "./_utils/helpers.js";

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
		id: textCols.id().notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
		/**
		 * Creator becomes the first `admin` and is granted full permissions.
		 * Enables automatic role provisioning during onboarding.
		 */
		createdById: textCols
			.idFk("created_by_id")
			.references(() => user.id)
			.notNull(),

		// TODO: owner connection

		/**
		 * Unique human-readable identifier (e.g., "Acme Inc.")
		 * Used in dashboards, invitations, and billing.
		 */
		name: textCols.name().notNull(),

		/**
		 * Unique slug used in URLs and subdomain routing.
		 * E.g., `acme` → acme.yourdomain.com or /org/acme
		 */
		slug: textCols.slug().notNull(),

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
			index(`idx_${base}_last_updated_at`).on(table.lastUpdatedAt),
			index(`idx_${base}_deleted_at`).on(table.deletedAt),
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
		orgId: textCols
			.idFk(`${orgTableName}_id`)
			.notNull()
			.references(() => org.id, { onDelete: "cascade" }),
		currencyCode: sharedCols.currencyCodeFk().notNull(),
		isDefault: sharedCols.isDefault(), // Used as default for invoices, display
		displayFormat: textCols.displayFormat(), // "$1,234.56", "1.234,56 €", etc.
		// TODO: convert to enum
		roundingMode: text("rounding_mode").default("round"), // 'round' | 'floor' | 'ceil'
		roundingIncrement: numericCols.exchangeRate.roundingIncrement(), // e.g. 0.01 for cents, 0.1 for tenths
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
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
 * @businessLogic Represents org branding used across
 * content, marketing, and course attribution.
 */
export const orgBrand = table(
	`${orgTableName}_brand`,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),
		slug: textCols.slug().notNull(),
		logoUrl: textCols.url("logo_url"),
		brandCategory: textCols.category("brand_category"), // e.g., "education", "technology", "healthcare"
		// metadata: jsonb("metadata"),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(t) => {
		const base = `${orgTableName}_brand`;
		return [
			uniqueIndex(`uq_${base}_slug`).on(t.orgId, t.slug),
			index(`idx_${base}_category`).on(t.brandCategory),
		];
	},
);

const orgBrandI18nTableName = `${orgTableName}_brand_i18n`;
/**
 * Org Brand Localization
 *
 * @businessLogic Localized branding content for internationalization.
 */
export const orgBrandTranslation = buildOrgI18nTable(orgBrandI18nTableName)(
	{
		brandId: textCols
			.idFk("brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		name: textCols.name().notNull(),
		description: textCols.description(),
		story: textCols.story(),
		seoMetadataId: sharedCols.seoMetadataIdFk(),
	},
	{
		fkKey: "brandId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_seo_metadata_id`).on(t.seoMetadataId),
			index(`idx_${tName}_brand_id`).on(t.brandId),
			index(`idx_${tName}_name`).on(t.name),
		],
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
		id: textCols.id().notNull(),
		orgBrandId: textCols
			.idFk("vendor_brand_id")
			.references(() => orgBrand.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => {
		const base = `${orgTableName}_brand_metrics`;
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			uniqueIndex(`uq_${base}_org_brand`).on(t.orgBrandId),
			index(`idx_${base}_org_brand_id`).on(t.orgBrandId),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
		];
	},
);

// TODO: can be manged through the org membership
// export const jobOrgAffiliationStatusEnum = pgEnum("job_org_affiliation_status", [
// 	"pending",
// 	"active",
// 	"suspended",
// 	"terminated",
// ]);

// The following is commented out as it is not needed for now.
// Org-specific locale settings
// The following is commented out as it is not needed for now.
// Org-specific locale settings
// export const orgLocale = table(
// 	`${orgTableName}_locale`,
// 	{
// 		orgId: textCols.idFK(`org_id`)
// 			.notNull()
// 			.references(() => org.id, { onDelete: "cascade" }),
// 		locale: text("locale").notNull(), // e.g. "en-US", "ar-EG"
// 		isDefault: sharedCols.isDefault(),
// 		isActive: boolean("is_active").default(true),

// 		// Locale-specific settings
// 		numberFormat: text("number_format").default("en-US"), // e.g., "en-US", "fr-FR"
// 		currencyFormat: text("currency_format").default("USD"), // e.g., "USD", "EUR"
// 		dateFormat: text("date_format").default("MM/DD/YYYY"),
// 		timeFormat: text("time_format").default("12h"),
// 		weekStart: integer("week_start").default(0), // 0 = Sunday
// 		createdAt: temporalCols.audit.createdAt(),,
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
// partnerOrgs: integer("partner_orgs").default(0),
// brandedCourses: integer("branded_courses").default(0),

// The following is commented out because it should be handled in another way, not like this, needs to be well thought out
// // Permissions within this org
// canCreateCourses: boolean("can_create_courses").default(true),
// canManageStudents: boolean("can_manage_students").default(false),
// canAccessAnalytics: boolean("can_access_analytics").default(true),
// canManageOtherJobs: boolean("can_manage_other_jobs").default(
// 	false,
// ),
// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"
