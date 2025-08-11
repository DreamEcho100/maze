import { buildLocaleKeyFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: orgLocaleKeyFkExtraConfig, fkCol: orgLocaleKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "orgLocale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () => requirePF("#schema/org/locale-region/schema.js").orgLocale,
		// getTable: async () => (await import("#schema/org/locale-region/schema.js")).orgLocale,
		getRefColumns: (table) => [table.localeKey],
		defaultOnDelete: "cascade",
	});
