import { eq, sql } from "drizzle-orm";
import { boolean, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import {
	orgMemberIdFkCol,
	orgMemberIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/member-id.js";
import {
	seoMetadataIdFkCol,
	seoMetadataIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/seo-metadata-id.js";
import { userIdFkCol, userIdFkExtraConfig } from "../../_utils/cols/shared/foreign-keys/user-id.js";
import {
	userProfileIdFkCol,
	userProfileIdFkExtraConfig,
} from "../../_utils/cols/shared/foreign-keys/user-profile-id.js";
import { sharedCols } from "../../_utils/cols/shared/index.js";
import { temporalCols } from "../../_utils/cols/temporal.js";
import { textCols } from "../../_utils/cols/text.js";
import { multiForeignKeys, multiIndexes, uniqueIndex } from "../../_utils/helpers.js";
// Assuming these tables exist in your schema
import { table } from "../../_utils/tables.js";
import { contactInfo } from "../../general/contact-info/schema.js";
// import { userProfileOrgMembership } from "../../org/schema.js";
import { buildUserI18nTable, userTableName } from "../_utils/helpers.js";

// import { org } from "../../org/schema.js";
