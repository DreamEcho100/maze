import { sql } from "drizzle-orm";
import { check, pgEnum } from "drizzle-orm/pg-core";
import { numericCols } from "../../_utils/cols/numeric.js";
import {
	orgEmployeeIdFkCol,
	orgEmployeeIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/employee-id.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/org-id.js";
import { seoMetadataIdFkCol } from "../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { userIdFkCol, userIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/user-id.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable } from "../../org/_utils/helpers.js";
import { buildUserI18nTable } from "../../user/_utils/helpers.js";

