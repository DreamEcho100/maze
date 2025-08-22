import { relations } from "drizzle-orm";
import { contactInfo } from "../../general/contact-info/schema.js";
import { seoMetadata } from "../../general/seo/schema.js";
import { orgMember } from "../../org/member/schema.js";
import { userLocale } from "../locale/schema.js";
import { user } from "../schema.js";
import { userJobProfile } from "./job/schema.js";
import {
	userProfile,
	userProfileContactInfo,
	userProfileI18n,
	userProfileOrgMembership,
} from "./schema.js";
