import { relations } from "drizzle-orm";
import { orgFunnelI18n } from "../../org/funnel/schema.js";
import { orgRegionI18n } from "../../org/locale-region/schema.js";
import {
	orgLessonI18n,
	orgProductCourseI18n,
	orgProductCourseModuleI18n,
	orgProductCourseModuleSectionI18n,
	orgProductCourseModuleSectionLessonI18n,
	skillI18n,
} from "../../org/product/by-type/course/schema.js";
import {
	orgCouponI18n,
	orgDiscountI18n,
	orgGiftCardI18n,
	orgPromotionI18n,
} from "../../org/product/offers/schema.js";
import { orgProductVariantPaymentPlanI18n } from "../../org/product/payment/schema.js";
import {
	orgProductI18n,
	orgProductVariantI18n,
} from "../../org/product/schema.js";
import { org, orgBrandTranslation } from "../../org/schema.js";
import { orgTaxCategoryI18n, orgTaxRateI18n } from "../../org/tax/schema.js";
import { userInstructorProfileTranslation } from "../../user/profile/instructor/schema.js";
import {
	locale,
	marketTemplateTranslation,
} from "../locale-currency-market/schema.js";
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
		fields: [seoMetadata.orgId],
		references: [org.id],
		relationName: "seo_metadata_created_by_org",
	}),

	// org: one(org, {
	// 	fields: [seoMetadata.orgId],
	// 	references: [org.id],
	// 	relationName: "seo_metadata_org",
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

	productsCoursesTranslations: one(orgProductCourseI18n, {
		fields: [seoMetadata.id],
		references: [orgProductCourseI18n.seoMetadataId],
	}),
	skillsTranslations: one(skillI18n, {
		fields: [seoMetadata.id],
		references: [skillI18n.seoMetadataId],
	}),
	productsCoursesModulesTranslations: one(orgProductCourseModuleI18n, {
		fields: [seoMetadata.id],
		references: [orgProductCourseModuleI18n.seoMetadataId],
	}),
	productsCoursesModulesSectionsTranslations: one(
		orgProductCourseModuleSectionI18n,
		{
			fields: [seoMetadata.id],
			references: [orgProductCourseModuleSectionI18n.seoMetadataId],
		},
	),
	productsCoursesModulesSectionsLessonsTranslations: one(
		orgProductCourseModuleSectionLessonI18n,
		{
			fields: [seoMetadata.id],
			references: [orgProductCourseModuleSectionLessonI18n.seoMetadataId],
		},
	),
	lessonsTranslations: one(orgLessonI18n, {
		fields: [seoMetadata.id],
		references: [orgLessonI18n.seoMetadataId],
	}),

	orgsBrandsTranslations: one(orgBrandTranslation, {
		fields: [seoMetadata.id],
		references: [orgBrandTranslation.seoMetadataId],
	}),

	usersInstructorProfilesTranslations: one(userInstructorProfileTranslation, {
		fields: [seoMetadata.id],
		references: [userInstructorProfileTranslation.seoMetadataId],
	}),

	discountsTranslation: one(orgDiscountI18n, {
		fields: [seoMetadata.id],
		references: [orgDiscountI18n.seoMetadataId],
	}),
	couponsTranslation: one(orgCouponI18n, {
		fields: [seoMetadata.id],
		references: [orgCouponI18n.seoMetadataId],
	}),
	giftCardsTranslation: one(orgGiftCardI18n, {
		fields: [seoMetadata.id],
		references: [orgGiftCardI18n.seoMetadataId],
	}),
	promotionsTranslation: one(orgPromotionI18n, {
		fields: [seoMetadata.id],
		references: [orgPromotionI18n.seoMetadataId],
	}),

	productsVariantsPaymentPlansTranslations: one(
		orgProductVariantPaymentPlanI18n,
		{
			fields: [seoMetadata.id],
			references: [orgProductVariantPaymentPlanI18n.seoMetadataId],
		},
	),

	//
	orgFunnelI18n: one(orgFunnelI18n, {
		fields: [seoMetadata.id],
		references: [orgFunnelI18n.seoMetadataId],
	}),
	orgTaxCategoryI18n: one(orgTaxCategoryI18n, {
		fields: [seoMetadata.id],
		references: [orgTaxCategoryI18n.seoMetadataId],
	}),
	orgRegionI18n: one(orgRegionI18n, {
		fields: [seoMetadata.id],
		references: [orgRegionI18n.seoMetadataId],
	}),
	orgProductI18n: one(orgProductI18n, {
		fields: [seoMetadata.id],
		references: [orgProductI18n.seoMetadataId],
	}),
	orgProductVariantI18n: one(orgProductVariantI18n, {
		fields: [seoMetadata.id],
		references: [orgProductVariantI18n.seoMetadataId],
	}),
	orgTaxRateI18n: one(orgTaxRateI18n, {
		fields: [seoMetadata.id],
		references: [orgTaxRateI18n.seoMetadataId],
	}),
	productVariantPaymentPlanI18n: one(orgProductVariantPaymentPlanI18n, {
		fields: [seoMetadata.id],
		references: [orgProductVariantPaymentPlanI18n.seoMetadataId],
	}),
}));

// -------------------------------------
// ORGANIZATION RELATIONS (Add SEO relation)
// -------------------------------------
export const orgSeoRelations = relations(org, ({ many }) => ({
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
export const seoStructuredDataRelations = relations(
	seoStructuredData,
	({ one }) => ({
		// Many-to-one: Structured data belongs to SEO metadata
		seoMetadata: one(seoMetadata, {
			fields: [seoStructuredData.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);

// -------------------------------------
// ALTERNATE URL RELATIONS
// -------------------------------------
export const seoAlternateUrlRelations = relations(
	seoAlternateUrl,
	({ one }) => ({
		// Many-to-one: Alternate URL belongs to SEO metadata
		seoMetadata: one(seoMetadata, {
			fields: [seoAlternateUrl.seoMetadataId],
			references: [seoMetadata.id],
		}),
		locale: one(locale, {
			fields: [seoAlternateUrl.localeKey],
			references: [locale.key],
		}),
	}),
);

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
