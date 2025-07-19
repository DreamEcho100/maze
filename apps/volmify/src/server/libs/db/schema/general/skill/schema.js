import { boolean, index, text, uniqueIndex } from "drizzle-orm/pg-core";
import {
	createdAt,
	getLocaleKey,
	idCol,
	idFkCol,
	slug,
	table,
	updatedAt,
} from "../../_utils/helpers";
import { org } from "../../org/schema";
import { locale } from "../locale-currency-market/schema";
import { seoMetadata } from "../seo/schema";

const skillTableName = "skill";
// Q: Should the skill table be scoped to the org level or platform-wide to enable cross-org skill tracking and recommendations?
/**
 * SKILLS TAXONOMY - Platform-Wide Skill Management
 */
export const skill = table(
	skillTableName,
	{
		id: idCol.notNull(),
		/**
		 * @skillTaxonomy Standardized skill identifier for marketplace consistency
		 * @analyticsFoundation Enables cross-org skill tracking and recommendations
		 */
		slug: slug.notNull(), // "react", "python", "data-analysis"
		name: text("name").notNull(),

		/**
		 * @skillHierarchy Parent skill for hierarchical skill org
		 * @marketplaceNavigation Enables nested skill browsing (Programming → JavaScript → React)
		 */
		// @ts-ignore
		parentSkillId: idFkCol("parent_skill_id"),
		// Note: Self reference foreign key break relational query types
		// So it will be defined on the callback bellow
		// .references(() => /** @type {any}*/ (skill).id),

		/**
		 * @skillCategorization Skill domain for marketplace org
		 * @platformAnalytics Enables skill trend analysis across orgs
		 */
		category: text("category"), // "programming", "design", "business", "data"

		/**
		 * @platformManagement Global skill approval status for marketplace quality
		 * @qualityControl Prevents skill taxonomy fragmentation across orgs
		 */
		approvedAt: boolean("approved_at").default(false),

		appliedByOrgId: idFkCol("applied_by_org_id").references(() => org.id),

		createdByOrganizationId: idFkCol("created_by_org_id")
			.references(() => org.id)
			.notNull(),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex(`uq_${skillTableName}_applied_by_org_slug`).on(t.appliedByOrgId, t.slug),
		index(`idx_${skillTableName}_category`).on(t.category),
		index(`idx_${skillTableName}_parent_skill_id`).on(t.parentSkillId),
		index(`idx_${skillTableName}_applied_by_org_id`).on(t.appliedByOrgId),
		index(`idx_${skillTableName}_approved_at`).on(t.approvedAt),
		index(`idx_${skillTableName}_created_at`).on(t.createdAt),
		index(`idx_${skillTableName}_updated_at`).on(t.updatedAt),
		index(`idx_${skillTableName}_creator_org`).on(t.createdByOrganizationId),
	],
);

const skillI18nTableName = `${skillTableName}_i18n`;
export const skillI18n = table(
	skillI18nTableName,
	{
		id: idCol.notNull(),
		skillId: idFkCol("skill_id")
			.references(() => skill.id)
			.notNull(),
		localeKey: getLocaleKey("locale_key")
			.notNull()
			.references(() => locale.key, { onDelete: "cascade" }),
		// isDefault: boolean("is_default").default(false),

		name: text("name").notNull(),
		description: text("description"),

		seoMetadataId: idFkCol("seo_metadata_id")
			.references(() => seoMetadata.id)
			.notNull(),

		createdAt,
		updatedAt,
	},
	(t) => [
		uniqueIndex(`uq_${skillI18nTableName}`).on(t.skillId, t.localeKey),
		// uniqueIndex(`uq_${skillI18nTableName}_default`)
		// 	.on(t.skillId, t.isDefault)
		// 	.where(eq(t.isDefault, true)),
		index(`idx_${skillI18nTableName}_skill`).on(t.skillId),
		index(`idx_${skillI18nTableName}_name`).on(t.name),
		index(`idx_${skillI18nTableName}_description`).on(t.description),
		index(`idx_${skillI18nTableName}_created_at`).on(t.createdAt),
		index(`idx_${skillI18nTableName}_updated_at`).on(t.updatedAt),
	],
);
