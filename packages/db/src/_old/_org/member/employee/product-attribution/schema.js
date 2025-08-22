import { sql } from "drizzle-orm";
import { check, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../../../_utils/cols/numeric.js";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol } from "../../../../_utils/cols/shared/foreign-keys/org-id.js";
import { temporalCols } from "../../../../_utils/cols/temporal.js";
import { textCols } from "../../../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../../../_utils/helpers.js";
import { table } from "../../../../_utils/tables.js";
import { orgMemberOrderItem } from "../../../product/orders/schema.js";
import { orgProduct } from "../../../product/schema.js";
import { orgEmployeeTableName } from "../_utils/index.js";
import { orgEmployee } from "../schema.js";
