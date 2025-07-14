import { relations } from "drizzle-orm";
import {
	lessonTranslation,
	productCourseModuleSectionLessonTranslation,
	productCourseModuleSectionTranslation,
	productCourseModuleTranslation,
	productCourseTranslation,
	skillTranslation,
} from "../../org/product/by-type/course/schema.js";
import {
	couponTranslation,
	discountTranslation,
	giftCardTranslation,
	promotionTranslation,
} from "../../org/product/offers/schema.js";
import { productVariantPaymentPlanTranslation } from "../../org/product/payment/schema.js";
import { productTranslation, productVariantTranslation } from "../../org/product/schema.js";
import { org, orgBrandTranslation, orgMarketTranslation } from "../../org/schema.js";
import { userInstructorProfileTranslation } from "../../user/profile/instructor/schema.js";
import { locale, marketTemplateTranslation } from "../locale-currency-market/schema.js";
import {
	seoAlternateUrl,
	seoCustomMeta,
	seoMetadata,
	seoOpenGraph,
	seoStructuredData,
	seoTwitterCard,
} from "./schema.js";

// -------------------------------------
// SEO METADATA RELATIONS
// -------------------------------------
export const seoMetadataRelations = relations(seoMetadata, ({ one, many }) => ({
	// Many-to-one: SEO belongs to an org
	createdByOrganization: one(org, {
		fields: [seoMetadata.organizationId],
		references: [org.id],
		relationName: "seo_metadata_created_by_org",
	}),

	// org: one(org, {
	// 	fields: [seoMetadata.organizationId],
	// 	references: [org.id],
	// 	relationName: "seo_metadata_organization",
	// }),

	// One-to-one: SEO can have one Open Graph configuration
	openGraph: one(seoOpenGraph, {
		fields: [seoMetadata.id],
		references: [seoOpenGraph.seoMetadataId],
	}),

	// One-to-one: SEO can have one Twitter Card configuration
	twitterCard: one(seoTwitterCard, {
		fields: [seoMetadata.id],
		references: [seoTwitterCard.seoMetadataId],
	}),
	// One-to-many: SEO can have multiple structured data entries
	structuredData: many(seoStructuredData),
	// One-to-many: SEO can have multiple alternate URLs (for different locales)
	alternateUrls: many(seoAlternateUrl),
	// One-to-many: SEO can have multiple custom meta tags
	customMeta: many(seoCustomMeta),

	marketsTemplatesTranslations: one(marketTemplateTranslation, {
		fields: [seoMetadata.id],
		references: [marketTemplateTranslation.seoMetadataId],
	}),

	productsCoursesTranslations: one(productCourseTranslation, {
		fields: [seoMetadata.id],
		references: [productCourseTranslation.seoMetadataId],
	}),
	skillsTranslations: one(skillTranslation, {
		fields: [seoMetadata.id],
		references: [skillTranslation.seoMetadataId],
	}),
	productsCoursesModulesTranslations: one(productCourseModuleTranslation, {
		fields: [seoMetadata.id],
		references: [productCourseModuleTranslation.seoMetadataId],
	}),
	productsCoursesModulesSectionsTranslations: one(productCourseModuleSectionTranslation, {
		fields: [seoMetadata.id],
		references: [productCourseModuleSectionTranslation.seoMetadataId],
	}),
	productsCoursesModulesSectionsLessonsTranslations: one(
		productCourseModuleSectionLessonTranslation,
		{
			fields: [seoMetadata.id],
			references: [productCourseModuleSectionLessonTranslation.seoMetadataId],
		},
	),
	lessonsTranslations: one(lessonTranslation, {
		fields: [seoMetadata.id],
		references: [lessonTranslation.seoMetadataId],
	}),

	orgsBrandsTranslations: one(orgBrandTranslation, {
		fields: [seoMetadata.id],
		references: [orgBrandTranslation.seoMetadataId],
	}),
	orgMarketsTranslations: one(orgMarketTranslation, {
		fields: [seoMetadata.id],
		references: [orgMarketTranslation.seoMetadataId],
	}),
	productsTranslations: one(productTranslation, {
		fields: [seoMetadata.id],
		references: [productTranslation.seoMetadataId],
	}),
	productsVariantsTranslations: one(productVariantTranslation, {
		fields: [seoMetadata.id],
		references: [productVariantTranslation.seoMetadataId],
	}),

	usersInstructorProfilesTranslations: one(userInstructorProfileTranslation, {
		fields: [seoMetadata.id],
		references: [userInstructorProfileTranslation.seoMetadataId],
	}),

	discountsTranslation: one(discountTranslation, {
		fields: [seoMetadata.id],
		references: [discountTranslation.seoMetadataId],
	}),
	couponsTranslation: one(couponTranslation, {
		fields: [seoMetadata.id],
		references: [couponTranslation.seoMetadataId],
	}),
	giftCardsTranslation: one(giftCardTranslation, {
		fields: [seoMetadata.id],
		references: [giftCardTranslation.seoMetadataId],
	}),
	promotionsTranslation: one(promotionTranslation, {
		fields: [seoMetadata.id],
		references: [promotionTranslation.seoMetadataId],
	}),

	productsVariantsPaymentPlansTranslations: one(productVariantPaymentPlanTranslation, {
		fields: [seoMetadata.id],
		references: [productVariantPaymentPlanTranslation.seoMetadataId],
	}),
}));

// -------------------------------------
// ORGANIZATION RELATIONS (Add SEO relation)
// -------------------------------------
export const organizationSeoRelations = relations(org, ({ many }) => ({
	// One-to-many: Org can have multiple SEO metadata entries
	seoMetadata: many(seoMetadata),
}));

// -------------------------------------
// OPEN GRAPH RELATIONS
// -------------------------------------
export const seoOpenGraphRelations = relations(seoOpenGraph, ({ one }) => ({
	// Many-to-one: Open Graph belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoOpenGraph.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// TWITTER CARD RELATIONS
// -------------------------------------
export const seoTwitterCardRelations = relations(seoTwitterCard, ({ one }) => ({
	// Many-to-one: Twitter Card belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoTwitterCard.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// STRUCTURED DATA RELATIONS
// -------------------------------------
export const seoStructuredDataRelations = relations(seoStructuredData, ({ one }) => ({
	// Many-to-one: Structured data belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoStructuredData.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

// -------------------------------------
// ALTERNATE URL RELATIONS
// -------------------------------------
export const seoAlternateUrlRelations = relations(seoAlternateUrl, ({ one }) => ({
	// Many-to-one: Alternate URL belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoAlternateUrl.seoMetadataId],
		references: [seoMetadata.id],
	}),
	locale: one(locale, {
		fields: [seoAlternateUrl.localeKey],
		references: [locale.key],
	}),
}));

// -------------------------------------
// CUSTOM META RELATIONS
// -------------------------------------
export const seoCustomMetaRelations = relations(seoCustomMeta, ({ one }) => ({
	// Many-to-one: Custom meta belongs to SEO metadata
	seoMetadata: one(seoMetadata, {
		fields: [seoCustomMeta.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));
