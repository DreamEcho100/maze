import { relations } from "drizzle-orm";
import { skill } from "#db/schema/general/skill/schema.js";
import { seoMetadata } from "../../../../general/seo/schema";
import { orgLesson } from "../../../lesson/schema";
import { orgLocale } from "../../../locale-region/schema";
import { orgMember } from "../../../member/schema";
import { orgProduct } from "../../schema";
import {
	// orgLesson,
	// orgLessonI18n,
	orgMemberLearningProfile,
	orgMemberProductCourseChallengeRating,
	orgMemberProductCourseEnrollment,
	orgProductCourse,
	orgProductCourseI18n,
	orgProductCourseModule,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSection,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLesson,
	orgProductCourseModuleSectionLessonI18n,
	orgProductCourseSkill,
	// skill,
	// skillI18n,
} from "./schema";

export const orgProductCourseRelations = relations(orgProductCourse, ({ many, one }) => ({
	product: one(orgProduct, {
		fields: [orgProductCourse.productId],
		references: [orgProduct.id],
	}),
	translations: many(orgProductCourseI18n),
	skills: many(orgProductCourseSkill),
	modules: many(orgProductCourseModule),
	challengeRatings: many(orgMemberProductCourseChallengeRating),
	enrollments: many(orgMemberProductCourseEnrollment),
}));
export const orgProductCourseI18nRelations = relations(orgProductCourseI18n, ({ one }) => ({
	/**
	 * @localizationTarget Course being translated for international markets
	 * @businessContext Enables region-specific course marketing and positioning
	 */
	course: one(orgProductCourse, {
		fields: [orgProductCourseI18n.courseId],
		references: [orgProductCourse.id],
	}),
	locale: one(orgLocale, {
		fields: [orgProductCourseI18n.localeKey],
		references: [orgLocale.localeKey],
	}),
}));
export const orgProductCourseSkillRelations = relations(orgProductCourseSkill, ({ one }) => ({
	course: one(orgProductCourse, {
		fields: [orgProductCourseSkill.courseId],
		references: [orgProductCourse.id],
	}),

	skill: one(skill, {
		fields: [orgProductCourseSkill.skillId],
		references: [skill.id],
	}),
}));
export const orgMemberProductCourseChallengeRatingRelations = relations(
	orgMemberProductCourseChallengeRating,
	({ one }) => ({
		course: one(orgProductCourse, {
			fields: [orgMemberProductCourseChallengeRating.courseId],
			references: [orgProductCourse.id],
		}),
		member: one(orgMember, {
			fields: [orgMemberProductCourseChallengeRating.memberId],
			references: [orgMember.id],
		}),
	}),
);
export const orgProductCourseModuleRelations = relations(
	orgProductCourseModule,
	({ many, one }) => ({
		course: one(orgProductCourse, {
			fields: [orgProductCourseModule.courseId],
			references: [orgProductCourse.id],
		}),
		sections: many(orgProductCourseModuleSection),
		translations: many(orgProductCourseModuleI18n),
	}),
);
export const orgProductCourseModuleI18nRelations = relations(
	orgProductCourseModuleI18n,
	({ one }) => ({
		module: one(orgProductCourseModule, {
			fields: [orgProductCourseModuleI18n.moduleId],
			references: [orgProductCourseModule.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [orgProductCourseModuleI18n.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(orgLocale, {
			fields: [orgProductCourseModuleI18n.localeKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
export const orgProductCourseModuleSectionRelations = relations(
	orgProductCourseModuleSection,
	({ many, one }) => ({
		module: one(orgProductCourseModule, {
			fields: [orgProductCourseModuleSection.moduleId],
			references: [orgProductCourseModule.id],
		}),
		lessons: many(orgProductCourseModuleSectionLesson),
		translations: many(orgProductCourseModuleSectionI18n),
	}),
);
export const orgProductCourseModuleSectionI18nRelations = relations(
	orgProductCourseModuleSectionI18n,
	({ one }) => ({
		section: one(orgProductCourseModuleSection, {
			fields: [orgProductCourseModuleSectionI18n.sectionId], // Fixed field name
			references: [orgProductCourseModuleSection.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [orgProductCourseModuleSectionI18n.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(orgLocale, {
			fields: [orgProductCourseModuleSectionI18n.localeKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
export const orgProductCourseModuleSectionLessonRelations = relations(
	orgProductCourseModuleSectionLesson,
	({ many, one }) => ({
		section: one(orgProductCourseModuleSection, {
			fields: [orgProductCourseModuleSectionLesson.sectionId],
			references: [orgProductCourseModuleSection.id],
		}),
		lesson: one(orgLesson, {
			fields: [orgProductCourseModuleSectionLesson.lessonId],
			references: [orgLesson.id],
		}),
		translations: many(orgProductCourseModuleSectionLessonI18n),
	}),
);
export const orgProductCourseModuleSectionLessonI18nRelations = relations(
	orgProductCourseModuleSectionLessonI18n,
	({ one }) => ({
		sectionLesson: one(orgProductCourseModuleSectionLesson, {
			// Fixed field name
			fields: [orgProductCourseModuleSectionLessonI18n.lessonId], // Fixed field
			references: [orgProductCourseModuleSectionLesson.id],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [orgProductCourseModuleSectionLessonI18n.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(orgLocale, {
			fields: [orgProductCourseModuleSectionLessonI18n.localeKey],
			references: [orgLocale.localeKey],
		}),
	}),
);
export const orgMemberProductCourseEnrollmentRelations = relations(
	orgMemberProductCourseEnrollment,
	({ one }) => ({
		orgMember: one(orgMember, {
			fields: [orgMemberProductCourseEnrollment.memberId],
			references: [orgMember.id],
		}),
		course: one(orgProductCourse, {
			fields: [orgMemberProductCourseEnrollment.courseId],
			references: [orgProductCourse.id],
		}),
	}),
);
export const orgMemberLearningProfileRelations = relations(orgMemberLearningProfile, ({ one }) => ({
	member: one(orgMember, {
		fields: [orgMemberLearningProfile.memberId],
		references: [orgMember.id],
	}),
}));

// // export const productCourseModuleLessonProgressRelations = relations(
// //   productCourseModuleLessonProgress,
// //   ({ one }) => ({
// //     /**
// //      * @progressTarget Specific section lesson being tracked
// //      */
// //     sectionLesson: one(productCourseModuleSectionLesson, { // Fixed relation name
// //       fields: [productCourseModuleLessonProgress.sectionLessonId], // Fixed field name
// //       references: [productCourseModuleSectionLesson.id],
// //     }),

// //     /**
// //      * @studentContext User whose progress is tracked
// //      */
// //     user: one(user, {
// //       fields: [productCourseModuleLessonProgress.userId],
// //       references: [user.id],
// //     }),
// //   }),
// // );
