// ## org -> settings

import { eq, sql } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { compositePrimaryKey, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { currencyCodeFkCol, currencyCodeFkExtraConfig } from "../../0-local/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";

// ### org -> settings -> currency
const orgCurrencySettingsTableName = `${orgTableName}_currency_settings`;
/**
 * Org Currency Settings
 *
 * @integrationPoint Market + Billing Configuration
 * Allows org-level currency preferences and rounding strategies.
 */
export const orgCurrencySettings = table(
	orgCurrencySettingsTableName,
	{
		orgId: orgIdFkCol().notNull(),
		currencyCode: currencyCodeFkCol().notNull(),
		isDefault: sharedCols.isDefault(), // Used as default for invoices, display
		displayFormat: textCols.displayFormat(), // "$1,234.56", "1.234,56 €", etc.
		// TODO: convert to enum
		roundingMode: text("rounding_mode").default("round"), // 'round' | 'floor' | 'ceil'
		roundingIncrement: numericCols.exchangeRate.roundingIncrement(), // e.g. 0.01 for cents, 0.1 for tenths
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		compositePrimaryKey({
			tName: orgCurrencySettingsTableName,
			cols: [cols.orgId, cols.currencyCode],
		}),
		...orgIdFkExtraConfig({
			tName: orgCurrencySettingsTableName,
			cols,
		}),
		...currencyCodeFkExtraConfig({
			tName: orgCurrencySettingsTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgCurrencySettingsTableName,
			cols: [cols.orgId, cols.isDefault],
		}).where(eq(cols.isDefault, sql`TRUE`)),
	],
);
// --- org -> settings -> currency

// -- org -> settings
