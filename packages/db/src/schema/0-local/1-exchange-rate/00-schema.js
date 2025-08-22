// ## locale-and-currency

import { integer, text } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { currencyCodeFkCol } from "../0_utils/index.js";
import { currency } from "../00-schema.js";

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
		baseCurrencyCode: currencyCodeFkCol({
			name: "base_currency_code",
		}).notNull(),
		targetCurrencyCode: currencyCodeFkCol({
			name: "target_currency_code",
		}).notNull(),
		rate: numericCols.exchangeRate.rate().notNull(),
		source: textCols.source(), // e.g., "ECB", "manual"
		validFrom: temporalCols.financial.validFrom().notNull(),
		validTo: temporalCols.financial.validTo(),
		createdAt: temporalCols.audit.createdAt().notNull(),
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

// -- locale-and-currency
