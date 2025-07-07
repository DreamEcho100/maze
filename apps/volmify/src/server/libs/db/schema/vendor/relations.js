import { relations } from "drizzle-orm";
import { user } from "../auth/schema";
import { contactInfo } from "../contact-info/schema";
import { organization, organizationMember } from "../organization/schema";
import { product } from "../product/schema";
import { seoMetadata } from "../seo/schema";
import {
	// credentialVerificationRequest,
	// instructorCredential,
	instructorOrganizationAffiliation,
	// organizationCredentialRequirement,
	productVendor,
	vendor,
	vendorBrand,
	vendorBrandMetrics,
	vendorContactInfo,
	vendorInstructor,
	vendorInstructorCoursesMetrics,
	vendorInstructorMetrics,
	vendorInstructorTranslation,
	vendorMetrics,
	vendorTranslation,
	// vendorRevenueRule,
	// vendorVerification,
} from "./schema";

/**
 * @fileoverview Vendor Relations - Content Creator Marketplace Integration
 *
 * @integrationPattern CTI + Marketplace Hub
 * Vendor relations implement Class Table Inheritance (CTI) with marketplace-centric
 * relationships that connect content creators to organizations, products, and
 * performance tracking systems for comprehensive creator economy management.
 *
 * @businessContext
 * These relations enable vendor discovery, content attribution, revenue tracking,
 * cross-organizational collaboration, and performance analytics across the
 * creator marketplace ecosystem.
 */

/**
 * Base Vendor Relations (CTI Root + Marketplace Hub)
 *
 * @ctiPattern Base vendor table with polymorphic relationships to specialized vendor types
 * Core vendor entity that branches into brand or instructor specializations while
 * maintaining common marketplace functionality and organizational context.
 *
 * @marketplaceIntegration
 * Serves as the central hub for vendor marketplace activities including product
 * creation, performance tracking, contact management, and cross-organizational
 * collaboration through instructor affiliations.
 *
 * @businessRelationships
 * - Organization Context: All vendors operate within organization boundaries
 * - Product Creation: Vendors create and manage marketplace content
 * - Performance Analytics: Comprehensive metrics and business intelligence
 * - Communication: Contact management for business relationships
 * - Localization: Multi-language vendor profiles for global reach
 */
export const vendorRelations = relations(vendor, ({ one, many }) => ({
	/**
	 * @organizationContext Vendor operates within organization boundary
	 * @businessScope All vendor activities scoped to organization permissions and markets
	 */
	organization: one(organization, {
		fields: [vendor.organizationId],
		references: [organization.id],
	}),

	/**
	 * @localizationSupport Multi-language vendor profiles for global marketplace
	 * @globalReach Enables vendor discovery and engagement across different locales
	 */
	translations: many(vendorTranslation),

	/**
	 * @ctiSpecialization Brand vendor specialization (CTI subtype)
	 * @businessModel Corporate/agency vendor with brand-focused content strategy
	 */
	brand: one(vendorBrand, {
		fields: [vendor.id],
		references: [vendorBrand.vendorId],
	}),

	/**
	 * @ctiSpecialization Instructor vendor specialization (CTI subtype)
	 * @businessModel Individual content creator with personal expertise focus
	 */
	instructor: one(vendorInstructor, {
		fields: [vendor.id],
		references: [vendorInstructor.vendorId],
	}),

	/**
	 * @marketplaceCatalog Product creation and content attribution
	 * @revenueTracking Links vendor to their created products for revenue attribution
	 */
	products: many(productVendor),

	// revenueRules: many(vendorRevenueRule),
	// verifications: many(vendorVerification),

	/**
	 * @communicationHub Vendor contact management for business relationships
	 * @businessCommunication Multiple contact points for different business purposes
	 */
	contactInfo: many(vendorContactInfo),

	/**
	 * @performanceAnalytics Consolidated vendor performance metrics
	 * @businessIntelligence Comprehensive marketplace performance tracking
	 */
	metrics: one(vendorMetrics, {
		fields: [vendor.id],
		references: [vendorMetrics.vendorId],
	}),

	/**
	 * @crossOrganizationNetwork Instructor affiliations with other organizations
	 * @businessCollaboration Enables instructor-organization partnerships and collaborations
	 */
	affiliations: many(instructorOrganizationAffiliation),
	// credentials: many(instructorCredential),
}));

/**
 * Vendor Translation Relations
 *
 * @localizationContext Multi-language vendor content for global marketplace reach
 * Enables vendor profiles to be presented in multiple languages while maintaining
 * SEO optimization for regional discovery and engagement.
 */
export const vendorTranslationRelations = relations(vendorTranslation, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorTranslation.vendorId],
		references: [vendor.id],
	}),
	/**
	 * @seoOptimization Vendor-specific SEO metadata for search discovery
	 * @marketplaceDiscovery Enhances vendor findability in search results and marketplace
	 */
	seoMetadata: one(seoMetadata, {
		fields: [vendorTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

/**
 * Vendor Contact Information Relations
 *
 * @communicationBridge Links vendors to contact management system
 * Enables vendors to have multiple contact points for different business
 * purposes while maintaining communication preferences and verification status.
 */
export const vendorContactInfoRelations = relations(vendorContactInfo, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorContactInfo.vendorId],
		references: [vendor.id],
	}),
	/**
	 * @polymorphicContact Links to universal contact information system
	 * @communicationManagement Unified contact handling across platform entities
	 */
	contactInfo: one(contactInfo, {
		fields: [vendorContactInfo.contactInfoId],
		references: [contactInfo.id],
	}),
}));

/**
 * Vendor Performance Metrics Relations
 *
 * @performanceAnalytics Consolidated vendor performance tracking
 * Links vendors to their comprehensive performance metrics for business
 * intelligence, marketplace optimization, and vendor success analysis.
 */
export const vendorMetricsRelations = relations(vendorMetrics, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorMetrics.vendorId],
		references: [vendor.id],
	}),
}));

/**
 * Brand Vendor Relations (CTI Specialization)
 *
 * @brandSpecialization Corporate/agency vendor with brand-focused strategy
 * Brand vendors represent organizations that create structured, professional
 * content with corporate branding and enterprise-level educational offerings.
 *
 * @brandAnalytics
 * Brand-specific performance metrics focus on corporate KPIs, business impact,
 * and enterprise-level engagement patterns different from individual instructors.
 */
export const vendorBrandRelations = relations(vendorBrand, ({ one, many }) => ({
	/**
	 * @ctiInheritance Links to base vendor table for shared marketplace functionality
	 */
	vendor: one(vendor, {
		fields: [vendorBrand.vendorId],
		references: [vendor.id],
	}),

	/**
	 * @brandAnalytics Brand-specific performance metrics and business intelligence
	 * @corporateKPIs Metrics focused on enterprise-level content performance
	 */
	metrics: one(vendorBrandMetrics, {
		fields: [vendorBrand.vendorId],
		references: [vendorBrandMetrics.vendorBrandId],
	}),

	/**
	 * @brandLocalization Multi-language brand content for international markets
	 * @corporatePresence Localized brand presentation for global corporate audiences
	 */
	translations: many(vendorTranslation),
}));

/**
 * Brand Translation Relations
 *
 * @brandLocalization Corporate brand content localization
 * Enables brand vendors to present corporate identity and professional
 * content across different languages and regional markets.
 */
export const vendorBrandTranslationRelations = relations(vendorTranslation, ({ one }) => ({
	vendorBrand: one(vendorBrand, {
		fields: [vendorTranslation.vendorId],
		references: [vendorBrand.vendorId],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [vendorTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

/**
 * Brand Metrics Relations
 *
 * @brandAnalytics Brand-specific performance tracking
 * Links brand vendors to specialized performance metrics focused on
 * corporate content effectiveness and enterprise engagement patterns.
 */
export const vendorBrandMetricsRelations = relations(vendorBrandMetrics, ({ one }) => ({
	vendorBrand: one(vendorBrand, {
		fields: [vendorBrandMetrics.vendorBrandId],
		references: [vendorBrand.vendorId],
	}),
}));

/**
 * Instructor Vendor Relations (CTI Specialization)
 *
 * @instructorSpecialization Individual content creator with personal expertise focus
 * Instructor vendors represent individual experts who create content based on
 * personal professional experience, certifications, and specialized knowledge.
 *
 * @personalBranding
 * Instructor relations focus on personal identity, expertise domains, cross-
 * organizational affiliations, and teaching effectiveness metrics.
 *
 * @affiliationNetwork
 * Instructors can have relationships with multiple organizations for collaboration,
 * consultation, and partnership opportunities while maintaining independent status.
 */
export const vendorInstructorRelations = relations(vendorInstructor, ({ one, many }) => ({
	/**
	 * @instructorLocalization Personal instructor content in multiple languages
	 * @expertisePresentation Localized presentation of instructor expertise and background
	 */
	translations: many(vendorInstructorTranslation),

	/**
	 * @ctiInheritance Links to base vendor table for shared marketplace functionality
	 */
	vendor: one(vendor, {
		fields: [vendorInstructor.vendorId],
		references: [vendor.id],
	}),

	/**
	 * @instructorIdentity Links instructor vendor to platform user account
	 * @authenticationContext Enables instructor authentication and account management
	 */
	user: one(user, {
		fields: [vendorInstructor.userId],
		references: [user.id],
	}),

	/**
	 * @affiliationNetwork Cross-organizational instructor relationships
	 * @businessCollaboration Enables instructor partnerships with multiple organizations
	 */
	affiliations: many(instructorOrganizationAffiliation),

	// credentials: many(instructorCredential),

	/**
	 * @instructorAnalytics Teaching effectiveness and instructor-specific performance
	 * @creatorSuccess Metrics focused on teaching quality and student engagement
	 */
	metrics: one(vendorInstructorMetrics, {
		fields: [vendorInstructor.vendorId],
		references: [vendorInstructorMetrics.vendorInstructorId],
	}),

	/**
	 * @contentAnalytics Course-specific performance metrics for instructor content
	 * @teachingInsights Data for instructor content strategy and teaching improvement
	 */
	coursesMetrics: one(vendorInstructorCoursesMetrics, {
		fields: [vendorInstructor.vendorId],
		references: [vendorInstructorCoursesMetrics.vendorInstructorId],
	}),
}));

/**
 * Instructor Translation Relations
 *
 * @instructorLocalization Personal instructor content localization
 * Enables instructors to present professional background, expertise, and
 * bio information in multiple languages for international audience reach.
 */
export const vendorInstructorTranslationRelations = relations(
	vendorInstructorTranslation,
	({ one }) => ({
		vendorInstructor: one(vendorInstructor, {
			fields: [vendorInstructorTranslation.vendorInstructorId],
			references: [vendorInstructor.vendorId],
		}),
		/**
		 * @instructorSEO Personal instructor SEO optimization
		 * @expertDiscovery Enhances instructor discoverability for expertise-based searches
		 */
		seoMetadata: one(seoMetadata, {
			fields: [vendorInstructorTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);

/**
 * Instructor Performance Metrics Relations
 *
 * @instructorAnalytics Teaching effectiveness and student engagement tracking
 * Links instructors to specialized metrics focused on teaching quality,
 * student satisfaction, and educational outcome effectiveness.
 */
export const vendorInstructorMetricsRelations = relations(vendorInstructorMetrics, ({ one }) => ({
	vendorInstructor: one(vendorInstructor, {
		fields: [vendorInstructorMetrics.vendorInstructorId],
		references: [vendorInstructor.vendorId],
	}),
}));

/**
 * Instructor Course Metrics Relations
 *
 * @contentAnalytics Course-specific performance and engagement analytics
 * Provides instructors with detailed insights into course performance,
 * completion rates, and content effectiveness for optimization strategies.
 */
export const vendorInstructorCoursesMetricsRelations = relations(
	vendorInstructorCoursesMetrics,
	({ one }) => ({
		vendorInstructor: one(vendorInstructor, {
			fields: [vendorInstructorCoursesMetrics.vendorInstructorId],
			references: [vendorInstructor.vendorId],
		}),
	}),
);

/**
 * Instructor-Organization Affiliation Relations
 *
 * @affiliationNetwork Cross-organizational instructor collaboration system
 * Enables instructors to maintain professional relationships with multiple
 * organizations for content collaboration, expert consultation, and partnership
 * arrangements while preserving independent vendor status.
 *
 * @businessCollaboration
 * Supports complex business relationships where instructors can work with
 * organizations beyond their primary vendor organization for specialized
 * projects, expertise sharing, and revenue diversification.
 *
 * @workflowManagement
 * Tracks invitation, approval, and management workflows for instructor-organization
 * relationships with clear governance and accountability.
 */
export const instructorOrganizationAffiliationRelations = relations(
	instructorOrganizationAffiliation,
	({ one }) => ({
		/**
		 * @affiliationSubject Instructor participating in cross-organization relationship
		 */
		instructor: one(vendorInstructor, {
			fields: [instructorOrganizationAffiliation.instructorVendorId],
			references: [vendorInstructor.vendorId],
		}),

		/**
		 * @affiliationTarget Organization with instructor collaboration relationship
		 */
		organization: one(organization, {
			fields: [instructorOrganizationAffiliation.organizationId],
			references: [organization.id],
		}),

		/**
		 * @accountBridge User account connecting instructor to organization context
		 */
		user: one(user, {
			fields: [instructorOrganizationAffiliation.userId],
			references: [user.id],
		}),

		/**
		 * @membershipIntegration Organization membership facilitating instructor access
		 * @permissionContext Provides instructor with organization-scoped permissions
		 */
		orgMember: one(organizationMember, {
			fields: [instructorOrganizationAffiliation.orgMemberId],
			references: [organizationMember.id],
		}),

		/**
		 * @workflowTracking Affiliation invitation and approval workflow management
		 * @businessGovernance Accountability for instructor-organization relationships
		 */
		inviter: one(user, {
			fields: [instructorOrganizationAffiliation.invitedBy],
			references: [user.id],
		}),
		approver: one(user, {
			fields: [instructorOrganizationAffiliation.approvedBy],
			references: [user.id],
		}),
	}),
);

/**
 * Product-Vendor Relations (Marketplace Catalog)
 *
 * @marketplaceCatalog Links products to their vendor creators
 * Establishes the fundamental marketplace relationship between content creators
 * and their products for catalog management, revenue attribution, and content
 * ownership tracking within the creator economy.
 *
 * @revenueAttribution
 * Enables flexible revenue sharing models and marketplace economics through
 * vendor-product associations with configurable revenue share percentages.
 */
export const productVendorRelations = relations(productVendor, ({ one }) => ({
	/**
	 * @contentOwnership Product being created/managed by vendor
	 * @marketplaceCatalog Core product catalog relationship for vendor portfolios
	 */
	product: one(product, {
		fields: [productVendor.productId],
		references: [product.id],
	}),

	/**
	 * @creatorAttribution Vendor responsible for product creation
	 * @revenueTracking Links product revenue to vendor for marketplace economics
	 */
	vendor: one(vendor, {
		fields: [productVendor.vendorId],
		references: [vendor.id],
	}),
}));

// Future implementation relations (commented for reference):

// export const instructorCredentialRelations = relations(
// 	instructorCredential,
// 	({ one, many }) => ({
// 		instructor: one(vendorInstructor, {
// 			fields: [instructorCredential.instructorVendorId],
// 			references: [vendorInstructor.vendorId],
// 		}),
// 		verificationRequests: many(credentialVerificationRequest),
// 	}),
// );

// export const organizationCredentialRequirementRelations = relations(
// 	organizationCredentialRequirement,
// 	({ one }) => ({
// 		organization: one(organization, {
// 			fields: [organizationCredentialRequirement.organizationId],
// 			references: [organization.id],
// 		}),
// 	}),
// );

// export const credentialVerificationRequestRelations = relations(
// 	credentialVerificationRequest,
// 	({ one }) => ({
// 		credential: one(instructorCredential, {
// 			fields: [credentialVerificationRequest.credentialId],
// 			references: [instructorCredential.id],
// 		}),
// 		organization: one(organization, {
// 			fields: [credentialVerificationRequest.organizationId],
// 			references: [organization.id],
// 		}),
// 		requester: one(user, {
// 			fields: [credentialVerificationRequest.requestedBy],
// 			references: [user.id],
// 		}),
// 		reviewer: one(user, {
// 			fields: [credentialVerificationRequest.assignedReviewer],
// 			references: [user.id],
// 		}),
// 	}),
// );

// export const vendorRevenueRuleRelations = relations(
// 	vendorRevenueRule,
// 	({ one }) => ({
// 		vendor: one(vendor, {
// 			fields: [vendorRevenueRule.vendorId],
// 			references: [vendor.id],
// 		}),
// 		organization: one(organization, {
// 			fields: [vendorRevenueRule.organizationId],
// 			references: [organization.id],
// 		}),
// 	}),
// );

// export const vendorVerificationRelations = relations(
// 	vendorVerification,
// 	({ one }) => ({
// 		vendor: one(vendor, {
// 			fields: [vendorVerification.vendorId],
// 			references: [vendor.id],
// 		}),
// 		organization: one(organization, {
// 			fields: [vendorVerification.organizationId],
// 			references: [organization.id],
// 		}),
// 		reviewer: one(user, {
// 			fields: [vendorVerification.reviewerId],
// 			references: [user.id],
// 		}),
// 	}),
// );
