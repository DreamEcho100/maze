import { relations } from "drizzle-orm";
import { orgLesson, orgLessonI18n } from "./schema";

export const orgLessonRelations = relations(orgLesson, ({ many, one }) => ({
	// 	/**
	// 	 * @orgBoundary Org owning this lesson content
	// 	 * @contentManagement Enables orgal lesson libraries and reusability
	// 	 */
	// 	org: one(org, {
	// 		fields: [orgLesson.orgId],
	// 		references: [org.id],
	// 	}),
	// 	/**
	// 	 * @courseUsage Courses using this lesson content
	// 	 * @contentReusability Enables lesson sharing across multiple courses
	// 	 */
	// 	courseUsages: many(orgProductCourseModuleSectionLesson),
	// 	/**
	// 	 * @internationalization Multi-language lesson content and metadata
	// 	 * @globalContent Localized lesson delivery for international students
	// 	 */
	// 	translations: many(orgLessonI18n),
}));
export const orgLessonI18nRelations = relations(orgLessonI18n, ({ many, one }) => ({
	// 		/**
	// 		 * @localizationTarget Lesson being translated for international delivery
	// 		 * @businessContext Enables localized lesson content and global course delivery
	// 		 */
	// 		lesson: one(orgLesson, {
	// 			fields: [orgLessonI18n.lessonId],
	// 			references: [orgLesson.id],
	// 		}),
	// 		seoMetadata: one(seoMetadata, {
	// 			fields: [orgLessonI18n.seoMetadataId],
	// 			references: [seoMetadata.id],
	// 		}),
	// 		locale: one(orgLocale, {
	// 			fields: [orgLessonI18n.localeKey],
	// 			references: [orgLocale.localeKey],
	// 		}),
}));
