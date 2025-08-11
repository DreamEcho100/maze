import { pgEnum } from "drizzle-orm/pg-core";
import { orgIdFkCol, orgIdFkExtraConfig } from "#schema/_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "#schema/_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { multiForeignKeys, multiIndexes } from "#schema/_utils/helpers.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";

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
		id: textCols.idPk().notNull(),
		orgId: orgIdFkCol().notNull(),
		type: orgLessonTypeEnum("type").notNull(),
		createdAt: temporalCols.audit.createdAt().notNull(),
	},
	(cols) => [
		...orgIdFkExtraConfig({
			tName: orgLessonTableName,
			cols,
		}),
		...multiIndexes({
			tName: orgLessonTableName,
			colsGrps: [{ cols: [cols.orgId, cols.type] }, { cols: [cols.orgId, cols.createdAt] }],
		}),
	],
);

export const orgLessonI18n = buildOrgI18nTable(orgLessonTableName)(
	{
		lessonId: textCols
			.idFk("lesson_id")
			// .references(() => orgLesson.id)
			.notNull(),
		seoMetadataId: seoMetadataIdFkCol(), //.references(() => seoMetadata.id),
		// .notNull(),
		title: textCols.title().notNull(),
		description: textCols.description(),
	},
	{
		fkKey: "lessonId",
		extraConfig: (cols, tName) => [
			...seoMetadataIdFkExtraConfig({
				tName,
				cols,
			}),
			...multiForeignKeys({
				tName,
				fkGroups: [
					{
						cols: [cols.lessonId],
						foreignColumns: [orgLesson.id],
						afterBuild: (fk) => fk.onDelete("cascade"),
					},
				],
			}),
			...multiIndexes({ tName, colsGrps: [{ cols: [cols.title] }] }),
		],
	},
);

// IMP: `quiz` and `assignment` results tables will be handled later after the lesson types are finalized
// IMP: The `quiz` and `assignment` will be connected to an `assessment` table that will handle the different types of assessments in A CTI way
// Future: Assessment CTI Architecture
// orgAssessment (base) → orgAssessmentQuiz, orgAssessmentAssignment, orgAssessmentProject
// orgAssessmentResult (base) → orgAssessmentQuizResult, orgAssessmentAssignmentResult
