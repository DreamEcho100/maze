// ## locale-and-currency

import { relations } from "drizzle-orm";
import { currency } from "../00-schema.js";
import { country } from "./schema.js";

export const countryRelations = relations(country, ({ one }) => ({
	currency: one(currency, {
		fields: [country.currencyCode],
		references: [currency.code],
	}),
	// orgMarketCountries: many(orgMarketCountry),
	// pricingZoneCountries: many(orgPricingZoneCountry),
}));
