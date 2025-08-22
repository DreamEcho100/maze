import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	integer,
	jsonb,
	pgEnum,
	pgTable as table,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { lmsCols } from "../../../../_utils/cols/lms.js";
import { numericCols } from "../../../../_utils/cols/numeric.js";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/member-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "../../../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { temporalCols } from "../../../../_utils/cols/temporal.js";
import { textCols } from "../../../../_utils/cols/text.js";
import {
	compositePrimaryKey,
	multiForeignKeys,
	multiIndexes,
	uniqueIndex,
} from "../../../../_utils/helpers.js";
import { orgCategory } from "../../../../general/category/schema.js";
import { buildOrgI18nTable, orgTableName } from "../../../_utils/helpers.js";
import { orgLesson } from "../../../lesson/schema.js";
import { orgProduct } from "../../schema.js";
