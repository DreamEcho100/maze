import { relations } from "drizzle-orm";
import { seoMetadata } from "../../0-seo/00-schema.js";
import { orgLocale } from "../0-locale/00-schema.js";
import { orgRegion } from "../3-region/schema.js";
import { org } from "../00-schema.js";
import { orgFunnel, orgFunnelDomain, orgFunnelI18n, orgFunnelRegion } from "./schema.js";

// ## org -> funnel
export const orgFunnelRelations = relations(orgFunnel, ({ many, one }) => ({
	org: one(org, {
		fields: [orgFunnel.orgId],
		references: [org.id],
	}),
	translations: many(orgFunnelI18n),
}));
export const orgFunnelI18nRelations = relations(orgFunnelI18n, ({ one }) => ({
	funnel: one(orgFunnel, {
		fields: [orgFunnelI18n.funnelId],
		references: [orgFunnel.id],
	}),
	orgLocale: one(orgLocale, {
		fields: [orgFunnelI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [orgFunnelI18n.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
export const orgFunnelRegionRelations = relations(orgFunnelRegion, ({ one }) => ({
	funnel: one(orgFunnel, {
		fields: [orgFunnelRegion.funnelId],
		references: [orgFunnel.id],
	}),
	region: one(orgRegion, {
		fields: [orgFunnelRegion.regionId],
		references: [orgRegion.id],
	}),
}));
export const orgFunnelDomainRelations = relations(orgFunnelDomain, ({ one }) => ({
	funnel: one(orgFunnel, {
		fields: [orgFunnelDomain.funnelId],
		references: [orgFunnel.id],
	}),
	region: one(orgRegion, {
		fields: [orgFunnelDomain.regionId],
		references: [orgRegion.id],
	}),
}));
// -- org -> funnel
