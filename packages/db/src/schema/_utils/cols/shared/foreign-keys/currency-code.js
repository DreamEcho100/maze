import { buildCodeFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: currencyCodeFkExtraConfig, fkCol: currencyCodeFkCol } =
	buildCodeFkUtils({
		cacheKey: "currency",
		defaultColKey: "currencyCode",
		defaultColName: "currency_code",
		getTable: () => requirePF("#schema/general/locale-and-currency/schema.js").currency,
		// getTable: async () => (await import("#schema/general/locale-and-currency/schema.js")).currency,
		getRefColumns: (table) => [table.code],
		defaultOnDelete: "cascade",
	});
