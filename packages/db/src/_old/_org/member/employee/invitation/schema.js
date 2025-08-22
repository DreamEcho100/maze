import { date, pgEnum } from "drizzle-orm/pg-core";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/employee-id.js";
import {
	orgIdFkCol,
	orgIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/org-id.js";
import {
	userJobProfileIdFkCol,
	userJobProfileIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import { temporalCols } from "../../../../_utils/cols/temporal.js";
import { textCols } from "../../../../_utils/cols/text.js";
import { multiIndexes } from "../../../../_utils/helpers.js";
import { table } from "../../../../_utils/tables.js";
import { orgEmployeeTableName } from "../_utils/index.js";
