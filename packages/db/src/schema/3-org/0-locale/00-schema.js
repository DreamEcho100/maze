import { eq, sql } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { localeKeyFkCol, localeKeyFkExtraConfig } from "../../0-local/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";

const orgLocaleTableName = `${orgTableName}_locale`;
export const orgLocale = table(
	orgLocaleTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		localeKey: localeKeyFkCol().notNull(),

		/**
		 * @orgalControl Org-specific locale configuration
		 * @businessRule Orgs control their supported languages
		 */
		isDefault: sharedCols.isDefault(),
		isActive: sharedCols.isActive(),

		// /**
		//  * @marketStrategy Org's market positioning for this locale
		//  * @businessIntelligence Locale-specific business strategy tracking
		//  */
		// priority: integer("priority").default(100), // Lower = higher priority
		// marketStatus: text("market_status"), // "primary", "expansion", "test"

		/**
		 * @localizationStrategy Content localization preferences
		 * @businessRule How org handles content in this locale
		 */
		// TODO: convert to enum, ex: "full_translation", "partial", "auto_translate", other
		contentStrategy: text("content_strategy"), // "full_translation", "partial", "auto_translate"

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// uniqueIndex(`uq_${orgLocaleTableName}`).on(t.orgId, t.localeKey),
		// uniqueIndex(`uq_${orgLocaleTableName}_default`)
		// 	.on(t.orgId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${orgLocaleTableName}_is_active`).on(t.isActive),
		// // index(`idx_${orgLocaleTableName}_priority`).on(t.priority),
		...orgIdFkExtraConfig({
			tName: orgLocaleTableName,
			cols,
		}),
		...localeKeyFkExtraConfig({
			tName: orgLocaleTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [cols.orgId, cols.localeKey],
		}),
		uniqueIndex({
			tName: orgLocaleTableName,
			cols: [cols.orgId, cols.isDefault],
		}).where(eq(cols.isDefault, sql`TRUE`)),
		...multiIndexes({
			tName: orgLocaleTableName,
			colsGrps: [
				{ cols: [cols.isActive] },
				// { cols: [cols.priority] }, // TODO: Uncomment when priority is implemented
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
