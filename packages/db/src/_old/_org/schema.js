import { eq, sql } from "drizzle-orm";
import { jsonb, text, varchar } from "drizzle-orm/pg-core";
import { numericCols } from "../_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "../_utils/cols/shared/foreign-keys/org-id.js";
import { sharedCols } from "../_utils/cols/shared/index.js";
import { temporalCols } from "../_utils/cols/temporal.js";
import { textCols } from "../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../_utils/helpers.js";
import { table } from "../_utils/tables.js";
import { user } from "../user/schema.js";
import { orgTableName } from "./_utils/helpers.js";
