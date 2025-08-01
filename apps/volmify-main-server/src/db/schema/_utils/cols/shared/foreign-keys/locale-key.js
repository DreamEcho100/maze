import { buildLocaleKeyFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: localeKeyExtraConfig, fkCol: localeKeyFkCol } = buildLocaleKeyFkUtils({
	cacheKey: "locale",
	defaultColKey: "localeKey",
	defaultColName: "locale_key",
	getTable: () => require("#db/schema/general/locale-and-currency/schema.js").locale,
	getRefColumns: (table) => [table.key],
	defaultOnDelete: "cascade",
});
