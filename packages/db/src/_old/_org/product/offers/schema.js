import { decimal, integer, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { numericCols } from "../../../_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { sharedCols } from "../../../_utils/cols/shared/index.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../../_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../../_utils/helpers.js";
import { orgProductCollection } from "../collection/schema.js";
import { orgMemberOrder } from "../orders/schema.js";
import { orgProduct, orgProductVariant } from "../schema.js";
