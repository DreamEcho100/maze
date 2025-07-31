import { boolean, integer, text } from "drizzle-orm/pg-core";
import { currencyCodeFkCol } from "#db/schema/_utils/cols/shared/foreign-keys/currency-code.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { numericCols } from "../../_utils/cols/numeric.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";

/**
 * @fileoverview 🌍 Currency Schema — Global Commerce Backbone
 *
 * @context
 * Enables multi-currency support, international market templates, regional compliance,
 * and pricing logic across countries. This forms the foundation of our internationalization
 * and localization strategy.
 *
 * @design
 * - Reference data for currencies and countries (ISO 4217 & 3166)
 * - Exchange rate history for audit-ready currency conversions
 *
 * @integrations
 * Used by pricing, billing, subscriptions, tax, localization, and storefront rendering.
 * Core to org onboarding, multi-region launches, and financial reporting.
 */

const localeTableName = "locale";
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
	localeTableName,
	{
		// id: id.notNull(),
		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),

		key: textCols.localeKey("key").notNull().primaryKey(), // e.g. "en-US", "fr-FR"

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
		return [
			...multiIndexes({
				tName: localeTableName,
				colsGrps: [
					{ cols: [t.key] },
					{ cols: [t.name] },
					{ cols: [t.nativeName] },
					{ cols: [t.languageCode] },
					{ cols: [t.countryCode] },
					{ cols: [t.isActive] },
					{ cols: [t.isRTL] },
					{ cols: [t.createdAt] },
					{ cols: [t.lastUpdatedAt] },
					{ cols: [t.deletedAt] },
				],
			}),
		];
	},
);

const currencyTableName = "currency";
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
	currencyTableName,
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
	(t) => [
		...multiIndexes({
			tName: currencyTableName,
			colsGrps: [
				{ cols: [t.code] },
				{ cols: [t.name] },
				{ cols: [t.symbol] },
				{ cols: [t.numericCode] },
				{ cols: [t.minorUnit] },
				{ cols: [t.isActive] },
				{ cols: [t.deletedAt] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
			],
		}),
	],
);

const countryTableName = "country";
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
	countryTableName,
	{
		id: textCols.idPk().notNull(),
		isoCode: textCols.code("iso_code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
		isoCode3: textCols.code("iso_code_3").notNull().unique(), // ISO 3166-1 alpha-3
		numericCode: textCols.code("numeric_code").notNull(),
		name: textCols.name().notNull(),
		nativeName: textCols.name("native_name"),
		currencyCode: currencyCodeFkCol().notNull(),
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
	(t) => [
		...multiIndexes({
			tName: countryTableName,
			colsGrps: [
				{ cols: [t.isoCode] },
				{ cols: [t.isoCode3] },
				{ cols: [t.numericCode] },
				{ cols: [t.name] },
				{ cols: [t.nativeName] },
				{ cols: [t.currencyCode] },
				{ cols: [t.defaultLocale] },
				{ cols: [t.flagEmoji] },
				{ cols: [t.phoneCode] },
				{ cols: [t.continent] },
				{ cols: [t.region] },
				{ cols: [t.subregion] },
				{ cols: [t.capital] },
				{ cols: [t.languages] },
				{ cols: [t.timezones] },
				{ cols: [t.isActive] },
				{ cols: [t.vatRate] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
			],
		}),
	],
);

const exchangeRateTableName = "exchange_rate";
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
	exchangeRateTableName,
	{
		id: textCols.idPk(),
		baseCurrencyCode: currencyCodeFkCol({ name: "base_currency_code" }).notNull(),
		targetCurrencyCode: currencyCodeFkCol({ name: "target_currency_code" }).notNull(),
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
	(t) => [
		...multiForeignKeys({
			tName: exchangeRateTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [t.baseCurrencyCode],
					foreignColumns: [currency.code],
				},
				{
					cols: [t.targetCurrencyCode],
					foreignColumns: [currency.code],
				},
			],
		}),
		uniqueIndex({
			tName: exchangeRateTableName,
			cols: [t.baseCurrencyCode, t.targetCurrencyCode, t.validFrom, t.source],
		}),
		...multiIndexes({
			tName: exchangeRateTableName,
			colsGrps: [
				{ cols: [t.baseCurrencyCode, t.targetCurrencyCode] },
				{ cols: [t.validFrom, t.validTo] },
				{ cols: [t.validFrom, t.validTo, t.deletedAt] },
				{ cols: [t.source] },
				{ cols: [t.rateType] },
				{ cols: [t.createdAt] },
				{ cols: [t.lastUpdatedAt] },
				{ cols: [t.deletedAt] },
			],
		}),
	],
);
