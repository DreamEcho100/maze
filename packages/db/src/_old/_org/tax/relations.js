import { relations } from "drizzle-orm";
import { orgCategory } from "../../general/category/schema.js";
import { currency } from "../../general/locale-and-currency/schema.js";
import { seoMetadata } from "../../general/seo/schema.js";
import { orgLocale, orgRegion } from "../locale-region/schema.js";
import { orgEmployee } from "../member/employee/schema.js";
import { orgTaxRate, orgTaxRateCategory, orgTaxRateI18n, orgTaxRateSnapshot } from "./schema.js";
