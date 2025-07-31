import { decimal, integer } from "drizzle-orm/pg-core";

export const numericCols = {
	// IDs and Counters
	sortOrder: () => integer("sort_order").default(0), // Course module ordering
	version: () => integer("version").default(1), // Content versioning

	// Financial (precision-critical)
	revenueShare: () => decimal("revenue_share", { precision: 5, scale: 2 }), // Creator splits

	// Metrics & Analytics
	count: () => integer("count").default(0), // Enrollment counts
	duration: () => integer("duration_minutes"), // Time in minutes

	// Access Control
	/** @param {string} [name] */
	accessTier: (name) => integer(name ?? "access_tier").default(1), // 1-10 tier levels
	priority: ({ name = "priority", default: defaultVal = 0 }) => integer(name).default(defaultVal), // Rule priority
	//
	// ✅ FINANCIAL: High-precision currency amounts
	currency: {
		// Standard currency amounts (supports micro-currencies)
		amount: (name = "amount") => decimal(name, { precision: 12, scale: 4 }),
		price: (name = "price") => decimal(name, { precision: 12, scale: 4 }),
		basePrice: (name = "base_price") => decimal(name, { precision: 12, scale: 4 }),
		finalPrice: (name = "final_price") => decimal(name, { precision: 12, scale: 4 }),

		// Discount/coupon values
		discountValue: (name = "value") => decimal(name, { precision: 12, scale: 4 }),
		couponValue: (name = "value") => decimal(name, { precision: 12, scale: 4 }),

		// Balances and credits
		balance: (name = "balance") => decimal(name, { precision: 12, scale: 4 }),
		credit: (name = "credit") => decimal(name, { precision: 12, scale: 4 }),
	},

	// ✅ PERCENTAGES: Standardized percentage handling
	percentage: {
		// Standard percentages (0.00-100.00%)
		rate: (name = "percentage") => decimal(name, { precision: 5, scale: 2 }),
		taxRate: (name = "rate") => decimal(name, { precision: 5, scale: 4 }), // Higher precision for tax
		_: (name = "percentage") => decimal(name, { precision: 5, scale: 2 }),
		revenueShare: (name = "revenue_share") => decimal(name, { precision: 5, scale: 4 }),
		vatRate: (name = "vat_rate") => decimal(name, { precision: 5, scale: 4 }),
	},

	// ✅ EXCHANGE RATES: Ultra-high precision
	exchangeRate: {
		rate: (name = "rate") => decimal(name, { precision: 16, scale: 8 }), // Exchange rate precision
		roundingIncrement: (name = "rounding_increment") => decimal(name, { precision: 10, scale: 6 }),
	},

	// ✅ RATINGS & METRICS: User-facing metrics
	/** @param {string} name */
	ratingTotal: (name) => integer(name),
	/** @param {string} name */
	ratingAgg: (name) => decimal(name, { precision: 3, scale: 2 }), // 0.00-10.00,
	/** @param {string} name */
	ratingCount: (name) => integer(name).default(0),

	// ✅ ANALYTICS: Performance metrics
	analytics: {
		// Click-through rates, conversion rates
		conversionRate: (name = "conversion_rate") => decimal(name, { precision: 5, scale: 4 }),
		clickThroughRate: (name = "click_through_rate") => decimal(name, { precision: 5, scale: 4 }),
		averagePosition: (name = "average_position") => decimal(name, { precision: 5, scale: 2 }),
	},
};
