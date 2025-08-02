import { buildCodeFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: currencyCodeFkExtraConfig, fkCol: currencyCodeFkCol } =
	buildCodeFkUtils({
		cacheKey: "currency",
		defaultColKey: "currencyCode",
		defaultColName: "currency_code",
		getTable: () => require("#db/schema/general/locale-and-currency/schema.js").currency,
		getRefColumns: (table) => [table.code],
		defaultOnDelete: "cascade",
	});
