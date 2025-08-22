import { buildFkUtils } from "../../_utils/build-fk-utils.js";
import { seoMetadata } from "../00-schema.js";

export const { extraConfig: seoMetadataIdFkExtraConfig, fkCol: seoMetadataIdFkCol } = buildFkUtils({
	cacheKey: "seoMetadata",
	defaultColKey: "seoMetadataId",
	defaultColName: "seo_metadata_id",
	table: seoMetadata,
	// getTable: async () => (await import("#schema/general/seo/schema.js")).seoMetadata,
	getRefColumns: (table) => [table.id],
	defaultOnDelete: "set null",
});
