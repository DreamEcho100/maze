// ## locale-and-currency

import { text } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiIndexes } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { currencyCodeFkCol } from "../0_utils/index.js";

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
		createdAt: temporalCols.audit.createdAt().notNull(),
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
