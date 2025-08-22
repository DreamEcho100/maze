import { relations } from "drizzle-orm";
import { orgCategoryI18n } from "../../general/category/schema.js";
import { currency } from "../../general/locale-and-currency/schema.js";
import { seoMetadata } from "../../general/seo/schema.js";
import { orgFunnelI18n } from "../funnel/schema.js";
import { orgLessonI18n } from "../lesson/schema.js";
import { orgDepartmentI18n } from "../member/department/schema.js";
import { orgTeamI18n } from "../member/team/schema.js";
import {
	orgProductCourseI18n,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLessonI18n,
} from "../product/by-type/course/schema.js";
import {
	orgCouponI18n,
	orgDiscountI18n,
	orgGiftCardI18n,
	orgPromotionI18n,
} from "../product/offers/schema.js";
import {
	orgProductVariantPaymentPlanI18n,
	// orgProductVariantPaymentPlanOneTimeTypeI18n,
	orgProductVariantPaymentPlanSubscriptionTypeI18n,
} from "../product/payment/schema.js";
import { org } from "../schema.js";
import { orgTaxRateI18n } from "../tax/schema.js";
import { orgLocale, orgRegion, orgRegionI18n } from "./schema.js";
