import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../../_utils/cols/numeric.js";
import { currencyCodeFkCol } from "../../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../../_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { orgTableName } from "../../_utils/helpers.js";
import { orgTaxRateSnapshot } from "../../tax/schema.js";
import { orgCoupon, orgDiscount, orgGiftCard } from "../offers/schema.js";
import { orgProductVariantPaymentPlan } from "../payment/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";
