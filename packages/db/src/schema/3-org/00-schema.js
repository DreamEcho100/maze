// ## org

import { jsonb, varchar } from "drizzle-orm/pg-core";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../_utils/helpers.js";
import { table } from "../_utils/tables.js";
import { user } from "../2-user/00-schema.js";
import { orgTableName } from "./_utils/index.js";

const orgMetadataJsonb = jsonb("metadata");

/**
 * Org Context Boundary
 *
 * @abacRole Root Scope for Multi-Tenant Access Control
 * Serves as the foundational boundary for all access control, configuration, and content ownership.
 *
 * @businessLogic
 * Represents a company, institution, or customer account in a SaaS context.
 * Each org has isolated content, users, permission groups, and market settings.
 */
export const org = table(
	orgTableName,
	{
		id: textCols.idPk().notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
		deletedAt: temporalCols.audit.deletedAt(),
		/**
		 * Creator becomes the first `admin` and is granted full permissions.
		 * Enables automatic role provisioning during onboarding.
		 */
		createdById: textCols
			.idFk("created_by_id")
			// .references(() => user.id)
			.notNull(),

		// TODO: owner connection

		/**
		 * Unique human-readable identifier (e.g., "Acme Inc.")
		 * Used in dashboards, invitations, and billing.
		 */
		name: textCols.name().notNull(),

		/**
		 * Unique slug used in URLs and subdomain routing.
		 * E.g., `acme` → acme.yourdomain.com or /org/acme
		 */
		slug: textCols.slug().notNull(),

		logo: varchar("logo", { length: 2096 }),

		/** Arbitrary JSON for custom org-specific metadata, preferences, etc. */
		metadata: /** @type {ReturnType<typeof orgMetadataJsonb.$type<Record<string, any>>>} */ (
			orgMetadataJsonb
		),
	},
	(table) => [
		...multiForeignKeys({
			tName: orgTableName,
			indexAll: true,
			fkGroups: [
				{
					cols: [table.createdById],
					foreignColumns: [user.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({ tName: orgTableName, cols: [table.slug] }),
		uniqueIndex({ tName: orgTableName, cols: [table.name] }),
		...multiIndexes({
			tName: orgTableName,
			colsGrps: [
				{ cols: [table.createdAt] },
				{ cols: [table.lastUpdatedAt] },
				{ cols: [table.deletedAt] },
				{ cols: [table.name] },
				{ cols: [table.slug] },
			],
		}),
	],
);

// -- org
