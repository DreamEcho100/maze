import { boolean, pgEnum, text } from "drizzle-orm/pg-core";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { userIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/user-id.js";
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
