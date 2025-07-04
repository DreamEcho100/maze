import { relations } from "drizzle-orm";
import { organization } from "../organization/schema.js";
import {
	seoAlternateUrl,
	seoCustomMeta,
	seoMetadata,
	seoOpenGraph,
	seoStructuredData,
	seoTwitterCard,
} from "./schema.js";

// -------------------------------------
// SEO METADATA RELATIONS
// -------------------------------------
export const seoMetadataRelations = relations(seoMetadata, ({ one, many }) => ({
	// Many-to-one: SEO belongs to an organization
	organization: one(organization, {
		fields: [seoMetadata.organizationId],
		references: [organization.id],
	}),

	// One-to-one: SEO can have one Open Graph configuration
	openGraph: one(seoOpenGraph, {
		fields: [seoMetadata.id],
		references: [seoOpenGraph.seoMetadataId],
	}),

	// One-to-one: SEO can have one Twitter Card configuration
	twitterCard: one(seoTwitterCard, {
		fields: [seoMetadata.id],
		references: [seoTwitterCard.seoMetadataId],
	}),

	// One-to-many: SEO can have multiple structured data entries
	structuredData: many(seoStructuredData),

	// One-to-many: SEO can have multiple alternate URLs (for different locales)
	alternateUrls: many(seoAlternateUrl),

	// One-to-many: SEO can have multiple custom meta tags
	customMeta: many(seoCustomMeta),
}));

// -------------------------------------
// ORGANIZATION RELATIONS (Add SEO relation)
// -------------------------------------
export const organizationSeoRelations = relations(organization, ({ many }) => ({
	// One-to-many: Organization can have multiple SEO metadata entries
	seoMetadata: many(seoMetadata),
}));

// -------------------------------------
// OPEN GRAPH RELATIONS
// -------------------------------------
export const seoOpenGraphRelations = relations(seoOpenGraph, ({ one }) => ({
	// Many-to-one: Open Graph belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoOpenGraph.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// TWITTER CARD RELATIONS
// -------------------------------------
export const seoTwitterCardRelations = relations(seoTwitterCard, ({ one }) => ({
	// Many-to-one: Twitter Card belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoTwitterCard.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// STRUCTURED DATA RELATIONS
// -------------------------------------
export const seoStructuredDataRelations = relations(seoStructuredData, ({ one }) => ({
	// Many-to-one: Structured data belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoStructuredData.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// ALTERNATE URL RELATIONS
// -------------------------------------
export const seoAlternateUrlRelations = relations(seoAlternateUrl, ({ one }) => ({
	// Many-to-one: Alternate URL belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoAlternateUrl.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// CUSTOM META RELATIONS
// -------------------------------------
export const seoCustomMetaRelations = relations(seoCustomMeta, ({ one }) => ({
	// Many-to-one: Custom meta belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoCustomMeta.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
