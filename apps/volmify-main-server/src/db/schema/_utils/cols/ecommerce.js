import { decimal, integer, varchar } from "drizzle-orm/pg-core";

export const ecommerceCols = {
	// Pricing (high precision for international currencies)
	price: () => decimal("price", { precision: 12, scale: 4 }), // Supports micro-currencies
	basePrice: () => decimal("base_price", { precision: 12, scale: 4 }),
	finalPrice: () => decimal("final_price", { precision: 12, scale: 4 }),

	// Creator economy revenue sharing
	revenueShare: () => decimal("revenue_share", { precision: 7, scale: 4 }), // 0.0000-100.0000%
	fixedAmount: () => decimal("fixed_amount", { precision: 10, scale: 2 }),

	// Quantities and limits
	quantity: () => integer("quantity"), // Stock quantities
	maxEnrollments: () => integer("max_enrollments"), // Course limits
	currentEnrollments: () => integer("current_enrollments").default(0),

	// SKU and product identifiers
	sku: () => varchar("sku", { length: 64 }), // Product SKUs
	barcode: () => varchar("barcode", { length: 128 }), // International barcodes
};
