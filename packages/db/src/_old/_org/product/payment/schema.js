import { eq, sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { numericCols } from "../../../_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { seoMetadataIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import {
	userIdFkCol,
	userIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/user-id.js";
import { sharedCols } from "../../../_utils/cols/shared/index.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../../_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { orgCategory } from "../../../general/category/schema.js";
import { seoMetadata } from "../../../general/seo/schema.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";
import { orgProductVariant } from "../schema.js";
import { orgProductVariantPaymentTypeEnum } from "./_utils/shared-enums.js";

export { orgProductVariantPaymentTypeEnum } from "./_utils/shared-enums.js";

