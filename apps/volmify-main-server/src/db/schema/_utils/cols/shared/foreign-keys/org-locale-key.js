import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: orgLocaleKeyExtraConfig, fkCol: orgLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "orgLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => require("#db/schema/org/locale-region/schema.js").orgLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
