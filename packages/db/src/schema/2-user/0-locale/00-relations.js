// ## user

import { relations } from "drizzle-orm";
import { locale } from "../../schema.js";
import { userCategoryI18n } from "../0-category/schema.js";
import { userProfileI18n } from "../1-profile/schema.js";
import { user } from "../00-schema.js";
import { userLocale } from "./00-schema.js";

// ### user -> locale

export const userLocaleRelations = relations(userLocale, ({ many, one }) => ({
	user: one(user, {
		fields: [userLocale.userId],
		references: [user.id],
	}),

	locale: one(locale, {
		// Fixed the self-reference
		fields: [userLocale.localeKey],
		references: [locale.key],
	}),

	usersProfilesI18n: many(userProfileI18n),
	usersCategoriesI18n: many(userCategoryI18n),
}));
// --- user --- locale

// -- user
