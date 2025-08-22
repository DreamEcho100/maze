import { integer } from "drizzle-orm/pg-core";
import { numericCols } from "../../../_utils/cols/numeric.js";
import {
	userJobProfileIdFkCol,
	userJobProfileIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/user-job-profile-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "../../../_utils/cols/shared/foreign-keys/user-profile-id.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../../_utils/helpers.js";
// Assuming these tables exist in your schema
import { table } from "../../../_utils/tables.js";
import { userCategory } from "../../../general/category/schema.js";
import { userTableName } from "../../_utils/helpers.js";
