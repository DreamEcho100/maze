/**
 * @fileoverview Product Course Relations - Educational Content Integration
 *
 * @integrationPattern Course Content + Professional Attribution + Multi-Tenant Learning Management
 * Relations enabling comprehensive educational content delivery with instructor attribution,
 * skill-based learning pathways, and organizational learning management within creator
 * economy workflows and multi-tenant e-commerce platform architecture.
 *
 * @businessContext
 * Educational content relations supporting instructor-led creator economy with sophisticated
 * learning management, progress tracking, and skill attribution for both public course
 * sales and organizational training scenarios within multi-tenant boundaries.
 *
 * @scalabilityContext
 * Relation patterns support multiple instructor types, diverse content structures, and
 * cross-organizational professional development while maintaining organizational boundaries
 * and enabling platform-wide skill tracking and course recommendation systems.
 */

import { relations } from "drizzle-orm";
import { locale } from "../../../../system/locale-currency-market/schema";
import { seoMetadata } from "../../../../system/seo/schema";
import { user } from "../../../../user/schema";
import { org, orgMember } from "../../../schema";
import { product } from "../../schema";
import {
	lesson,
	lessonTranslation,
	productCourse,
	productCourseChallengeRating,
	productCourseEnrollment,
	productCourseModule,
	productCourseModuleSection,
	productCourseModuleSectionLesson,
	productCourseModuleSectionLessonTranslation,
	productCourseModuleSectionTranslation,
	productCourseModuleTranslation,
	productCourseSkill,
	productCourseTranslation,
	skill,
	skillTranslation,
	userLearningProfile,
} from "./schema";

/**
 * Product Course Relations (Educational Content Specialization)
 *
 * @integrationRole Core educational content entity connecting product commerce
 * with learning management and instructor attribution within creator economy
 * @businessRelationships Course creation, skill attribution, module org,
 * student enrollment, and progress tracking for comprehensive learning analytics
 * @scalabilityPattern Supports multiple course types and instructor collaboration
 */
export const productCourseRelations = relations(productCourse, ({ one, many }) => ({
	/**
	 * @ctiReference Course specializes base product for educational content delivery
	 * @businessContext Links course content to product commerce and marketing infrastructure
	 */
	product: one(product, {
		fields: [productCourse.productId],
		references: [product.id],
	}),

	/**
	 * @contentStructure Course modules for hierarchical content org
	 * @learningManagement Enables structured educational content delivery and progress tracking
	 */
	modules: many(productCourseModule),

	/**
	 * @skillMapping Course skill attribution for learning pathway construction
	 * @marketplaceIntelligence Enables skill-based course discovery and recommendations
	 */
	skills: many(productCourseSkill),

	/**
	 * @qualityAssurance Community-driven course quality feedback
	 * @creatorEconomy Instructor feedback for course improvement and credibility
	 */
	challengeRatings: many(productCourseChallengeRating),

	/**
	 * @studentManagement Course enrollment and progress tracking
	 * @organizationalLearning Employee training and development analytics
	 */
	enrollments: many(productCourseEnrollment),

	/**
	 * @internationalization Multi-language course content and marketing
	 * @globalMarketplace Localized course positioning and discovery
	 */
	translations: many(productCourseTranslation),
}));

/**
 * Product Course Translation Relations (Localized Course Content)
 *
 * @integrationRole Internationalization support for course marketing and content
 * @businessRelationships Multi-language course positioning and regional marketing
 * @scalabilityPattern Supports global marketplace expansion and localized content
 */
export const productCourseTranslationRelations = relations(productCourseTranslation, ({ one }) => ({
	/**
	 * @localizationTarget Course being translated for international markets
	 * @businessContext Enables region-specific course marketing and positioning
	 */
	course: one(productCourse, {
		fields: [productCourseTranslation.courseId],
		references: [productCourse.id],
	}),

	seoMetadata: one(seoMetadata, {
		fields: [productCourseTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [productCourseTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * Skill Relations (Platform-Wide Skill Taxonomy)
 *
 * @integrationRole Global skill management for course attribution and user tracking
 * @businessRelationships Skill hierarchy, course mapping, and marketplace intelligence
 * @scalabilityPattern Supports skill taxonomy growth and cross-organizational standardization
 */
export const skillRelations = relations(skill, ({ one, many }) => ({
	/**
	 * @skillHierarchy Parent skill for nested skill org
	 * @marketplaceNavigation Enables hierarchical skill browsing and filtering
	 */
	parentSkill: one(skill, {
		fields: [skill.parentSkillId],
		references: [skill.id],
		relationName: "skillHierarchy",
	}),

	/**
	 * @skillHierarchy Child skills for comprehensive skill taxonomy
	 * @platformIntelligence Enables skill relationship tracking and recommendations
	 */
	childSkills: many(skill, {
		relationName: "skillHierarchy",
	}),

	/**
	 * @skillCreation Org that created this skill
	 * @qualityControl Skill origin tracking for taxonomy management
	 */
	createdByOrganization: one(org, {
		fields: [skill.createdByOrganizationId],
		references: [org.id],
	}),

	/**
	 * @courseMapping Courses that teach or require this skill
	 * @learningPathways Enables course sequencing based on skill prerequisites
	 */
	courses: many(productCourseSkill),

	/**
	 * @internationalization Multi-language skill names and descriptions
	 * @globalPlatform Localized skill taxonomy for international markets
	 */
	translations: many(skillTranslation),
}));

/**
 * Skill Translation Relations (Localized Skill Content)
 *
 * @integrationRole Internationalization support for skill taxonomy
 * @businessRelationships Multi-language skill names for global marketplace
 * @scalabilityPattern Supports platform expansion to international markets
 */
export const skillTranslationRelations = relations(skillTranslation, ({ one }) => ({
	/**
	 * @localizationTarget Skill being translated for international taxonomy
	 * @businessContext Enables localized skill discovery and course matching
	 */
	skill: one(skill, {
		fields: [skillTranslation.skillId],
		references: [skill.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [skillTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [skillTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * Product Course Skill Relations (Course-Skill Attribution)
 *
 * @integrationRole Links courses to skills for learning pathway construction
 * @businessRelationships Course skill requirements and learning outcomes
 * @scalabilityPattern Supports complex skill mapping and recommendation algorithms
 */
export const productCourseSkillRelations = relations(productCourseSkill, ({ one }) => ({
	/**
	 * @courseContext Course that teaches or requires this skill
	 * @learningManagement Enables skill-based course org and prerequisites
	 */
	course: one(productCourse, {
		fields: [productCourseSkill.courseId],
		references: [productCourse.id],
	}),

	/**
	 * @skillContext Skill being taught or required by course
	 * @marketplaceIntelligence Enables skill-based course discovery and matching
	 */
	skill: one(skill, {
		fields: [productCourseSkill.skillId],
		references: [skill.id],
	}),
}));

/**
 * Product Course Challenge Rating Relations (Course Quality Feedback)
 *
 * @integrationRole Community-driven course quality assessment and improvement
 * @businessRelationships Student feedback for instructor development and course optimization
 * @scalabilityPattern Supports quality-driven course ranking and recommendation systems
 */
export const productCourseChallengeRatingRelations = relations(
	productCourseChallengeRating,
	({ one }) => ({
		/**
		 * @feedbackTarget Course being rated for quality and accuracy
		 * @creatorEconomy Instructor feedback for course improvement and credibility
		 */
		course: one(productCourse, {
			fields: [productCourseChallengeRating.courseId],
			references: [productCourse.id],
		}),

		/**
		 * @feedbackProvider User providing course quality assessment
		 * @qualityAssurance Student experience feedback for platform optimization
		 */
		user: one(user, {
			fields: [productCourseChallengeRating.userId],
			references: [user.id],
		}),
	}),
);

/**
 * Product Course Module Relations (Learning Unit Org)
 *
 * @integrationRole Major learning units within course structure
 * @businessRelationships Module org, section containment, and access control
 * @scalabilityPattern Supports flexible course structure and content gating strategies
 */
export const productCourseModuleRelations = relations(productCourseModule, ({ one, many }) => ({
	/**
	 * @courseContext Course containing this learning module
	 * @contentStructure Enables hierarchical course org and navigation
	 */
	course: one(productCourse, {
		fields: [productCourseModule.courseId],
		references: [productCourse.id],
	}),

	/**
	 * @contentStructure Sections within module for granular content org
	 * @learningManagement Enables detailed learning progression and analytics
	 */
	sections: many(productCourseModuleSection),

	/**
	 * @internationalization Multi-language module content and metadata
	 * @globalDelivery Localized learning content for international students
	 */
	translations: many(productCourseModuleTranslation),
}));

/**
 * Product Course Module Translation Relations (Localized Module Content)
 *
 * @integrationRole Internationalization support for module content
 * @businessRelationships Multi-language module titles and descriptions
 * @scalabilityPattern Supports global course delivery and localized learning experiences
 */
export const productCourseModuleTranslationRelations = relations(
	productCourseModuleTranslation,
	({ one }) => ({
		/**
		 * @localizationTarget Module being translated for international delivery
		 * @businessContext Enables localized learning experience and content discovery
		 */
		module: one(productCourseModule, {
			fields: [productCourseModuleTranslation.productCourseModuleId],
			references: [productCourseModule.id],
		}),

		/**
		 * @seoOptimization SEO metadata for module-level content marketing
		 * @contentStrategy Optional SEO for strategic module positioning and discovery
		 */
		seoMetadata: one(seoMetadata, {
			fields: [productCourseModuleTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(locale, {
			fields: [productCourseModuleTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Product Course Module Section Relations (Learning Sub-Unit Org)
 *
 * @integrationRole Granular content org within modules
 * @businessRelationships Section org, lesson containment, and access control
 * @scalabilityPattern Supports detailed learning progression and content monetization
 */
export const productCourseModuleSectionRelations = relations(
	productCourseModuleSection,
	({ one, many }) => ({
		/**
		 * @moduleContext Module containing this learning section
		 * @contentStructure Enables nested learning org and progression tracking
		 */
		module: one(productCourseModule, {
			fields: [productCourseModuleSection.moduleId],
			references: [productCourseModule.id],
		}),

		/**
		 * @contentStructure Lessons within section for individual learning items
		 * @learningManagement Enables granular progress tracking and content delivery
		 */
		lessons: many(productCourseModuleSectionLesson),

		/**
		 * @internationalization Multi-language section content and metadata
		 * @globalDelivery Localized learning progression for international students
		 */
		translations: many(productCourseModuleSectionTranslation),
	}),
);

/**
 * Product Course Module Section Translation Relations (Localized Section Content)
 *
 * @integrationRole Internationalization support for section content
 * @businessRelationships Multi-language section org and descriptions
 * @scalabilityPattern Supports detailed localized learning experiences
 */
export const productCourseModuleSectionTranslationRelations = relations(
	productCourseModuleSectionTranslation,
	({ one }) => ({
		/**
		 * @localizationTarget Section being translated
		 */
		section: one(productCourseModuleSection, {
			fields: [productCourseModuleSectionTranslation.sectionId], // Fixed field name
			references: [productCourseModuleSection.id],
		}),

		/**
		 * @seoOptimization SEO metadata for section-level content
		 */
		seoMetadata: one(seoMetadata, {
			fields: [productCourseModuleSectionTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(locale, {
			fields: [productCourseModuleSectionTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Product Course Module Section Lesson Relations (Individual Learning Item)
 *
 * @integrationRole Links sections to reusable lesson content
 * @businessRelationships Lesson org, progress tracking, and access control
 * @scalabilityPattern Supports lesson reusability and granular learning analytics
 */
export const productCourseModuleSectionLessonRelations = relations(
	productCourseModuleSectionLesson,
	({ one, many }) => ({
		/**
		 * @sectionContext Section containing this lesson
		 * @contentStructure Enables lesson org within learning progression
		 */
		section: one(productCourseModuleSection, {
			fields: [productCourseModuleSectionLesson.sectionId],
			references: [productCourseModuleSection.id],
		}),

		/**
		 * @contentReference Reusable lesson content
		 * @learningManagement Enables lesson reusability across courses and modules
		 */
		lesson: one(lesson, {
			fields: [productCourseModuleSectionLesson.lessonId],
			references: [lesson.id],
		}),

		/**
		 * @contentOverride Course-specific lesson customizations and translations
		 * @businessFlexibility Enables lesson adaptation for specific course contexts
		 */
		translations: many(productCourseModuleSectionLessonTranslation),
	}),
);

/**
 * Product Course Module Lesson Translation Relations (Course-Specific Lesson Content)
 *
 * @integrationRole Course-specific lesson customizations and internationalization
 * @businessRelationships Lesson content adaptation and localization
 * @scalabilityPattern Supports lesson customization while maintaining reusability
 */
export const productCourseModuleSectionLessonTranslationRelations = relations(
	productCourseModuleSectionLessonTranslation,
	({ one }) => ({
		/**
		 * @customizationTarget Course-specific lesson being customized
		 */
		sectionLesson: one(productCourseModuleSectionLesson, {
			// Fixed field name
			fields: [productCourseModuleSectionLessonTranslation.sectionLessonId], // Fixed field
			references: [productCourseModuleSectionLesson.id],
		}),

		/**
		 * @seoOptimization SEO metadata for lesson-level content marketing
		 */
		seoMetadata: one(seoMetadata, {
			fields: [productCourseModuleSectionLessonTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(locale, {
			fields: [productCourseModuleSectionLessonTranslation.localeKey],
			references: [locale.key],
		}),
	}),
);

/**
 * Lesson Relations (Reusable Learning Content)
 *
 * @integrationRole Reusable learning content across courses and organizations
 * @businessRelationships Lesson org, type-specific content, and internationalization
 * @scalabilityPattern Supports content reusability and diverse lesson types
 */
export const lessonRelations = relations(lesson, ({ one, many }) => ({
	/**
	 * @organizationBoundary Org owning this lesson content
	 * @contentManagement Enables organizational lesson libraries and reusability
	 */
	org: one(org, {
		fields: [lesson.organizationId],
		references: [org.id],
	}),

	/**
	 * @courseUsage Courses using this lesson content
	 * @contentReusability Enables lesson sharing across multiple courses
	 */
	courseUsages: many(productCourseModuleSectionLesson),

	/**
	 * @internationalization Multi-language lesson content and metadata
	 * @globalContent Localized lesson delivery for international students
	 */
	translations: many(lessonTranslation),
}));

/**
 * Lesson Translation Relations (Localized Lesson Content)
 *
 * @integrationRole Internationalization support for reusable lesson content
 * @businessRelationships Multi-language lesson delivery and content management
 * @scalabilityPattern Supports global lesson content and localized learning
 */
export const lessonTranslationRelations = relations(lessonTranslation, ({ one }) => ({
	/**
	 * @localizationTarget Lesson being translated for international delivery
	 * @businessContext Enables localized lesson content and global course delivery
	 */
	lesson: one(lesson, {
		fields: [lessonTranslation.lessonId],
		references: [lesson.id],
	}),

	seoMetadata: one(seoMetadata, {
		fields: [lessonTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [lessonTranslation.localeKey],
		references: [locale.key],
	}),
}));

/**
 * Product Course Enrollment Relations (Student Course Management)
 *
 * @integrationRole Student enrollment and progress tracking within organizational context
 * @businessRelationships Course access, progress monitoring, and organizational learning
 * @scalabilityPattern Supports both public course sales and organizational training
 */
export const productCourseEnrollmentRelations = relations(productCourseEnrollment, ({ one }) => ({
	/**
	 * @organizationalContext Org member enrolled in course
	 * @businessRule Progress tracked per organizational membership for role-based learning
	 */
	organizationMember: one(orgMember, {
		fields: [productCourseEnrollment.organizationMemberId],
		references: [orgMember.id],
	}),

	/**
	 * @courseContext Course in which student is enrolled
	 * @learningManagement Enables course-specific progress tracking and analytics
	 */
	course: one(productCourse, {
		fields: [productCourseEnrollment.courseId],
		references: [productCourse.id],
	}),
}));

// export const productCourseModuleLessonProgressRelations = relations(
//   productCourseModuleLessonProgress,
//   ({ one }) => ({
//     /**
//      * @progressTarget Specific section lesson being tracked
//      */
//     sectionLesson: one(productCourseModuleSectionLesson, { // Fixed relation name
//       fields: [productCourseModuleLessonProgress.sectionLessonId], // Fixed field name
//       references: [productCourseModuleSectionLesson.id],
//     }),

//     /**
//      * @studentContext User whose progress is tracked
//      */
//     user: one(user, {
//       fields: [productCourseModuleLessonProgress.userId],
//       references: [user.id],
//     }),
//   }),
// );

/**
 * User Learning Profile Relations (Cross-Organizational Learning Summary)
 *
 * @integrationRole Aggregated user learning achievements and skill portfolio
 * @businessRelationships User skill development, career progression, and platform intelligence
 * @scalabilityPattern Supports cross-organizational professional development tracking
 */
export const userLearningProfileRelations = relations(userLearningProfile, ({ one }) => ({
	/**
	 * @learningPortfolio User whose learning achievements are summarized
	 * @professionalDevelopment Comprehensive learning profile for career advancement
	 */
	user: one(user, {
		fields: [userLearningProfile.userId],
		references: [user.id],
	}),
}));
