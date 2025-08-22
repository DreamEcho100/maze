// ## org -> product -> approval-revenue-and-attribution

import { relations } from "drizzle-orm";
import { orgEmployee } from "../../../schema";
import { orgBrand } from "../../3-brand/schema";
import { orgProduct } from "../00-schema";
import {
	orgEmployeeProductAttribution,
	orgEmployeeProductAttributionRevenue,
	orgProductBrandAttribution,
	orgProductRevenuePool,
} from "./schema";

// ### org -> product -> approval-revenue-and-attribution -> employee attribution
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
// --- org -> product -> approval-revenue-and-attribution -> employee attribution

// ### org -> product -> approval-revenue-and-attribution -> brand attribution
/**
 * Product Brand Attribution Relations (Brand Identity Integration)
 *
 * @integrationRole Brand identity attribution relationships for marketing consistency
 * Connects org brands to product content enabling consistent brand presentation,
 * marketing campaigns, and customer recognition across product catalogs and promotional strategies.
 *
 * @brandStrategy Enables orgs to manage multiple brands or white-label products
 * while maintaining clear brand attribution for marketing consistency and customer experience
 * across diverse product catalogs and promotional campaigns.
 */
export const productBrandAttributionRelations = relations(
	orgProductBrandAttribution,
	({ one }) => ({
		/**
		 * @brandIdentity Org brand this attribution applies to
		 * @businessContext Links brand identity to product presentation and marketing consistency
		 * @customerExperience Ensures consistent brand presentation across product discovery workflows
		 */
		brand: one(orgBrand, {
			fields: [orgProductBrandAttribution.brandId],
			references: [orgBrand.id],
		}),

		/**
		 * @productAttribution Product this brand attribution applies to
		 * @businessContext Links brand identity to specific product for marketing consistency
		 * @marketingStrategy Enables brand-specific product presentation and promotional campaigns
		 */
		product: one(orgProduct, {
			fields: [orgProductBrandAttribution.productId],
			references: [orgProduct.id],
		}),
	}),
);
// --- org -> product -> approval-revenue-and-attribution -> brand attribution

// ### org -> product -> approval-revenue-and-attribution -> revenue pool
export const orgProductRevenuePoolRelations = relations(orgProductRevenuePool, ({ one }) => ({
	lastAllocatedByEmployee: one(orgEmployee, {
		fields: [orgProductRevenuePool.lastAllocationByEmployeeId],
		references: [orgEmployee.id],
	}),
	product: one(orgProduct, {
		fields: [orgProductRevenuePool.productId],
		references: [orgProduct.id],
	}),
}));
// --- org -> product -> approval-revenue-and-attribution -> revenue pool

// ### org -> product -> approval-revenue-and-attribution -> approval
// TODO: `orgProductApproval` relations
// --- org -> product -> approval-revenue-and-attribution -> approval

// -- org -> product -> approval-revenue-and-attribution
