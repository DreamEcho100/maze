import { eq, isNull, sql } from "drizzle-orm";
import { boolean, text } from "drizzle-orm/pg-core";
import {
	currencyCodeFkCol,
	currencyCodeFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/currency-code.js";
import {
	localeKeyFkCol,
	localeKeyFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/locale-key.js";
import { orgIdFkCol, orgIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/org-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
import { table } from "../../_utils/tables.js";
import { buildOrgI18nTable, orgTableName } from "../_utils/helpers.js";
