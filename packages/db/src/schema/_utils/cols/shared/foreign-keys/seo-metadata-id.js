import { buildFkUtils } from "#schema/_utils/build-fk-utils.js";
import { requirePF } from "#schema/_utils/require-polly-fill.js";

export const { extraConfig: seoMetadataIdFkExtraConfig, fkCol: seoMetadataIdFkCol } = buildFkUtils({
	cacheKey: "seoMetadata",
	defaultColKey: "seoMetadataId",
	defaultColName: "seo_metadata_id",
	getTable: () => requirePF("#schema/general/seo/schema.js").seoMetadata,
	// getTable: async () => (await import("#schema/general/seo/schema.js")).seoMetadata,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "set null",
});
