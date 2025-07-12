import { relations } from "drizzle-orm";

import { currency } from "../currency-and-market/schema.js";
import {
	organization,
	organizationBrand,
	organizationMarket,
	organizationPricingZone,
} from "../organization/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { userInstructorProfile } from "../user/profile/instructor/schema.js";
import { productCollection } from "./collection/schema.js";
import { discount } from "./offers/schema.js";
import {
	discountProduct,
	discountVariant,
	product,
	productBrandAttribution,
	productInstructorAttribution,
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
	/**
	 * @brandAttribution Brand identity attributions for this product
	 * @marketplacePresentation Brand-based product presentation
	 */
	brandAttributions: many(productBrandAttribution),

	/**
	 * @instructorAttribution Instructor creator attributions for this product
	 * @revenueSharing Instructor revenue sharing and collaboration tracking
	 */
	instructorAttributions: many(productInstructorAttribution),
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
	zone: one(organizationPricingZone, {
		fields: [productZonePrice.zoneId],
		references: [organizationPricingZone.id],
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

/**
 * Product-Brand Attribution Relations
 *
 * @contentAttribution Links products to organization brand identities
 * Enables brand-based product presentation and marketplace organization.
 */
export const productBrandAttributionRelations = relations(productBrandAttribution, ({ one }) => ({
	product: one(product, {
		fields: [productBrandAttribution.productId],
		references: [product.id],
	}),
	brand: one(organizationBrand, {
		fields: [productBrandAttribution.brandId],
		references: [organizationBrand.id],
	}),
}));

/**
 * Product-Instructor Attribution Relations
 *
 * @contentAttribution Links products to instructor creators
 * Supports instructor revenue sharing and collaborative content creation.
 */
export const productInstructorAttributionRelations = relations(
	productInstructorAttribution,
	({ one }) => ({
		product: one(product, {
			fields: [productInstructorAttribution.productId],
			references: [product.id],
		}),
		instructorProfile: one(userInstructorProfile, {
			fields: [productInstructorAttribution.instructorProfileId],
			references: [userInstructorProfile.id],
		}),
		organization: one(organization, {
			fields: [productInstructorAttribution.organizationId],
			references: [organization.id],
		}),
	}),
);
