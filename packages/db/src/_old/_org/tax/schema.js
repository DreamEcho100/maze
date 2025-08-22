import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { orgCategory } from "../../general/category/schema.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
import { orgRegion } from "../locale-region/schema.js";
