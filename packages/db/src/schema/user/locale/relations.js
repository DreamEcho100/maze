import { relations } from "drizzle-orm";
import { userCategoryI18n } from "#schema/general/category/schema.js";
import { locale } from "../../general/locale-and-currency/schema.js";
import { userProfileI18n } from "../profile/schema.js";
import { user } from "../schema.js";
import { userLocale } from "./schema.js";

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
