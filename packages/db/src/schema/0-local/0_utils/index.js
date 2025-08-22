import { buildCodeFkUtils, buildLocaleKeyFkUtils } from "../../_utils/build-fk-utils.js";
import { currency, locale } from "../00-schema.js";

export const { extraConfig: localeKeyFkExtraConfig, fkCol: localeKeyFkCol } = buildLocaleKeyFkUtils(
	{
		cacheKey: "locale",
		defaultColKey: "localeKey",
		defaultColName: "locale_key",
		table: locale,
		// getTable: async () => (await import("#schema/general/locale-and-currency/schema.js")).locale,
		getRefColumns: (table) => [table.key],
		defaultOnDelete: "cascade",
	},
);

export const { extraConfig: currencyCodeFkExtraConfig, fkCol: currencyCodeFkCol } =
	buildCodeFkUtils({
		cacheKey: "currency",
		defaultColKey: "currencyCode",
		defaultColName: "currency_code",
		table: currency,
		// getTable: async () => (await import("#schema/general/locale-and-currency/schema.js")).currency,
		getRefColumns: (table) => [table.code],
		defaultOnDelete: "cascade",
	});
