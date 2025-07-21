import { eq } from "drizzle-orm";
import { index, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers";
import { userTableName } from "../_utils/helpers";

const userLocaleTableName = `${userTableName}_locale`;
export const userLocale = table(
	userLocaleTableName,
	{
		id: textCols.id().notNull(),
		userId: sharedCols.userIdFk().notNull(),
		localeKey: sharedCols.localeKeyFk("locale_key").notNull(),

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
	(t) => [
		uniqueIndex(`uq_${userLocaleTableName}`).on(t.userId, t.localeKey),
		uniqueIndex(`uq_${userLocaleTableName}_default`)
			.on(t.userId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index(`idx_${userLocaleTableName}_is_active`).on(t.isActive),
		// index(`idx_${userLocaleTableName}_priority`).on(t.priority),
	],
);
