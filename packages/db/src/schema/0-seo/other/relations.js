// -------------------------------------
// OPEN GRAPH RELATIONS

import { relations } from "drizzle-orm";
import { locale } from "../../0-local/00-schema.js";
import { seoMetadata } from "../00-schema.js";
import {
	seoMetadataAlternateUrl,
	seoMetadataCustomMeta,
	seoMetadataOpenGraph,
	seoMetadataStructuredData,
	seoMetadataTwitterCard,
} from "./schema.js";

// -------------------------------------
export const seoOpenGraphRelations = relations(seoMetadataOpenGraph, ({ one }) => ({
	// Many-to-one: Open Graph belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoMetadataOpenGraph.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// TWITTER CARD RELATIONS
// -------------------------------------
export const seoTwitterCardRelations = relations(seoMetadataTwitterCard, ({ one }) => ({
	// Many-to-one: Twitter Card belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoMetadataTwitterCard.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// STRUCTURED DATA RELATIONS
// -------------------------------------
export const seoStructuredDataRelations = relations(seoMetadataStructuredData, ({ one }) => ({
	// Many-to-one: Structured data belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoMetadataStructuredData.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// ALTERNATE URL RELATIONS
// -------------------------------------
export const seoAlternateUrlRelations = relations(seoMetadataAlternateUrl, ({ one }) => ({
	// Many-to-one: Alternate URL belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoMetadataAlternateUrl.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [seoMetadataAlternateUrl.localeKey],
		references: [locale.key],
	}),
}));

// -------------------------------------
// CUSTOM META RELATIONS
// -------------------------------------
export const seoCustomMetaRelations = relations(seoMetadataCustomMeta, ({ one }) => ({
	// Many-to-one: Custom meta belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoMetadataCustomMeta.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
// --- seo
