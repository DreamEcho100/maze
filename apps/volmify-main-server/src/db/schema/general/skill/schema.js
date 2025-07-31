import { boolean } from "drizzle-orm/pg-core";
import { localeKeyExtraConfig } from "#db/schema/_utils/cols/shared/foreign-keys/locale-key.js";
import {
	seoMetadataIdExtraConfig,
	seoMetadataIdFkCol,
} from "#db/schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "#db/schema/_utils/helpers.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { org } from "../../org/schema";
import { locale } from "../locale-and-currency/schema";

const skillTableName = "skill";
// Q: Should the skill table be scoped to the org level or platform-wide to enable cross-org skill tracking and recommendations?
/**
 * SKILLS TAXONOMY - Platform-Wide Skill Management
 */
export const skill = table(
	skillTableName,
	{
		id: textCols.idPk().notNull(),
		/**
		 * @skillTaxonomy Standardized skill identifier for marketplace consistency
		 * @analyticsFoundation Enables cross-org skill tracking and recommendations
		 */
		slug: textCols.slug().notNull(), // "react", "python", "data-analysis"
		name: textCols.name().notNull(),

		/**
		 * @skillHierarchy Parent skill for hierarchical skill org
		 * @marketplaceNavigation Enables nested skill browsing (Programming → JavaScript → React)
		 */
		// @ts-ignore
		parentSkillId: textCols.idFk("parent_skill_id"),
		// Note: Self reference foreign key break relational query types
		// So it will be defined on the callback bellow
		// .references(() => /** @type {any}*/ (skill).id),

		// /**
		//  * @skillCategorization Skill domain for marketplace org
		//  * @platformAnalytics Enables skill trend analysis across orgs
		//  */
		// category: text("category"), // "programming", "design", "business", "data"

		/**
		 * @platformManagement Global skill approval status for marketplace quality
		 * @qualityControl Prevents skill taxonomy fragmentation across orgs
		 */
		approvedAt: boolean("approved_at").default(false),

		appliedByOrgId: textCols.idFk("applied_by_org_id").references(() => org.id),
		createdByOrgId: textCols
			.idFk("created_by_org_id")
			.references(() => org.id)
			.notNull(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		...multiForeignKeys({
			tName: skillTableName,
			fkGroups: [
				{
					cols: [cols.parentSkillId],
					foreignColumns: [cols.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
				{
					cols: [cols.appliedByOrgId],
					foreignColumns: [org.id],
					afterBuild: (fk) => fk.onDelete("set null"),
				},
				{
					cols: [cols.createdByOrgId],
					foreignColumns: [org.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: skillTableName,
			// Q: Does the order matter here?
			cols: [cols.createdByOrgId, cols.slug],
		}),
		...multiIndexes({
			tName: skillTableName,
			colsGrps: [
				{ cols: [cols.approvedAt] },
				{ cols: [cols.createdAt] },
				{ cols: [cols.lastUpdatedAt] },
			],
		}),
	],
);

const skillI18nTableName = `${skillTableName}_i18n`;
export const skillI18n = table(
	skillI18nTableName,
	{
		id: textCols.idPk().notNull(),
		skillId: textCols
			.idFk("skill_id")
			.references(() => skill.id)
			.notNull(),
		localeKey: textCols
			.localeKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		isDefault: sharedCols.isDefault(),

		name: textCols.name().notNull(),
		description: textCols.shortDescription("description"),

		seoMetadataId: seoMetadataIdFkCol().notNull(),

		createdAt: temporalCols.audit.createdAt(),
		lastUpdatedAt: temporalCols.audit.lastUpdatedAt(),
	},
	(cols) => [
		// uniqueIndex(`uq_${skillI18nTableName}`).on(t.skillId, t.localeKey),
		// // uniqueIndex(`uq_${skillI18nTableName}_default`)
		// // 	.on(t.skillId, t.isDefault)
		// // 	.where(eq(t.isDefault, true)),
		// index(`idx_${skillI18nTableName}_skill`).on(t.skillId),
		// index(`idx_${skillI18nTableName}_name`).on(t.name),
		// index(`idx_${skillI18nTableName}_description`).on(t.description),
		// index(`idx_${skillI18nTableName}_created_at`).on(t.createdAt),
		// index(`idx_${skillI18nTableName}_last_updated_at`).on(t.lastUpdatedAt),
		...localeKeyExtraConfig({
			tName: skillI18nTableName,
			cols,
		}),
		...seoMetadataIdExtraConfig({
			tName: skillI18nTableName,
			cols,
		}),
		...multiForeignKeys({
			tName: skillI18nTableName,
			fkGroups: [
				{
					cols: [cols.skillId],
					foreignColumns: [skill.id],
					afterBuild: (fk) => fk.onDelete("cascade"),
				},
			],
		}),
		uniqueIndex({
			tName: skillI18nTableName,
			cols: [cols.skillId, cols.localeKey],
		}),
	],
);
