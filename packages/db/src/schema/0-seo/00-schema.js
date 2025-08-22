// ### seo

import { decimal, text } from "drizzle-orm/pg-core";
import { sharedCols } from "../_utils/cols/shared/index.js";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import { multiIndexes } from "../_utils/helpers.js";
import { table, tEnum } from "../_utils/tables.js";
import { seoMetadataTableName } from "./_utils/index.js";

// TODO: revise the the `extraConfig` args

// SEO status for content workflow
export const seoStatusEnum = tEnum(`${seoMetadataTableName}_status`, [
	"draft",
	"review",
	"approved",
	"published",
	"needs_update",
]);

// Change frequency enum for better validation
export const changeFreqEnum = tEnum(`${seoMetadataTableName}_change_freq`, [
	"always",
	"hourly",
	"daily",
	"weekly",
	"monthly",
	"yearly",
	"never",
]);

// Q:
// How it's benificial to store the SEO like this and not just as a json fields?

// -------------------------------------
// MAIN SEO METADATA TABLE (No entityId/entityType)
// -------------------------------------
export const seoMetadata = table(
	seoMetadataTableName,
	{
		id: textCols.idPk().notNull(), // TODO: add a way _(maybe a table and some columns here)_ to link this to an entity (like user profile, org, course, job, etc.)_
		// // Q:
		//  orgIdFkCol(),

		isDefault: sharedCols.isDefault(),

		// SEO workflow status
		status: seoStatusEnum("status").default("draft"),

		// Basic meta tags
		// Core SEO fields (most commonly used)
		title: textCols.title(),
		description: textCols.shortDescription("description"),
		keywords: text("keywords").array(),
		image: text("image"),
		imageAlt: text("image_alt"),
		canonicalUrl: textCols.url("canonical_url"),
		focusKeyword: text("focus_keyword"),

		// Advanced SEO
		robots: text("robots").default("index,follow"),
		priority: decimal("priority", { precision: 2, scale: 1 }).default("0.5"),
		changeFreq: changeFreqEnum("change_freq").default("weekly"),

		// Language targeting
		hreflang: text("hreflang"),

		// The following is commented out as it is not needed for now.
		// // TODO: Make the following fields into a separate table
		// // Performance metrics
		// lastIndexed: timestamp("last_indexed"),
		// clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 2 }),
		// averagePosition: decimal("average_position", { precision: 5, scale: 2 }),
		// impressions: integer("impressions").default(0),
		// clicks: integer("clicks").default(0),
		// seoScore: integer("seo_score"),

		// The following is commented out as it is not needed for now.
		// // TODO: Make the following fields into a separate table
		// // Workflow
		// notes: text("notes"),
		// lastReviewedAt: timestamp("last_reviewed_at"),
		// reviewedBy: text("reviewed_by"),

		createdAt: temporalCols.audit.createdAt().notNull(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// ...orgIdFkExtraConfig({
		// 	tName: seoMetadataTableName,
		// 	cols,
		// }),
		...multiIndexes({
			tName: seoMetadataTableName,
			colsGrps: [
				{ cols: [cols.status] },
				{ cols: [cols.title] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);
