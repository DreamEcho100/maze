import { relations } from "drizzle-orm";
import { vendorContactInfo } from "../vendor/schema";
import { contactInfo } from "./schema";

export const contactInfoRelations = relations(contactInfo, ({ many }) => ({
	vendorsContactInfo: many(vendorContactInfo),
}));
