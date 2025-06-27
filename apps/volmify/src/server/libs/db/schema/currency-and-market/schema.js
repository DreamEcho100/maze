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

export const currency = table(
	"currency",
	{
		code: text("code").primaryKey(), // ISO 4217 code
		name: name.notNull(),
		symbol: text("symbol").notNull(),
		numericCode: text("numeric_code"), // ISO 4217 numeric code (e.g., "840" for USD)
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

// Enhanced country with more details
export const country = table(
	"country",
	{
		id,
		isoCode: text("iso_code").notNull().unique(), // ISO 3166-1 alpha-2 (e.g., "US")
		isoCode3: text("iso_code_3").notNull().unique(), // ISO 3166-1 alpha-3 (e.g., "USA")
		numericCode: text("numeric_code").notNull(), // ISO 3166-1 numeric
		name: name.notNull(),
		nativeName: text("native_name"),
		currencyCode: text("currency_code")
			.notNull()
			.references(() => currency.code),
		defaultLocale: text("default_locale").notNull(),
		flagEmoji: text("flag_emoji"),
		phoneCode: text("phone_code"), // e.g., "+1"
		continent: text("continent"),
		region: text("region"),
		subregion: text("subregion"),
		capital: text("capital"),
		languages: text("languages").array(), // ISO 639-1 codes
		timezones: text("timezones").array(),
		isActive: boolean("is_active").default(true),
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

// Enhanced exchange rates with historical tracking
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
		rate: decimal("rate", { precision: 16, scale: 8 }).notNull(),
		source: text("source"), // e.g., "ECB", "manual", "api_provider"
		validFrom: timestamp("valid_from").notNull(),
		validTo: timestamp("valid_to"),
		deletedAt,
		createdAt,
		precision: integer("precision").default(2),
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

export const marketTemplate = table(
	"market_template",
	{
		id,
		name: name.notNull(), // e.g., "Global", "US Market"
		description: text("description"),
		slug, // for URLs
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

// Market-Country relationship (many-to-many)
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

// Market localization
export const marketTemplateTranslation = table(
	"market_template_translation",
	{
		id,
		marketTemplateId: text("market_template_id")
			.notNull()
			.references(() => marketTemplate.id, { onDelete: "cascade" }),
		locale: text("locale").notNull(), // e.g., "en-US", "fr-FR"
		isDefault: boolean("is_default").default(false),
		name: name.notNull(),
		description: text("description"),
		seoTitle: text("seo_title"),
		seoDescription: text("seo_description"),
	},
	(t) => [
		uniqueIndex("uq_market_template_translation_unique").on(t.marketTemplateId, t.locale),
		uniqueIndex("uq_market_template_translation_default")
			.on(t.marketTemplateId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_market_template_translation_locale").on(t.locale),
	],
);
