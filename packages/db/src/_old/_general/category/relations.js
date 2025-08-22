import { relations } from "drizzle-orm";
import { orgBrand } from "../../org/brand/schema.js";
import { orgLocale } from "../../org/locale-region/schema.js";
import { orgEmployee } from "../../org/member/employee/schema.js";
import { orgProductCourseSkill } from "../../org/product/by-type/course/schema.js";
import { org } from "../../org/schema.js";
import { orgTaxRateCategory } from "../../org/tax/schema.js";
import { userLocale } from "../../user/locale/schema.js";
import { userJobProfileSkill } from "../../user/profile/job/schema.js";
import { user } from "../../user/schema.js";
import { seoMetadata } from "../seo/schema.js";
import {
	category,
	categoryMetrics,
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
	orgCategoryI18n,
	userCategory,
	userCategoryI18n,
} from "./schema.js";

