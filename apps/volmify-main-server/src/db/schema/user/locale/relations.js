import { relations } from "drizzle-orm";
import { userCategoryI18n } from "#db/schema/general/category/schema.js";
import { locale } from "../../general/locale-and-currency/schema";
import { userProfileI18n } from "../profile/schema";
import { user } from "../schema";
import { userLocale } from "./schema";

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
