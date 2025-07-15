import { relations } from "drizzle-orm";
import { orgLocale, orgRegion } from "../locale-region/schema";
import { org } from "../schema";
import {
	orgFunnel,
	orgFunnelDomain,
	orgFunnelI18n,
	orgFunnelRegion,
} from "./schema";

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
		fields: [orgFunnelI18n.orgLocaleKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgFunnelRegionRelations = relations(
	orgFunnelRegion,
	({ one }) => ({
		funnel: one(orgFunnel, {
			fields: [orgFunnelRegion.funnelId],
			references: [orgFunnel.id],
		}),
		region: one(orgRegion, {
			fields: [orgFunnelRegion.regionId],
			references: [orgRegion.id],
		}),
	}),
);
export const orgFunnelDomainRelations = relations(
	orgFunnelDomain,
	({ one }) => ({
		funnel: one(orgFunnel, {
			fields: [orgFunnelDomain.funnelId],
			references: [orgFunnel.id],
		}),
		region: one(orgRegion, {
			fields: [orgFunnelDomain.regionId],
			references: [orgRegion.id],
		}),
	}),
);
