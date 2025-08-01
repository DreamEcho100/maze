import { buildFkUtils } from "#db/schema/_utils/build-fk-utils.js";

export const { extraConfig: seoMetadataIdExtraConfig, fkCol: seoMetadataIdFkCol } = buildFkUtils({
	cacheKey: "seoMetadata",
	defaultColKey: "seoMetadataId",
	defaultColName: "seo_metadata_id",
	getTable: () => require("#db/schema/general/seo/schema.js").seoMetadata,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "set null",
});
