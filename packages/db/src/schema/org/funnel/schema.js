import { isNull } from "drizzle-orm";
import { boolean, varchar } from "drizzle-orm/pg-core";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "#schema/_utils/helpers.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
import { orgRegion } from "../locale-region/schema.js";

const orgFunnelTableName = `${orgTableName}_funnel`;
/**
 * @domain Funnels / Market
 * @description A funnel represents a storefront, landing site, or market-specific experience.
 * Funnels can be tied to multiple regions and locale, but are owned by a single tenant.
 */
export const orgFunnel = table(
	orgFunnelTableName,
	{
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		slug: textCols.slug().notNull(),
		// defaultLocaleKey: getLocaleKey("default_locale_key")
		// 	.references(() => locale.key)
		// 	.notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		// uniqueIndex(`uq_${orgFunnelTableName}_slug`).on(t.slug).where(eq(t.deletedAt, null)),
		// index(`idx_${orgFunnelTableName}_org_id`).on(t.orgId),
		// index(`idx_${orgFunnelTableName}_created_at`).on(t.createdAt),
		// index(`idx_${orgFunnelTableName}_last_updated_at`).on(t.lastUpdatedAt),
		// index(`idx_${orgFunnelTableName}_deleted_at`).on(t.deletedAt),
		...orgIdFkExtraConfig({
			tName: orgFunnelTableName,
			cols,
		}),
		uniqueIndex({
			tName: orgFunnelTableName,
			cols: [cols.orgId, cols.slug],
		}),
		...multiIndexes({
			tName: orgFunnelTableName,
			colsGrps: [
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
			],
		}),
	],
);

/**
 * @domain Funnels → Locales
 * @description Join table to assign available locale per funnel.
 */
export const orgFunnelI18n = buildOrgI18nTable(orgFunnelTableName)(
	{
		funnelId: textCols
			.idFk("funnel_id")
			// .references(() => orgFunnel.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol().notNull(),
		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),
	},
	{
		fkKey: "funnelId",
		extraConfig: (cols, tName) => [
			// index(`idx_${tName}_name`).on(t.name)
			...multiForeignKeys({
				tName: tName,
				fkGroups: [
					{
						cols: [cols.funnelId],
						foreignColumns: [orgFunnel.id],
					},
				],
			}),
			...seoMetadataIdFkExtraConfig({
				tName: tName,
				cols,
			}),
			...multiIndexes({
				tName: tName,
				colsGrps: [{ cols: [cols.name] }],
			}),
		],
	},
);

const orgFunnelRegionName = `${orgTableName}_funnel_region`;
/**
 * @domain Funnels → Regions
 * @description Join table for multi-region support in funnels.
 */
export const orgFunnelRegion = table(
	orgFunnelRegionName,
	{
		funnelId: textCols
			.idFk("funnel_id")
			// .references(() => orgFunnel.id)
			.notNull(),
		regionId: textCols
			.idFk("region_id")
			// .references(() => orgRegion.id)
			.notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		// primaryKey({ columns: [t.funnelId, t.regionId] }),
		// index(`idx_${orgFunnelRegionName}_created_at`).on(t.createdAt),
		compositePrimaryKey({
			tName: orgFunnelRegionName,
			cols: [cols.funnelId, cols.regionId],
		}),
		...multiForeignKeys({
			tName: orgFunnelRegionName,
			fkGroups: [
				{
					cols: [cols.funnelId],
					foreignColumns: [orgFunnel.id],
				},
				{
					cols: [cols.regionId],
					foreignColumns: [orgRegion.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgFunnelRegionName,
			colsGrps: [{ cols: [cols.createdAt] }],
		}),
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
		id: textCols.idPk().notNull(),
		funnelId: textCols
			.idFk("funnel_id")
			// .references(() => orgFunnel.id)
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

		regionId: textCols.idFk("region_id"), // .references(() => orgRegion.id),
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

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
	},
	(cols) => [
		uniqueIndex({
			tName: orgFunnelDomainTableName,
			cols: [cols.funnelId, cols.domain],
		}),
		uniqueIndex({
			tName: orgFunnelDomainTableName,
			cols: [cols.domain],
		}).where(isNull(cols.deletedAt)),
		...multiForeignKeys({
			tName: orgFunnelDomainTableName,
			fkGroups: [
				{
					cols: [cols.funnelId],
					foreignColumns: [orgFunnel.id],
				},
				{
					cols: [cols.regionId],
					foreignColumns: [orgRegion.id],
				},
			],
		}),
		...multiIndexes({
			tName: orgFunnelDomainTableName,
			colsGrps: [
				{ cols: [cols.isCustomDomain] },
				{ cols: [cols.isSubdomain] },
				{ cols: [cols.isCanonical] },
				{ cols: [cols.isManagedDns] },
				{ cols: [cols.IsSslEnabled] },
				{ cols: [cols.dnsVerified] },
				{ cols: [cols.isPreview] },
				{ cols: [cols.hasCustom404] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
				{ cols: [cols.deletedAt] },
				{ cols: [cols.verificationToken] },
			],
		}),
	],
);
