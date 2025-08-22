import { pgEnum } from "drizzle-orm/pg-core";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/org-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/user-profile-id.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { orgMemberTableName } from "./_utils/index.js";
