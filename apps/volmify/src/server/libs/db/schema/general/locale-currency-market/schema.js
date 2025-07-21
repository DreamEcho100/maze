import { boolean, index, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { numericCols, sharedCols, table, temporalCols, textCols } from "../../_utils/helpers.js";

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
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		key: sharedCols.localeKey("key").notNull().primaryKey(), // e.g. "en-US", "fr-FR"

		/**
		 * @displayInfo Human-readable locale information
		 * @platformUI Locale display in admin interfaces
		 */
		name: textCols.name().notNull(), // "English (United States)"
		nativeName: textCols.name("native_name").notNull(), // "English (United States)"
		languageCode: textCols.code("language_code").notNull(), // "en"
		countryCode: textCols.countryCode(), // "US"

		/**
		 * @platformManagement Locale availability and configuration
		 * @businessRule Controls locale availability across platform
		 */
		isActive: sharedCols.isActive().default(true),
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
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
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
		code: textCols.code().primaryKey().notNull(), // ISO 4217 code (e.g., "USD")
		name: textCols.name().notNull(),
		symbol: textCols.symbol("symbol").notNull(),
		numericCode: textCols.code("numeric_code"),
		minorUnit: integer("minor_unit").notNull().default(2),
		isActive: boolean("is_active").default(true),
		deletedAt: temporalCols.audit.deletedAt(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(t) => {
		const base = "currency";
		return [
			index(`idx_${base}_name`).on(t.name),
			index(`idx_${base}_symbol`).on(t.symbol),
			index(`idx_${base}_active`).on(t.isActive),
			index(`idx_${base}_deleted_at`).on(t.deletedAt),
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
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
		id: textCols.id().notNull(),
		isoCode: textCols.code("iso_code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
		isoCode3: textCols.code("iso_code_3").notNull().unique(), // ISO 3166-1 alpha-3
		numericCode: textCols.code("numeric_code").notNull(),
		name: textCols.name().notNull(),
		nativeName: textCols.name("native_name"),
		currencyCode: sharedCols.currencyCodeFk("currency_code").notNull(),
		defaultLocale: textCols.code("default_locale").notNull(),
		flagEmoji: textCols.code("flag_emoji"),
		phoneCode: textCols.code("phone_code").notNull(), // e.g., "+1" for US
		continent: text("continent"),
		region: text("region"),
		subregion: text("subregion"),
		capital: text("capital"),
		languages: text("languages").array(),
		timezones: text("timezones").array(),
		isActive: sharedCols.isActive().default(true),
		vatRate: numericCols.percentage.vatRate(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
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
			index(`idx_${base}_subregion`).on(t.subregion),
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
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
		id: textCols.id(),
		baseCurrency: sharedCols.currencyCodeFk("base_currency").notNull(),
		targetCurrency: sharedCols.currencyCodeFk("target_currency").notNull(),
		rate: numericCols.exchangeRate.rate().notNull(),
		source: textCols.source(), // e.g., "ECB", "manual"
		validFrom: temporalCols.financial.validFrom().notNull(),
		validTo: temporalCols.financial.validTo(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
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
			index(`idx_${base}_created_at`).on(t.createdAt),
			index(`idx_${base}_last_updated_at`).on(t.lastUpdatedAt),
			index(`idx_${base}_deleted_at`).on(t.deletedAt),
		];
	},
);
