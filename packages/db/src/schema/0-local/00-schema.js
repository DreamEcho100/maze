// ## locale-and-currency

import { boolean, integer } from "drizzle-orm/pg-core";
import { sharedCols } from "../_utils/cols/shared/index.js";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { multiIndexes } from "../_utils/helpers.js";
import { table } from "../_utils/tables.js";

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
		createdAt: temporalCols.audit.createdAt().notNull(),
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
			// TODO: Needs to add a relation to the country table
			// ...multiForeignKeys({
			// 	tName: localeTableName,
			// 	indexAll: true,
			// 	fkGroups: [
			// 		{
			// 			cols: [t.countryCode],
			// 			foreignColumns: [country.isoCode],
			// 			// afterBuild: (fk) => fk.onDelete("cascade"),
			// 		},
			// 	],
			// }),
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
		createdAt: temporalCols.audit.createdAt().notNull(),
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

// -- locale-and-currency
