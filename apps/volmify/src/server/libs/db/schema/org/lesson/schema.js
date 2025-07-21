import { index, pgEnum } from "drizzle-orm/pg-core";
import { sharedCols, table, temporalCols, textCols } from "../../_utils/helpers";
import { seoMetadata } from "../../general/seo/schema";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers";

// import { user } from "../.

const orgLessonTableName = `${orgTableName}_lesson`;
export const orgLessonTypeEnum = pgEnum(`${orgLessonTableName}_type`, [
	"video",
	"text",
	"quiz",
	"assignment",
	// "file",           // ✅ File downloads
	// "interactive",    // ✅ Interactive content
	// "live_session",   // ✅ Scheduled live sessions
	// "discussion",     // ✅ Community discussions
	// "project",        // ✅ Hands-on projects
	// "assessment",     // ✅ Formal assessments
]);
export const orgLesson = table(
	orgLessonTableName,
	{
		id: textCols.id().notNull(),
		orgId: sharedCols.orgIdFk().notNull(),
		type: orgLessonTypeEnum("type").notNull(),
		createdAt: temporalCols.audit.createdAt(),
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
		lessonId: textCols.idFk("lesson_id").references(() => orgLesson.id),
		seoMetadataId: textCols.idFk("seo_metadata_id").references(() => seoMetadata.id),
		// .notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
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
// Future: Assessment CTI Architecture
// orgAssessment (base) → orgAssessmentQuiz, orgAssessmentAssignment, orgAssessmentProject
// orgAssessmentResult (base) → orgAssessmentQuizResult, orgAssessmentAssignmentResult
