import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes } from "../../_utils/helpers.js";
import { table, tEnum } from "../../_utils/tables.js";
import { seoMetadataIdFkCol, seoMetadataIdFkExtraConfig } from "../../0-seo/0_utils/index.js";
import { orgTableName } from "../_utils/index.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../0_utils/index.js";
import { buildOrgI18nTable } from "../0-locale/0_utils/index.js";

// ## org -> lesson
const orgLessonTableName = `${orgTableName}_lesson`;
export const orgLessonTypeEnum = tEnum(`${orgLessonTableName}_type`, [
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
// -- org -> lesson
