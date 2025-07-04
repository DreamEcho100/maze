import { relations } from "drizzle-orm";

import { currency } from "../currency-and-market/schema.js";
import { organization, organizationMarket, pricingZone } from "../organization/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { productCollection } from "./collection/schema.js";
import { discount } from "./offers/schema.js";
import {
	discountProduct,
	discountVariant,
	product,
	productPrice,
	productTranslation,
	productVariant,
	productZonePrice,
} from "./schema.js";

export const productRelations = relations(product, ({ one, many }) => ({
	organization: one(organization, {
		fields: [product.organizationId],
		references: [organization.id],
	}),
	translations: many(productTranslation),
	variants: many(productVariant),
	prices: many(productPrice),
	zonePrices: many(productZonePrice),
	collections: many(productCollection),
	discountProducts: many(discountProduct),
}));

export const productTranslationRelations = relations(productTranslation, ({ one }) => ({
	product: one(product, {
		fields: [productTranslation.productId],
		references: [product.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [productTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
	product: one(product, {
		fields: [productVariant.productId],
		references: [product.id],
	}),
	prices: many(productPrice),
	zonePrices: many(productZonePrice),
	discountVariants: many(discountVariant),
}));

export const productPriceRelations = relations(productPrice, ({ one }) => ({
	product: one(product, {
		fields: [productPrice.productId],
		references: [product.id],
	}),
	variant: one(productVariant, {
		fields: [productPrice.variantId],
		references: [productVariant.id],
	}),
	market: one(organizationMarket, {
		fields: [productPrice.marketId],
		references: [organizationMarket.id],
	}),
	currency: one(currency, {
		fields: [productPrice.currencyCode],
		references: [currency.code],
	}),
}));

export const productZonePriceRelations = relations(productZonePrice, ({ one }) => ({
	product: one(product, {
		fields: [productZonePrice.productId],
		references: [product.id],
	}),
	variant: one(productVariant, {
		fields: [productZonePrice.variantId],
		references: [productVariant.id],
	}),
	zone: one(pricingZone, {
		fields: [productZonePrice.zoneId],
		references: [pricingZone.id],
	}),
	currency: one(currency, {
		fields: [productZonePrice.currencyCode],
		references: [currency.code],
	}),
}));

export const discountProductRelations = relations(discountProduct, ({ one }) => ({
	discount: one(discount, {
		fields: [discountProduct.discountId],
		references: [discount.id],
	}),
	product: one(product, {
		fields: [discountProduct.productId],
		references: [product.id],
	}),
}));

export const discountVariantRelations = relations(discountVariant, ({ one }) => ({
	discount: one(discount, {
		fields: [discountVariant.discountId],
		references: [discount.id],
	}),
	variant: one(productVariant, {
		fields: [discountVariant.variantId],
		references: [productVariant.id],
	}),
}));
