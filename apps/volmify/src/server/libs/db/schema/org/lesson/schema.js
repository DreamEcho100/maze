import { index, pgEnum, text } from "drizzle-orm/pg-core";
import { createdAt, fk, id, table } from "../../_utils/helpers";
import { seoMetadata } from "../../general/seo/schema";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";
import { org } from "../schema";

// import { user } from "../.

const orgLessonTableName = `${orgTableName}_lesson`;
export const orgLessonTypeEnum = pgEnum(`${orgLessonTableName}_type`, [
	"video",
	"text",
	"quiz",
	"assignment",
	// "file",
	// What're other valid types that will help in this project and used on other LMS systems?
]);
export const orgLesson = table(
	orgLessonTableName,
	{
		id: id.notNull(),
		orgId: fk("org_id")
			.references(() => org.id)
			.notNull(),
		type: orgLessonTypeEnum("type").notNull(),
		createdAt,
	},
	(t) => [
		index(`idx_${orgLessonTableName}_org_id`).on(t.orgId),
		index(`idx_${orgLessonTableName}_type`).on(t.type),
		index(`idx_${orgLessonTableName}_created_at`).on(t.createdAt),
	],
);

const orgLessonI18nTableName = `${orgLessonTableName}_i18n`;
export const orgLessonI18n = buildOrgI18nTable(orgLessonI18nTableName)(
	{
		lessonId: fk("lesson_id").references(() => orgLesson.id), // Does a lesson even need SEO metadata? what would be the use case? pros and cons?
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id),
		// .notNull(),
		title: text("title").notNull(),
		description: text("description"),
	},
	{
		fkKey: "lessonId",
		extraConfig: (t, tName) => [
			index(`idx_${tName}_lesson_id`).on(t.lessonId),
			index(`idx_${tName}_title`).on(t.title),
		],
	},
);

// IMP: `quiz` and `assignment` results tables will be handled later after the lesson types are finalized
// IMP: The `quiz` and `assignment` will be connected to an `assessment` table that will handle the different types of assessments in A CTI way
