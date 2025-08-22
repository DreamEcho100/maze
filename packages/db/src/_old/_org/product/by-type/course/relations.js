import { relations } from "drizzle-orm";
import { orgCategory } from "../../../../general/category/schema.js";
import { seoMetadata } from "../../../../general/seo/schema.js";
import { orgLesson } from "../../../lesson/schema.js";
import { orgLocale } from "../../../locale-region/schema.js";
import { orgMember } from "../../../member/schema.js";
import { orgProduct } from "../../schema.js";
import {
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
} from "./schema.js";
import { orgTableName } from "../../../_utils/helpers.js";


orgTableName