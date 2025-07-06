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

export const vendorRelations = relations(vendor, ({ one, many }) => ({
	organization: one(organization, {
		fields: [vendor.organizationId],
		references: [organization.id],
	}),
	translations: many(vendorTranslation),

	// CTI relations (only one will be populated based on type)
	brand: one(vendorBrand, {
		fields: [vendor.id],
		references: [vendorBrand.vendorId],
	}),
	instructor: one(vendorInstructor, {
		fields: [vendor.id],
		references: [vendorInstructor.vendorId],
	}),

	// Common relations
	products: many(productVendor),
	// revenueRules: many(vendorRevenueRule),
	// verifications: many(vendorVerification),
	contactInfo: many(vendorContactInfo),
	metrics: one(vendorMetrics, {
		fields: [vendor.id],
		references: [vendorMetrics.vendorId],
	}),

	// Instructor-specific relations
	affiliations: many(instructorOrganizationAffiliation),
	// credentials: many(instructorCredential),
}));

export const vendorTranslationRelations = relations(vendorTranslation, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorTranslation.vendorId],
		references: [vendor.id],
	}),
	seoMetadata: one(seoMetadata, {
		fields: [vendorTranslation.seoMetadataId],
		references: [seoMetadata.id],
	}),
}));

export const vendorContactInfoRelations = relations(vendorContactInfo, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorContactInfo.vendorId],
		references: [vendor.id],
	}),
	contactInfo: one(contactInfo, {
		fields: [vendorContactInfo.contactInfoId],
		references: [contactInfo.id],
	}),
}));

export const vendorMetricsRelations = relations(vendorMetrics, ({ one }) => ({
	vendor: one(vendor, {
		fields: [vendorMetrics.vendorId],
		references: [vendor.id],
	}),
}));

export const vendorBrandRelations = relations(vendorBrand, ({ one, many }) => ({
	vendor: one(vendor, {
		fields: [vendorBrand.vendorId],
		references: [vendor.id],
	}),
	metrics: one(vendorBrandMetrics, {
		fields: [vendorBrand.vendorId],
		references: [vendorBrandMetrics.vendorBrandId],
	}),
	translations: many(vendorTranslation),
}));

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

export const vendorBrandMetricsRelations = relations(vendorBrandMetrics, ({ one }) => ({
	vendorBrand: one(vendorBrand, {
		fields: [vendorBrandMetrics.vendorBrandId],
		references: [vendorBrand.vendorId],
	}),
}));

export const vendorInstructorRelations = relations(vendorInstructor, ({ one, many }) => ({
	translations: many(vendorInstructorTranslation),
	vendor: one(vendor, {
		fields: [vendorInstructor.vendorId],
		references: [vendor.id],
	}),
	user: one(user, {
		fields: [vendorInstructor.userId],
		references: [user.id],
	}),
	affiliations: many(instructorOrganizationAffiliation),
	// credentials: many(instructorCredential),
	metrics: one(vendorInstructorMetrics, {
		fields: [vendorInstructor.vendorId],
		references: [vendorInstructorMetrics.vendorInstructorId],
	}),
	coursesMetrics: one(vendorInstructorCoursesMetrics, {
		fields: [vendorInstructor.vendorId],
		references: [vendorInstructorCoursesMetrics.vendorInstructorId],
	}),
}));

export const vendorInstructorTranslationRelations = relations(
	vendorInstructorTranslation,
	({ one }) => ({
		vendorInstructor: one(vendorInstructor, {
			fields: [vendorInstructorTranslation.vendorInstructorId],
			references: [vendorInstructor.vendorId],
		}),
		seoMetadata: one(seoMetadata, {
			fields: [vendorInstructorTranslation.seoMetadataId],
			references: [seoMetadata.id],
		}),
	}),
);

export const vendorInstructorMetricsRelations = relations(vendorInstructorMetrics, ({ one }) => ({
	vendorInstructor: one(vendorInstructor, {
		fields: [vendorInstructorMetrics.vendorInstructorId],
		references: [vendorInstructor.vendorId],
	}),
}));

export const vendorInstructorCoursesMetricsRelations = relations(
	vendorInstructorCoursesMetrics,
	({ one }) => ({
		vendorInstructor: one(vendorInstructor, {
			fields: [vendorInstructorCoursesMetrics.vendorInstructorId],
			references: [vendorInstructor.vendorId],
		}),
	}),
);

export const instructorOrganizationAffiliationRelations = relations(
	instructorOrganizationAffiliation,
	({ one }) => ({
		instructor: one(vendorInstructor, {
			fields: [instructorOrganizationAffiliation.instructorVendorId],
			references: [vendorInstructor.vendorId],
		}),
		organization: one(organization, {
			fields: [instructorOrganizationAffiliation.organizationId],
			references: [organization.id],
		}),
		user: one(user, {
			fields: [instructorOrganizationAffiliation.userId],
			references: [user.id],
		}),
		orgMember: one(organizationMember, {
			fields: [instructorOrganizationAffiliation.orgMemberId],
			references: [organizationMember.id],
		}),

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

export const productVendorRelations = relations(productVendor, ({ one }) => ({
	product: one(product, {
		fields: [productVendor.productId],
		references: [product.id],
	}),
	vendor: one(vendor, {
		fields: [productVendor.vendorId],
		references: [vendor.id],
	}),
}));

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
