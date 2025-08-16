import { buildLocaleKeyFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: localeKeyFkExtraConfig, fkCol: localeKeyFkCol } =
	buildLocaleKeyFkUtils({
		cacheKey: "locale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		getTable: () =>
			requirePF("#schema/general/locale-and-currency/schema.js").locale,
		// getTable: async () => (await import("#schema/general/locale-and-currency/schema.js")).locale,
		getRefColumns: (table) => [table.key],
		defaultOnDelete: "cascade",
	});
