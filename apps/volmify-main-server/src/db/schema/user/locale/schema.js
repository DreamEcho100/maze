import { eq, sql } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import {
	localeKeyExtraConfig,
	localeKeyFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/locale-key.js";
import {
	userIdExtraConfig,
	userIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/user-id.js";
import { multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { userTableName } from "../_utils/helpers";

const userLocaleTableName = `${userTableName}_locale`;
export const userLocale = table(
	userLocaleTableName,
	{
		id: textCols.idPk().notNull(),
		userId: userIdFkCol().notNull(),
		localeKey: localeKeyFkCol().notNull(),

		/**
		 * @userControl User-specific locale configuration
		 * @businessRule Users control their supported languages
		 */
		isDefault: sharedCols.isDefault(),
		isActive: sharedCols.isActive(),

		/**
		 * @localizationStrategy Content localization preferences
		 * @businessRule How user handles content in this locale
		 */
		// TODO: convert to enum, ex: "full_translation", "partial", "auto_translate", other
		contentStrategy: text("content_strategy"), // "full_translation", "partial", "auto_translate"

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// uniqueIndex(`uq_${userLocaleTableName}`).on(t.userId, t.localeKey),
		// uniqueIndex(`uq_${userLocaleTableName}_default`)
		// 	.on(t.userId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		// index(`idx_${userLocaleTableName}_is_active`).on(t.isActive),
		// // index(`idx_${userLocaleTableName}_priority`).on(t.priority),
		...userIdExtraConfig({
			tName: userLocaleTableName,
			cols,
		}),
		...localeKeyExtraConfig({
			tName: userLocaleTableName,
			cols,
		}),
		uniqueIndex({
			tName: userLocaleTableName,
			cols: [cols.userId, cols.localeKey],
		}),
		uniqueIndex({
			tName: userLocaleTableName,
			cols: [cols.userId, cols.isDefault],
		}).where(eq(cols.isDefault, sql`TRUE`)),
		...multiIndexes({
			tName: userLocaleTableName,
			colsGrps: [
				{ cols: [cols.isActive] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.isDefault] },
			],
		}),
	],
);
