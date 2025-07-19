import { eq } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import {
	createdAt,
	deletedAt,
	getLocaleKey,
	idCol,
	name,
	slug,
	table,
	updatedAt,
} from "../../_utils/helpers.js";
import { seoMetadata } from "../seo/schema.js";

/**
 * @fileoverview 🌍 Currency & Market Schema — Global Commerce Backbone
 *
 * @context
 * Enables multi-currency support, international market templates, regional compliance,
 * and pricing logic across countries. This forms the foundation of our internationalization
 * and localization strategy.
 *
 * @design
 * - Reference data for currencies and countries (ISO 4217 & 3166)
 * - Market templates as reusable configurations
 * - Exchange rate history for audit-ready currency conversions
 *
 * @integrations
 * Used by pricing, billing, subscriptions, tax, localization, and storefront rendering.
 * Core to org onboarding, multi-region launches, and financial reporting.
 */

/**
 * Locale Registry
 *
 * @abacRole Locale Definition
 * Defines supported locales for the platform, enabling
 * multi-language support and regional customization.
 * @businessLogic
 * Locales are defined by a combination of language and region codes,
 * e.g., "en-US" for English (United States).
 * @namingPattern
 * "language-region" (e.g., "en-US", "fr-FR")
 * @integrationPoints
 * - Localization middleware: Determines content language based on user locale
 * - UI rendering: Displays content in user's preferred language
 * @businessValue
 * Enables global reach and user experience personalization
 * by supporting multiple languages and regions.
 * @designPattern
 * Centralized locale registry with unique locale identifiers
 * to ensure consistent language handling across the platform.
 * @securityModel
 * - Whitelist-only approach: All supported locales must be predefined
 * - No custom locales allowed at org level
 *  Ensures consistent language handling and prevents
 * locale-related security issues.
 */
export const locale = table(
	"locale",
	{
		// id: id.notNull(),
		createdAt,
		updatedAt,
		deletedAt,

		// locale: text("locale").notNull(),
		// languageCode: text("language_code").notNull(), // e.g. "en", "fr", "es"
		// regionCode: text("region_code").notNull(), // e.g. "US", "GB", "CA"
		// code
		// label
		key: getLocaleKey("key").notNull().primaryKey(), // e.g. "en-US", "fr-FR"

		/**
		 * @displayInfo Human-readable locale information
		 * @platformUI Locale display in admin interfaces
		 */
		name: text("name").notNull(), // "English (United States)"
		nativeName: text("native_name").notNull(), // "English (United States)"
		languageCode: text("language_code").notNull(), // "en"
		countryCode: text("country_code"), // "US"

		/**
		 * @platformManagement Locale availability and configuration
		 * @businessRule Controls locale availability across platform
		 */
		isActive: boolean("is_active").default(true),
		isRTL: boolean("is_rtl").default(false),

		// /**
		//  * @marketingInfo Locale market information for business intelligence
		//  * @businessStrategy Regional market characteristics
		//  */
		// marketTier: text("market_tier"), // "primary", "secondary", "emerging"
	},
	(t) => {
		const base = "locale";
		return [
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
		];
	},
);

/**
 * 💱 Currency Reference Table
 *
 * @context
 * Defines system-supported currencies using ISO 4217 standards.
 *
 * @behavior
 * Treated as immutable reference data. `minorUnit` governs decimal precision (e.g., 2 for USD).
 *
 * @integrations
 * Used across pricing, invoicing, exchange rates, and market templates.
 */
export const currency = table(
	"currency",
	{
		code: text("code").primaryKey().notNull(), // ISO 4217 code (e.g., "USD")
		name: name.notNull(),
		symbol: text("symbol").notNull(),
		numericCode: text("numeric_code"),
		minorUnit: integer("minor_unit").notNull().default(2),
		isActive: boolean("is_active").default(true),
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => {
		const base = "currency";
		return [
			index(`idx_${base}_name`).on(t.name),
			index(`idx_${base}_symbol`).on(t.symbol),
			index(`idx_${base}_active`).on(t.isActive),
			index(`idx_${base}_deleted_at`).on(t.deletedAt),
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_updated_at`).on(t.updatedAt),
		];
	},
);

/**
 * 🗺️ Country Reference Table
 *
 * @context
 * Contains geographic, cultural, and financial metadata per country.
 * Based on ISO 3166 and aligned with financial & localization needs.
 *
 * @integrations
 * Used in user profiles, tax rules, pricing localization, address forms,
 * and shipping logic.
 */
export const country = table(
	"country",
	{
		id: idCol.notNull(),
		isoCode: text("iso_code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
		isoCode3: text("iso_code_3").notNull().unique(), // ISO 3166-1 alpha-3
		numericCode: text("numeric_code").notNull(),
		name: name.notNull(),
		nativeName: text("native_name"),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		defaultLocale: text("default_locale").notNull(),
		flagEmoji: text("flag_emoji"),
		phoneCode: text("phone_code"),
		continent: text("continent"),
		region: text("region"),
		subregion: text("subregion"),
		capital: text("capital"),
		languages: text("languages").array(),
		timezones: text("timezones").array(),
		isActive: boolean("is_active").default(true),
		vatRate: decimal("vat_rate", { precision: 5, scale: 4 }),
		createdAt,
		updatedAt,
	},
	(t) => {
		const base = "country";
		return [
			index(`idx_${base}_iso`).on(t.isoCode),
			index(`idx_${base}_currency`).on(t.currencyCode),
			index(`idx_${base}_name`).on(t.name),
			index(`idx_${base}_active`).on(t.isActive),
			index(`idx_${base}_continent`).on(t.continent),
			index(`idx_${base}_region`).on(t.region),
		];
	},
);

/**
 * 💹 Exchange Rate Table
 *
 * @context
 * Historical and real-time exchange rates for accurate multi-currency billing
 * and reporting. Tracks source, precision, and valid periods.
 *
 * @behavior
 * Rates are time-bounded and auditable with high precision. Multiple sources allow
 * validation and fallback logic.
 *
 * @integrations
 * Used in product pricing, invoices, analytics, and financial reports.
 */
export const exchangeRate = table(
	"exchange_rate",
	{
		id: idCol.notNull(),
		baseCurrency: text("base_currency")
			.notNull()
			.references(() => currency.code),
		targetCurrency: text("target_currency")
			.notNull()
			.references(() => currency.code),
		rate: decimal("rate", { precision: 16, scale: 8 }).notNull(),
		source: text("source"), // e.g., "ECB", "manual"
		validFrom: timestamp("valid_from").notNull(),
		validTo: timestamp("valid_to"),
		deletedAt,
		createdAt,
		precision: integer("precision").default(2),
		rateType: text("rate_type"), // "mid-market", "retail", etc
	},
	(t) => {
		const base = "exchange_rate";
		return [
			uniqueIndex(`uq_${base}_period`).on(t.baseCurrency, t.targetCurrency, t.validFrom, t.source),
			index(`idx_${base}_currencies`).on(t.baseCurrency, t.targetCurrency),
			index(`idx_${base}_date`).on(t.validFrom, t.validTo),
			index(`idx_${base}_active_date`).on(t.validFrom, t.validTo, t.deletedAt),
			index(`idx_${base}_source`).on(t.source),
			index(`idx_${base}_type`).on(t.rateType),
			index(`idx_${base}_deleted_at`).on(t.deletedAt),
		];
	},
);

/**
 * 🧩 Market Templates
 *
 * @context
 * Pre-configured market setups combining currency, locale, and tax defaults.
 * Streamlines international org onboarding and expansion.
 *
 * @behavior
 * Acts as a base configuration. Orgs can override but inherit sensible defaults.
 *
 * @integrations
 * Used in org setup, regional pricing, and storefront routing.
 */
export const marketTemplate = table(
	"market_template",
	{
		id: idCol.notNull(),
		name: name.notNull(), // e.g., "EU", "LATAM", "Global"
		description: text("description"),
		slug,
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		defaultLocale: text("default_locale").notNull(),
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_market_template_slug").on(t.slug),
		index("idx_market_template_currency").on(t.currencyCode),
		index("idx_market_template_locale").on(t.defaultLocale),
		index("idx_market_template_deleted_at").on(t.deletedAt),
	],
);

/**
 * 🌍 Market Template Countries
 *
 * @context
 * Links market templates to the countries they include.
 * Each market can cover multiple countries and define one primary.
 *
 * @behavior
 * Enables flexible grouping (e.g., EU = DE, FR, IT...) with one default fallback.
 *
 * @integrations
 * Used in tax logic, localized pricing, and regional campaign targeting.
 */
export const marketTemplateCountry = table(
	"market_template_country",
	{
		marketTemplateId: text("market_template_id")
			.notNull()
			.references(() => marketTemplate.id, { onDelete: "cascade" }),
		countryId: text("country_id")
			.notNull()
			.references(() => country.id, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.marketTemplateId, t.countryId] }),
		uniqueIndex("uq_market_template_country_default")
			.on(t.marketTemplateId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

/**
 * 🌐 Market Template Translations
 *
 * @context
 * Localized names and descriptions for market templates.
 * Optional SEO metadata supports region-specific marketing pages.
 *
 * @behavior
 * One translation per locale, with one marked as default for fallback.
 *
 * @integrations
 * Used in UI, localized routing, SEO, and marketing automation.
 */
export const marketTemplateTranslation = table(
	"market_template_translation",
	{
		id: idCol.notNull(),
		marketTemplateId: text("market_template_id")
			.notNull()
			.references(() => marketTemplate.id, { onDelete: "cascade" }),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_market_template_translation_unique").on(t.marketTemplateId, t.localeKey),
		uniqueIndex("uq_market_template_translation_default")
			.on(t.marketTemplateId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_market_template_translation_locale_key").on(t.localeKey),
	],
);
