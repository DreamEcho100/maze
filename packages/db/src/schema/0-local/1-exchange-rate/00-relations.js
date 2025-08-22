// ## locale-and-currency

import { relations } from "drizzle-orm";
import { currency } from "../00-schema.js";
import { exchangeRate } from "./00-schema.js";

export const exchangeRateRelations = relations(exchangeRate, ({ one }) => ({
	baseCurrency: one(currency, {
		fields: [exchangeRate.baseCurrencyCode],
		references: [currency.code],
		relationName: "base_currency_rates",
	}),
	targetCurrency: one(currency, {
		fields: [exchangeRate.targetCurrencyCode],
		references: [currency.code],
		relationName: "target_currency_rates",
	}),
}));
