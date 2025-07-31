import { relations } from "drizzle-orm";
import { orgProduct } from "#db/schema/org/product/schema.js";
import { orgEmployee } from "../schema";
import { orgEmployeeProductAttribution, orgEmployeeProductAttributionRevenue } from "./schema";

export const orgEmployeeProductAttributionRelations = relations(
	orgEmployeeProductAttribution,
	({ one, many }) => ({
		employee: one(orgEmployee, {
			fields: [orgEmployeeProductAttribution.employeeId],
			references: [orgEmployee.id],
		}),
		product: one(orgProduct, {
			fields: [orgEmployeeProductAttribution.productId],
			references: [orgProduct.id],
		}),
		revenueAttributions: many(orgEmployeeProductAttributionRevenue),
	}),
);
