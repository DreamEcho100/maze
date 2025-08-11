import { buildLocaleKeyFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: userLocaleKeyFkExtraConfig, fkCol: userLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "userLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => requirePF("#schema/user/locale/schema.js").userLocale,
		// getTable: async () => (await import("#schema/user/locale/schema.js")).userLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
