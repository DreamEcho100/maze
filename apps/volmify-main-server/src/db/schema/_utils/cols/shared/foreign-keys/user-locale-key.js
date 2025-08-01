import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: userLocaleKeyExtraConfig, fkCol: userLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "userLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => require("#db/schema/user/locale/schema.js").userLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
