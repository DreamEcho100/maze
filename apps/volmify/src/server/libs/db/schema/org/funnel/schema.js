import { eq } from "drizzle-orm";
import { boolean, index, primaryKey, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createdAt, deletedAt, idCol, idFkCol, slug, table, updatedAt } from "../../_utils/helpers";
import { seoMetadata } from "../../general/seo/schema";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";
import { orgRegion } from "../locale-region/schema";
import { org } from "../schema";

const orgFunnelTableName = `${orgTableName}_funnel`;
/**
 * @domain Funnels / Market
 * @description A funnel represents a storefront, landing site, or market-specific experience.
 * Funnels can be tied to multiple regions and locale, but are owned by a single tenant.
 */
export const orgFunnel = table(orgFunnelTableName, {
	id: idCol.notNull(),
	orgId: idFkCol(`${orgTableName}_id`)
		.references(() => org.id)
		.notNull(),
	slug: slug.notNull(),
	// defaultLocaleKey: getLocaleKey("default_locale_key")
	// 	.references(() => locale.key)
	// 	.notNull(),
	createdAt,
	updatedAt,
	deletedAt,
});

const orgFunnelI18nTableName = `${orgFunnelTableName}_i18n`;
/**
 * @domain Funnels → Locales
 * @description Join table to assign available locale per funnel.
 */
export const orgFunnelI18n = buildOrgI18nTable(orgFunnelI18nTableName)(
	{
		funnelId: idFkCol("funnel_id")
			.references(() => orgFunnel.id)
			.notNull(),
		seoMetadataId: idFkCol("seo_metadata_id")
			.references(() => seoMetadata.id)
			.notNull(),
		name: varchar("name", { length: 128 }).notNull(),
		description: varchar("description", { length: 256 }),
	},
	{
		fkKey: "funnelId",
		extraConfig: (t, tableName) => [
			index(`idx_${tableName}_name`).on(t.name),
			index(`idx_${tableName}_funnel_id`).on(t.funnelId),
		],
	},
);

const orgLocaleTableName = `${orgTableName}_locale`;
/**
 * @domain Funnels → Regions
 * @description Join table for multi-region support in funnels.
 */
export const orgFunnelRegion = table(
	orgLocaleTableName,
	{
		funnelId: idFkCol("funnel_id")
			.references(() => orgFunnel.id)
			.notNull(),
		regionId: idFkCol("region_id")
			.references(() => orgRegion.id)
			.notNull(),
		createdAt,
	},
	(t) => [
		primaryKey({ columns: [t.funnelId, t.regionId] }),
		index(`idx_${orgLocaleTableName}_created_at`).on(t.createdAt),
	],
);

const orgFunnelDomainTableName = `${orgTableName}_funnel_domain`;
/**
 * @domain Domains & Routing
 * @description Mapping between web domains and funnels. Supports auto-generated subdomains, custom domains, redirects, and localized region behavior.
 */
export const orgFunnelDomain = table(
	orgFunnelDomainTableName,
	{
		id: idCol.notNull(),
		funnelId: idFkCol("funnel_id")
			.references(() => orgFunnel.id)
			.notNull(),

		/**
		 * @seoHost The actual domain or subdomain that should route to this funnel.
		 */
		domain: varchar("domain", { length: 255 }).notNull(),

		isCustomDomain: boolean("is_custom_domain").default(false).notNull(),

		/**
		 * @routingFlag If true, domain is a subdomain (e.g. `store.example.com`). False for apex domains.
		 */
		isSubdomain: boolean("is_subdomain").default(true).notNull(),

		/**
		 * @seoCanonical If true, this domain is the canonical SEO origin and other domains redirect to it.
		 */
		isCanonical: boolean("is_canonical").default(false).notNull(),

		/**
		 * @dnsControl Whether DNS is managed by the system or by user.
		 */
		isManagedDns: boolean("is_managed_dns").default(true).notNull(),

		regionId: idFkCol("region_id").references(() => orgRegion.id),
		// getLocaleKey: getLocaleKey("locale_key").references(() => locale.key),

		IsSslEnabled: boolean("ssl_enabled").default(false).notNull(),

		/**
		 * @dnsVerification Indicates successful TXT record or CNAME verification.
		 */
		dnsVerified: boolean("dns_verified").default(false).notNull(),

		/**
		 * @dnsToken A random DNS token to verify ownership.
		 */
		verificationToken: varchar("verification_token", { length: 64 }),

		isPreview: boolean("is_preview").default(false).notNull(),

		/**
		 * @errorPage Whether this domain has a custom 404 page.
		 */
		hasCustom404: boolean("has_custom_404").default(false).notNull(),

		createdAt,
		updatedAt,
		deletedAt,
	},
	(t) => [
		primaryKey({ columns: [t.funnelId, t.regionId] }),
		uniqueIndex(`uq_${orgFunnelDomainTableName}_domain`).on(t.domain).where(eq(t.deletedAt, null)),
		index(`idx_${orgFunnelDomainTableName}_funnel_id`).on(t.funnelId),
		index(`idx_${orgFunnelDomainTableName}_region_id`).on(t.regionId),
		// index(`idx_${orgFunnelDomainTableName}_locale_key`).on(t.getLocaleKey),
		index(`idx_${orgFunnelDomainTableName}_is_custom_domain`).on(t.isCustomDomain),
		index(`idx_${orgFunnelDomainTableName}_is_subdomain`).on(t.isSubdomain),
		index(`idx_${orgFunnelDomainTableName}_is_canonical`).on(t.isCanonical),
		index(`idx_${orgFunnelDomainTableName}_is_managed_dns`).on(t.isManagedDns),
		index(`idx_${orgFunnelDomainTableName}_is_ssl_enabled`).on(t.IsSslEnabled),
		index(`idx_${orgFunnelDomainTableName}_dns_verified`).on(t.dnsVerified),
		index(`idx_${orgFunnelDomainTableName}_is_preview`).on(t.isPreview),
		index(`idx_${orgFunnelDomainTableName}_has_custom_404`).on(t.hasCustom404),
		index(`idx_${orgFunnelDomainTableName}_created_at`).on(t.createdAt),
		index(`idx_${orgFunnelDomainTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${orgFunnelDomainTableName}_deleted_at`).on(t.deletedAt),
	],
);
