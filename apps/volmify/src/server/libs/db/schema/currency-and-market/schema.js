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

import { createdAt, deletedAt, id, name, slug, table, updatedAt } from "../_utils/helpers.js";
import { seoMetadata } from "../seo/schema.js";

/**
 * @fileoverview Currency and Market Schema - Global Commerce Foundation
 *
 * @architecture Internationalization Layer + Template Pattern
 * Provides the foundational data structures for multi-currency, multi-market global commerce.
 * Implements template-based market configuration that organizations can adopt or customize,
 * enabling rapid international expansion while maintaining consistency.
 *
 * @designPattern Template + Reference Data
 * - Reference Data: Currencies and countries as immutable system data
 * - Template Pattern: Market templates provide configuration blueprints for organizations
 * - Exchange Rate Management: Historical rate tracking with multiple sources
 *
 * @integrationPoints
 * - Organization Markets: Organizations adopt or customize market templates
 * - Pricing System: Currency context for product pricing and billing
 * - Localization: Geographic and linguistic context for content delivery
 * - Tax Calculation: Country-specific VAT rates and regional compliance
 * - Financial Reporting: Multi-currency accounting and exchange rate handling
 *
 * @businessValue
 * Enables platform to support global organizations with complex international requirements
 * while providing simple onboarding through market templates. Supports real-time currency
 * conversion, regional pricing strategies, and compliance with local financial regulations.
 *
 * @scalingDesign
 * - Market Templates: Pre-configured for rapid organization international expansion
 * - Exchange Rates: Historical tracking supports financial reporting and auditing
 * - Country Data: Comprehensive geographic data enables location-based features
 */

/**
 * Currency Reference Data
 *
 * @businessLogic Core monetary system foundation following ISO 4217 standards
 * Provides standardized currency definitions that enable consistent financial
 * operations across all platform transactions and reporting.
 *
 * @immutableData
 * Currency data is treated as reference data - changes are rare and require
 * careful consideration due to impact on financial calculations and reporting.
 *
 * @integrationContext
 * Referenced by pricing, billing, accounting, and reporting systems throughout
 * the platform. Supports multi-currency organizations and international commerce.
 *
 * @complianceStandard ISO 4217 compliance ensures compatibility with banking
 * systems, payment processors, and financial reporting standards globally.
 */
export const currency = table(
	"currency",
	{
		/**
		 * @businessRule ISO 4217 alpha-3 currency code (e.g., "USD", "EUR")
		 * @immutable Primary identifier used throughout financial systems
		 * @complianceStandard Required for payment processor and banking integration
		 */
		code: text("code").primaryKey(), // ISO 4217 code
		name: name.notNull(),
		symbol: text("symbol").notNull(),
		/**
		 * @complianceStandard ISO 4217 numeric code for international banking
		 * @integrationContext Used by payment processors and banking APIs
		 */
		numericCode: text("numeric_code"), // ISO 4217 numeric code (e.g., "840" for USD)
		/**
		 * @financialPrecision Decimal places for currency calculations
		 * @businessRule Essential for accurate monetary calculations and display
		 */
		minorUnit: integer("minor_unit").notNull().default(2), // decimal places
		isActive: boolean("is_active").default(true),
		deletedAt,
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_currency_name").on(t.name),
		index("idx_currency_symbol").on(t.symbol),
		index("idx_currency_active").on(t.isActive),
		index("idx_currency_deleted_at").on(t.deletedAt),
		index("idx_currency_created_at").on(t.createdAt),
		index("idx_currency_updated_at").on(t.updatedAt),
	],
);

/**
 * Country Geographic and Regulatory Data
 *
 * @businessLogic Comprehensive country data supporting localization, taxation,
 * and regulatory compliance for global organizations operating across jurisdictions.
 *
 * @localizationFoundation
 * Provides geographic, linguistic, and cultural context for content delivery,
 * user experience customization, and regional business operations.
 *
 * @taxationContext
 * VAT rates and regulatory information enable automated tax calculation
 * and compliance reporting for international commerce operations.
 *
 * @integrationContext
 * Used by pricing systems, shipping calculations, compliance reporting,
 * content localization, and user experience personalization.
 */
export const country = table(
	"country",
	{
		id,
		/**
		 * @complianceStandard ISO 3166-1 alpha-2 for international compatibility
		 * @integrationContext Used by payment processors, shipping APIs, tax systems
		 */
		isoCode: text("iso_code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
		isoCode3: text("iso_code_3").notNull().unique(), // ISO 3166-1 alpha-3 (e.g., "USA")
		numericCode: text("numeric_code").notNull(), // ISO 3166-1 numeric
		name: name.notNull(),
		nativeName: text("native_name"),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		/**
		 * @localizationContext Default locale for country-specific content delivery
		 * @businessRule Fallback locale when user preference is unavailable
		 */
		defaultLocale: text("default_locale").notNull(),
		flagEmoji: text("flag_emoji"),
		phoneCode: text("phone_code"), // e.g., "+1"
		continent: text("continent"),
		region: text("region"),
		subregion: text("subregion"),
		capital: text("capital"),
		/**
		 * @localizationSupport Supported languages for content localization
		 * @businessRule Influences content translation and UI language options
		 */
		languages: text("languages").array(), // ISO 639-1 codes
		timezones: text("timezones").array(),
		isActive: boolean("is_active").default(true),
		/**
		 * @taxationContext Standard VAT rate for automated tax calculations
		 * @complianceRequirement Required for accurate pricing and tax reporting
		 */
		vatRate: decimal("vat_rate", { precision: 5, scale: 4 }), // for tax calculations
		createdAt,
		updatedAt,
	},
	(t) => [
		index("idx_country_iso").on(t.isoCode),
		index("idx_country_currency").on(t.currencyCode),
		index("idx_country_name").on(t.name),
		index("idx_country_active").on(t.isActive),
		index("idx_country_continent").on(t.continent),
		index("idx_country_region").on(t.region),
	],
);

/**
 * Exchange Rate Historical Tracking
 *
 * @businessLogic Comprehensive exchange rate management with historical tracking
 * for accurate financial reporting, multi-currency pricing, and accounting compliance.
 *
 * @financialAccuracy
 * Time-bounded rates with multiple sources ensure accurate currency conversion
 * for pricing, billing, and financial reporting across different time periods.
 *
 * @auditCompliance
 * Historical rate tracking supports financial auditing requirements and enables
 * reconstruction of financial calculations for any point in time.
 *
 * @integrationContext
 * Used by pricing engines, billing systems, financial reporting, and accounting
 * modules for real-time and historical currency conversions.
 */
export const exchangeRate = table(
	"exchange_rate",
	{
		id,
		baseCurrency: text("base_currency")
			.notNull()
			.references(() => currency.code),
		targetCurrency: text("target_currency")
			.notNull()
			.references(() => currency.code),
		/**
		 * @financialPrecision High precision for accurate financial calculations
		 * @businessRule Precision level supports crypto and traditional currencies
		 */
		rate: decimal("rate", { precision: 16, scale: 8 }).notNull(),
		/**
		 * @auditTrail Rate source tracking for compliance and accuracy verification
		 * @businessRule Multiple sources enable rate validation and fallback strategies
		 */
		source: text("source"), // e.g., "ECB", "manual", "api_provider"
		/**
		 * @temporalAccuracy Time-bounded rates for historical accuracy
		 * @financialCompliance Enables point-in-time financial calculations
		 */
		validFrom: timestamp("valid_from").notNull(),
		validTo: timestamp("valid_to"),
		deletedAt,
		createdAt,
		precision: integer("precision").default(2),
		/**
		 * @businessContext Different rate types for various use cases
		 * @pricingStrategy Enables different rates for retail vs wholesale pricing
		 */
		rateType: text("rate_type"), // mid-market, retail, cash, etc
	},
	(t) => [
		uniqueIndex("uq_exchange_rate_period").on(
			t.baseCurrency,
			t.targetCurrency,
			t.validFrom,
			t.source,
		),
		index("idx_exchange_rate_currencies").on(t.baseCurrency, t.targetCurrency),
		index("idx_exchange_rate_date").on(t.validFrom, t.validTo),
		index("idx_exchange_rate_active_date").on(t.validFrom, t.validTo, t.deletedAt),
		index("idx_exchange_rate_source").on(t.source),
		index("idx_exchange_rate_type").on(t.rateType),
		index("idx_exchange_rate_deleted_at").on(t.deletedAt),
	],
);

/**
 * Market Configuration Templates
 *
 * @businessLogic Pre-configured market templates that organizations can adopt
 * for rapid international expansion with consistent regional settings.
 *
 * @templatePattern
 * Provides standardized market configurations (currency, locale, countries)
 * that organizations can use as-is or customize for their specific needs.
 *
 * @onboardingAcceleration
 * Templates reduce complexity of international setup by providing proven
 * market configurations that organizations can quickly adopt and modify.
 *
 * @integrationContext
 * Referenced by organization markets to inherit template configurations
 * while allowing organization-specific customizations and overrides.
 */
export const marketTemplate = table(
	"market_template",
	{
		id,
		/**
		 * @businessRule Template names should be clear market identifiers
		 * @examples "North America", "European Union", "APAC", "Latin America"
		 */
		name: name.notNull(), // e.g., "Global", "US Market"
		description: text("description"),
		/**
		 * @integrationContext URL-friendly identifier for market-specific routing
		 * @businessRule Used in API endpoints and marketing campaign URLs
		 */
		slug, // for URLs
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		/**
		 * @localizationDefault Primary locale for template-based markets
		 * @businessRule Fallback locale when organization doesn't specify custom locale
		 */
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
 * Market Template Geographic Coverage
 *
 * @businessLogic Defines which countries are included in each market template
 * configuration, enabling precise geographic targeting and compliance.
 *
 * @geographicStrategy
 * Many-to-many relationship allows flexible market definitions that can
 * span multiple countries or enable countries to belong to multiple markets.
 *
 * @defaultCountryPattern
 * Each template has one default country for primary market focus and
 * fallback behavior in pricing and localization decisions.
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
		/**
		 * @businessRule One primary country per market template
		 * @localizationDefault Primary country influences template defaults
		 */
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
 * Market Template Localization
 *
 * @businessLogic Multi-language support for market templates enabling
 * localized market names and descriptions for international organizations.
 *
 * @localizationStrategy
 * Allows market templates to have different names and descriptions
 * for different locales while maintaining consistent underlying configuration.
 *
 * @seoIntegration
 * Optional SEO metadata enables market-specific landing pages and
 * search optimization for region-specific marketing campaigns.
 *
 * @templateInheritance
 * Organizations inheriting templates can override translations while
 * maintaining the core market configuration structure.
 */
export const marketTemplateTranslation = table(
	"market_template_translation",
	{
		id,
		marketTemplateId: text("market_template_id")
			.notNull()
			.references(() => marketTemplate.id, { onDelete: "cascade" }),
		/**
		 * @localizationContext Locale-specific content for international markets
		 * @businessRule Supports region-specific marketing and branding
		 */
		locale: text("locale").notNull(), // e.g., "en-US", "fr-FR"
		/**
		 * @businessRule One default translation per template for fallback
		 * @localizationDefault Used when requested locale is unavailable
		 */
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),

		/**
		 * @seoIntegration Optional SEO optimization for market landing pages
		 * @marketingContext Enables region-specific marketing campaign optimization
		 */
		seoMetadataId: text("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),
	},
	(t) => [
		uniqueIndex("uq_market_template_translation_unique").on(t.marketTemplateId, t.locale),
		uniqueIndex("uq_market_template_translation_default")
			.on(t.marketTemplateId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_market_template_translation_locale").on(t.locale),
	],
);
