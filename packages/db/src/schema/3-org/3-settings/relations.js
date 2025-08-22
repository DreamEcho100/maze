// ## org -> settings
// ### org -> settings -> currency

import { relations } from "drizzle-orm";
import { currency } from "../../0-local/00-schema.js";
import { org } from "../00-schema.js";
import { orgCurrencySettings } from "./schema.js";

/**
 * @currencyContext Org–Currency Association
 * @financialGovernance Tracks preferred billing and payout currencies
 */
export const orgCurrencySettingsRelations = relations(orgCurrencySettings, ({ one }) => ({
	org: one(org, {
		fields: [orgCurrencySettings.orgId],
		references: [org.id],
	}),
	currency: one(currency, {
		fields: [orgCurrencySettings.currencyCode],
		references: [currency.code],
	}),
}));
// --- org -> settings -> currency

// -- org -> settings
