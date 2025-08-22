import { text } from "drizzle-orm/pg-core";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../../_utils/cols/shared/foreign-keys/org-id.js";
import { temporalCols } from "../../../_utils/cols/temporal.js";
import { textCols } from "../../../_utils/cols/text.js";
import { compositePrimaryKey, multiIndexes, uniqueIndex } from "../../../_utils/helpers.js";
import { table } from "../../../_utils/tables.js";
import { orgTableName } from "../../_utils/helpers.js";
