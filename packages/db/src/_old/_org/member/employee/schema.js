import { boolean, pgEnum } from "drizzle-orm/pg-core";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/member-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { userJobProfileIdFkCol } from "../../../_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { multiForeignKeys, uniqueIndex } from "../../../_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { orgEmployeeTableName } from "./_utils/index.js";
