/*
# **Vendor System Architecture - Developer Onboarding Guide**

## **🎯 Core Concept**

Our vendor system uses **Class Table Inheritance (CTI)** to handle different types of content creators and partners. Think of it as a flexible way to represent anyone who can create, collaborate on, or certify educational content on our platform.

## **📊 Base Architecture**

The foundation is the `vendor` table which contains common fields like `id`, `displayName`, `slug`, `type`, and `status`. The `organizationId` is **nullable** because some vendors (like system-defined brands) operate independently of specific organizations. The `userId` is **not** in the base vendor table since different vendor types have different user relationships.

The `type` field determines which specialized table contains the vendor's specific data. This CTI pattern gives us type safety while maintaining flexibility.

## **🎭 Two Primary Vendor Types**

### **1. Brand Vendors (`type: "brand"`)**

**Purpose:** Represents companies, institutions, or certification bodies that belong to specific organizations and provide branded content or certification.

**Key Characteristics:**

- **Organization-owned** - belongs to a specific organization via `organizationId`
- **Brand identity** - represents the organization's training/content brand
- **Certification capability** - can provide official certifications for courses
- **System-defined option** - some brands can be created by the platform (future feature)

**Example:** "TechCorp Training Division", "MIT Computer Science Department", "Adobe Creative Suite Training"

**Data Storage:** `vendor_brand` table contains brand identity like `brandName`, `brandDescription`, `logoUrl`, `brandColors`, industry information, and verification details.

**Organization Relationship:** Brands belong TO organizations. Each organization can create multiple brands for different purposes (e.g., "TechCorp Technical Training" and "TechCorp Leadership Development").

**Revenue Model:** Revenue flows directly to the owning organization, which handles internal distribution.

### **2. Instructor Vendors (`type: "instructor")`**

**Purpose:** Individual users who create and deliver educational content across multiple organizational contexts.

**Key Characteristics:**

- **User-owned** - directly connected to a user account via `userId` in `vendor_instructor`
- **Portable identity** - single instructor profile that works across all organizations
- **Multi-organizational** - can affiliate with multiple organizations simultaneously
- **Unified analytics** - all performance data tied to single instructor identity

**Example:** A React developer who teaches independently, works for TechCorp, and consults for StartupXYZ - same instructor profile, different organizational contexts.

**Data Storage:** `vendor_instructor` table contains the instructor's core professional profile: `bio`, `expertise`, `certifications`, `yearsExperience`, teaching preferences, and verification status.

## **🔄 Revolutionary Many-to-Many Organization Model**

Instead of artificial "independent" vs "organization" instructor types, we use a **single instructor identity with multiple organizational affiliations**:

### **Instructor-Organization Affiliations:**

The `instructor_organization_affiliation` table creates flexible relationships between instructors and organizations:

- **Affiliation Types:** "owner" (created own org), "employee", "contractor", "guest", "partner"
- **Role Context:** "lead_instructor", "subject_expert", "content_reviewer" within specific organization
- **Permissions:** Different capabilities per organization (`canCreateCourses`, `canManageStudents`)
- **Compensation:** Flexible models per relationship (`revenue_share`, `flat_fee`, `hourly`, `salary`)
- **Lifecycle:** Track relationship status, start/end dates, and connection method

### **Real-World User Journey:**

1. **Profile Creation:** Sarah creates single instructor vendor profile with her credentials
2. **Own Organization:** Sarah creates "Sarah's Academy" → becomes owner affiliation
3. **Employment:** TechCorp hires Sarah → employee affiliation with different compensation
4. **Consulting:** StartupXYZ engages Sarah → contractor affiliation with project-specific terms
5. **Analytics:** Sarah sees consolidated performance across all contexts

**Same instructor, multiple organizational contexts, unified identity!**

## **🏅 Comprehensive Credential Management System**

### **Global Credential Portfolio:**

The `instructor_credential` table stores the instructor's complete professional portfolio:

**Credential Types:**

- **Education:** Degrees, diplomas, academic achievements
- **Certifications:** Professional certifications, skill assessments
- **Work Experience:** Employment history, project roles
- **Projects:** Portfolio work, open source contributions
- **Awards:** Industry recognition, achievements
- **Publications:** Articles, research papers, books

**Rich Credential Data:**

- Core information (`title`, `institution`, `description`)
- Verification details (`credentialId`, `credentialUrl`, `issueDate`, `expirationDate`)
- Supporting evidence (documents, certificates, portfolio links)
- Skills and subjects covered
- Display preferences and highlighting

### **Multi-Level Verification System:**

**1. System-Level Verification (Automatic):**

- API integrations with LinkedIn, Credly, university systems
- Document analysis and pattern matching
- Third-party verification services
- Public records checking

**2. Organization-Level Verification (Manual/Hybrid):**

- Organization's HR/academic team reviews
- Interview processes and practical assessments
- Reference checks and background verification
- Custom verification workflows per organization

**3. Trust Score Calculation:**

- Weighted scoring based on credential type and verification status
- Institution reputation factors
- Peer validation and community verification
- Real-time credibility assessment

### **Organization Requirements Matching:**

The `organization_credential_requirement` table allows organizations to:

- Define mandatory vs. preferred credentials
- Set minimum experience levels
- Specify required certifications or education
- Configure automatic vs. manual verification preferences
- Apply requirements to specific roles or subject areas

## **🛠 Advanced Product Collaboration**

### **Multi-Vendor Products:**

The `product_vendor` table enables sophisticated collaboration:

**Vendor Roles:**

- **Primary:** Main content creator and course owner
- **Collaborator:** Co-instructor or content contributor  
- **Reviewer:** Technical or subject matter expert
- **Certifier:** Brand providing official certification

**Revenue Distribution:**

- Flexible revenue sharing per vendor per product
- Different compensation models based on contribution type
- Organization-context-aware revenue calculations
- Performance-based bonus structures

**Example Course Structure:**

- Primary Instructor: Sarah (50% revenue) - main content creation
- Co-Instructor: TechCorp employee (30% revenue) - specialized modules
- Certifying Brand: Microsoft (20% revenue) - official certification

## **💰 Sophisticated Revenue Architecture**

### **Context-Aware Revenue Rules:**

The `vendor_revenue_rule` table provides dynamic commission structures:

**Rule Types:**

- **Base Share:** Default revenue percentage for vendor type/context
- **Performance Bonus:** Rewards for high ratings, completion rates, student volumes
- **Volume Tiers:** Graduated rates based on total revenue or student count
- **Traffic Source:** Different rates for organic vs. paid customer acquisition

**Organizational Context:**

- Same instructor can have different revenue arrangements with different organizations
- Organization-specific bonus structures and performance incentives
- Compliance with local employment laws and contractor agreements

## **✅ Advanced Verification Workflows**

### **Type-Specific Verification Processes:**

The `vendor_verification` table handles tailored verification workflows:

**Instructor Verification:**

- Identity verification (government ID, address confirmation)
- Educational credentials (degree verification, transcript review)
- Professional experience (employment verification, reference checks)
- Teaching demonstration (sample lesson, peer review)
- Background checks (criminal history, professional misconduct)

**Brand Verification:**

- Business registration and legal standing
- Trademark and intellectual property verification
- Financial stability and insurance coverage
- Content licensing and compliance review

### **Verification Request Management:**

The `credential_verification_request` table tracks:

- Verification requests in different organizational contexts
- Assigned reviewers and workflow status
- Additional documentation requirements
- Interview scheduling and assessment results
- Decision tracking and audit trails

## **🔍 Powerful Query Patterns**

### **Instructor-Centric Queries:**

- Get instructor with all organizational affiliations and credentials
- Calculate instructor performance across all contexts
- Find instructors matching specific credential requirements
- Track instructor verification status across organizations

### **Organization-Centric Queries:**

- Get all affiliated instructors with their roles and permissions
- Find instructors meeting specific credential requirements
- Calculate organization revenue attribution across instructors
- Monitor instructor verification compliance

### **Cross-Context Analytics:**

- Instructor performance comparison across organizations
- Revenue attribution and settlement calculations
- Credential gap analysis and recommendation engines
- Trust score trends and verification success rates

## **🚀 Scalability & Future Extensions**

### **Architectural Benefits:**

- **Single instructor identity** - eliminates data duplication and inconsistency
- **Flexible relationships** - supports complex real-world collaboration patterns
- **Extensible credential system** - ready for new verification methods and credential types
- **Performance optimized** - efficient queries with clear relationship boundaries

### **Future Platform Evolution:**

The vendor architecture supports expansion into:

- **Freelance marketplace** - project-based work and gig economy features
- **Talent agency model** - managed talent pools and representation
- **Job placement services** - career advancement and hiring facilitation
- **Professional networking** - LinkedIn-like features for education industry
- **Certification marketplace** - third-party certification provider ecosystem

## **🔧 Developer Guidelines**

### **Working with Vendors:**

- Always query instructor affiliations to understand organizational context
- Use the credential system for trust and safety features
- Leverage verification workflows for quality assurance
- Consider revenue context when calculating payouts
- Use transactions when creating vendor relationships

### **Best Practices:**

- Check affiliation status and permissions before allowing instructor actions
- Cache trust scores and verification status for performance
- Use the credential matching system for intelligent instructor recommendations
- Implement proper audit trails for verification decisions
- Design UI to clearly show organizational context and instructor identity

### **Performance Considerations:**

- Index on frequently queried fields (affiliation status, verification status, credential types)
- Use materialized views for complex analytics calculations
- Cache instructor profiles and credential summaries
- Optimize joins between vendor tables and affiliation relationships

## **🎯 Platform Differentiation**

This vendor architecture creates a **unified professional identity system** that surpasses traditional LMS platforms:

**vs. Traditional Platforms:**

- **Udemy:** Instructors locked to platform, no organizational flexibility
- **Coursera:** University partnerships but limited instructor mobility
- **LinkedIn Learning:** Single employer model, no multi-organizational capability

**Our Advantages:**

- **Portable professional identity** across organizational boundaries
- **Comprehensive credential verification** with multiple validation levels
- **Flexible collaboration models** supporting real-world work patterns
- **Advanced revenue sharing** with context-aware compensation
- **Scalable architecture** ready for marketplace and networking features

The vendor system is the foundation for a **professional education ecosystem** that recognizes how people actually work - with multiple affiliations, portable reputations, and complex collaboration patterns. It transforms our platform from a simple LMS into a comprehensive professional development and networking platform.
*/

import { eq, sql } from "drizzle-orm";
import {
	boolean,
	check,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	primaryKey,
	pgTable as table,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
// Assuming these tables exist in your schema
import { createdAt, fk, id, updatedAt } from "../_utils/helpers";
import { user } from "../auth/schema";
import { contactInfo } from "../contact-info/schema";
import { organization, organizationMember } from "../organization/schema";
import { product } from "../product/schema";
import { seoMetadata } from "../seo/schema";
// organization, user, organizationMember, organizationDepartment, product

// Enums
export const vendorTypeEnum = pgEnum("vendor_type", ["instructor", "brand"]);
export const vendorStatusEnum = pgEnum("vendor_status", [
	"pending",
	"active",
	"suspended",
	"banned",
	"archived",
]);

export const affiliationTypeEnum = pgEnum("affiliation_type", [
	"owner",
	"employee",
	"contractor",
	"guest",
	"partner",
	"volunteer",
]);

export const affiliationStatusEnum = pgEnum("affiliation_status", [
	"pending",
	"active",
	"suspended",
	"terminated",
]);

export const compensationTypeEnum = pgEnum("compensation_type", [
	"revenue_share",
	"flat_fee",
	"hourly",
	"salary",
	"per_course",
	"none",
]);

export const credentialTypeEnum = pgEnum("credential_type", [
	"education",
	"certification",
	"work_experience",
	"project",
	"award",
	"publication",
	"skill_assessment",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
	"pending",
	"verified",
	"rejected",
	"expired",
	"needs_review",
]);

export const verificationRequestStatusEnum = pgEnum(
	"verification_request_status",
	["pending", "in_review", "approved", "rejected", "needs_more_info"],
);

export const vendorRoleEnum = pgEnum("vendor_role", [
	"primary",
	"collaborator",
	"co_instructor",
	"content_creator",
	"technical_reviewer",
	"certifying_body",
	"guest_expert",
]);

// Helper function for timestamps
const timestamps = {
	createdAt,
	updatedAt,
};

// ================================
// CORE VENDOR TABLES
// ================================

export const vendor = table(
	"vendor",
	{
		id,
		organizationId: fk("organization_id").references(() => organization.id, {
			onDelete: "cascade",
		}),
		type: vendorTypeEnum("type").notNull(),

		// Core vendor identity
		slug: text("slug").notNull(),
		status: vendorStatusEnum("status").default("pending"),

		// // Business details
		// businessType: text("business_type"), // "individual", "company", "nonprofit"
		// taxId: text("tax_id"),
		// businessAddress: text("business_address"),

		// // Platform metrics
		// totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default(
		// 	"0",
		// ),
		// totalProducts: integer("total_products").default(0),
		// avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
		// totalReviews: integer("total_reviews").default(0),

		// Platform relationship
		joinedAt: timestamp("joined_at").defaultNow(),
		lastActiveAt: timestamp("last_active_at"),

		...timestamps,
	},
	(t) => [
		// Unique slug per organization (or globally if organizationId is null)
		uniqueIndex("uq_vendor_slug_org").on(t.organizationId, t.slug),
		uniqueIndex("uq_vendor_slug_global")
			.on(t.slug)
			.where(sql`${t.organizationId} IS NULL`),

		index("idx_vendor_type").on(t.type),
		index("idx_vendor_organization").on(t.organizationId),
		index("idx_vendor_status").on(t.status),
		// index("idx_vendor_rating").on(t.avgRating),

		// Check constraints
		check(
			"vendor_brand_has_org",
			sql`NOT (${t.type} = 'brand' AND ${t.organizationId} IS NULL)`,
		),
	],
);

export const vendorTranslation = table(
	"vendor_translation",
	{
		id,
		vendorId: fk("vendor_id")
			.references(() => vendor.id, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(), // "en-US", "es-ES", "fr-FR"
		isDefault: boolean("is_default").default(false),

		// Translatable fields
		displayName: text("display_name"),
		description: text("description"),

		// SEO metadata reference
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		...timestamps,
	},
	(t) => [
		uniqueIndex("uq_vendor_translation_locale").on(t.vendorId, t.locale),
		uniqueIndex("uq_vendor_translation_default")
			.on(t.vendorId, t.isDefault)
			.where(eq(t.isDefault, true)),
		index("idx_vendor_translation_locale").on(t.locale),
	],
);

export const vendorContactInfo = table(
	"vendor_contact_info",
	{
		vendorId: fk("vendor_id")
			.references(() => vendor.id, { onDelete: "cascade" })
			.notNull()
			.unique(),
		contactInfoId: fk("contact_info_id")
			.references(() => contactInfo.id, { onDelete: "cascade" })
			.notNull(),
		createdAt,
	},
	(t) => [
		index("idx_vendor_contact_info_vendor").on(t.vendorId),
		index("idx_vendor_contact_info_contact").on(t.contactInfoId),
		primaryKey({
			name: "pk_vendor_contact_info",
			columns: [t.vendorId, t.contactInfoId],
		}),
	],
);

export const vendorMetrics = table(
	"vendor_metrics",
	{
		id,
		vendorId: fk("vendor_id")
			.references(() => vendor.id, { onDelete: "cascade" })
			.notNull()
			.unique(),

		// The following is commented out because it should be handled in it's own related vendor/type metrics table
		// // Engagement metrics
		// totalEngagements: integer("total_engagements").default(0),
		// totalActiveUsers: integer("total_active_users").default(0),
		// totalCoursesCompleted: integer("total_courses_completed").default(0),

		// Financial metrics
		totalRevenueGenerated: decimal("total_revenue_generated", {
			precision: 12,
			scale: 2,
		}).default("0"),
		totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).default(
			"0",
		),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}).default("70.00"),

		lastUpdatedAt: timestamp("last_updated_at").defaultNow(),

		...timestamps,
	},
	(t) => [
		index("idx_vendor_metrics_vendor").on(t.vendorId),
		index("idx_vendor_metrics_last_updated").on(t.lastUpdatedAt),
		index("idx_vendor_metrics_financial").on(
			t.totalRevenueGenerated,
			t.totalPayouts,
			t.revenueSharePercentage,
		),
	],
);

export const vendorBrand = table("vendor_brand", {
	vendorId: text("vendor_id")
		.primaryKey()
		.references(() => vendor.id, { onDelete: "cascade" }),

	// Brand identity
	logoUrl: text("logo_url"),
	colors: jsonb("colors"), // {"primary": "#1a1a1a", "secondary": "#ff6b35"}
	website: text("website"),
	socialMedia: jsonb("social_media"), // {"linkedin": "...", "twitter": "..."}

	// Business details
	industry: text("industry"),
	foundedYear: integer("founded_year"),
	headquarters: text("headquarters"),
	employeeCount: integer("employee_count"),

	// Platform presence
	isSystemDefined: boolean("is_system_defined").default(false),
	verificationLevel: text("verification_level").default("unverified"), // "unverified", "basic", "premium", "enterprise"

	// Brand capabilities
	acceptsThirdPartyContent: boolean("accepts_third_party_content").default(
		false,
	),
	whiteLabelingAvailable: boolean("white_labeling_available").default(false),
	canProvideCertification: boolean("can_provide_certification").default(false),

	// Brand metrics
	brandAwareness: decimal("brand_awareness", { precision: 5, scale: 2 }),
	customerLoyaltyScore: decimal("customer_loyalty_score", {
		precision: 3,
		scale: 2,
	}),

	...timestamps,
});

export const vendorBrandTranslation = table(
	"vendor_brand_translation",
	{
		id,
		vendorBrandId: fk("vendor_brand_id")
			.references(() => vendorBrand.vendorId, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// Translatable brand fields
		name: text("name"),
		description: text("description"),
		story: text("story"),

		// SEO metadata reference
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		...timestamps,
	},
	(t) => [
		uniqueIndex("uq_vendor_brand_translation_locale").on(
			t.vendorBrandId,
			t.locale,
		),
		uniqueIndex("uq_vendor_brand_translation_default")
			.on(t.vendorBrandId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

export const vendorBrandMetrics = table("vendor_brand_metrics", {
	id,
	vendorBrandId: fk("vendor_brand_id")
		.references(() => vendorBrand.vendorId)
		.notNull(),

	// // Brand-specific metrics
	// brandRecognition: decimal("brand_recognition", { precision: 5, scale: 2 }),
	// contentCertifications: integer("content_certifications").default(0),
	// partnerOrganizations: integer("partner_organizations").default(0),
	// brandedCourses: integer("branded_courses").default(0),

	lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
	...timestamps,
});

export const vendorInstructor = table(
	"vendor_instructor",
	{
		vendorId: text("vendor_id")
			.primaryKey()
			.references(() => vendor.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }), // The following is commented out because it should be handled in it's own related tables, maybe in the same way as LinkedIn Learning or Udemy, with as many tables as needed
		// // Professional identity
		// expertise: text("expertise").array(),
		// yearsExperience: integer("years_experience"),

		// The following is commented out because it's not needed for now, but may be added later in this way or in some other way if seems valuable
		// // Teaching profile
		// teachingStyle: text("teaching_style"), // "hands-on", "theoretical", "mixed", "interactive"
		// preferredSubjects: text("preferred_subjects").array(),
		// languagesSpoken: text("languages_spoken").array(),
		// /**
		//  * ```json
		//  *	{
		//  *		"timezone": "UTC-5",
		//  *		"available_days": ["monday", "tuesday", "wednesday"],
		//  *		"available_hours": {"start": "09:00", "end": "17:00"},
		//  *		"flexible": true
		//  *	}
		//  * ```
		//  */
		// availabilitySchedule: jsonb("availability_schedule"),

		// The following is commented out because it should be handled in it's own related course/class table, will be covered on there not here for now
		// // Teaching preferences
		// isAcceptingStudents: boolean("is_accepting_students").default(true),
		// maxStudentsPerCourse: integer("max_students_per_course"),
		// preferredClassSize: text("preferred_class_size"), // "small", "medium", "large", "unlimited"

		// // Instructor metrics
		// totalStudents: integer("total_students").default(0),
		// totalCourses: integer("total_courses").default(0),
		// completionRate: decimal("completion_rate", { precision: 5, scale: 2 }),
		// studentSatisfactionScore: decimal("student_satisfaction_score", {
		// 	precision: 3,
		// 	scale: 2,
		// }),

		// The following is commented out because it should be handled in it's own related table, maybe in the same way as LinkedIn Learning or Udemy, with as many tables as needed, but how to handle it and what's the best way to do it _(hence it should be well thought out)_?
		// // Verification status
		// identityVerified: boolean("identity_verified").default(false),
		// expertiseVerified: boolean("expertise_verified").default(false),
		// backgroundChecked: boolean("background_checked").default(false),
		// teachingDemoCompleted: boolean("teaching_demo_completed").default(false),

		// // Trust and safety
		// trustScore: decimal("trust_score", { precision: 5, scale: 2 }),
		// lastTrustScoreUpdate: timestamp("last_trust_score_update"),

		...timestamps,
	},
	(t) => [
		uniqueIndex("uq_instructor_user").on(t.userId),
		// index("idx_instructor_expertise").on(t.expertise),
		// index("idx_instructor_verification").on(
		// 	t.identityVerified,
		// 	t.expertiseVerified,
		// ),
		// index("idx_instructor_accepting").on(t.isAcceptingStudents),
		// index("idx_instructor_trust_score").on(t.trustScore),
	],
);

export const vendorInstructorTranslation = table(
	"vendor_instructor_translation",
	{
		id,
		vendorInstructorId: fk("vendor_instructor_id")
			.references(() => vendorInstructor.vendorId, { onDelete: "cascade" })
			.notNull(),
		locale: text("locale").notNull(),
		isDefault: boolean("is_default").default(false),

		// // Professional identity
		// // Translatable instructor fields
		// professionalTitle: text("professional_title"),
		// bio: text("bio"),
		// specialization: text("specialization"),

		// // Teaching preferences (localized)
		// teachingPhilosophy: text("teaching_philosophy"),
		// studentMessage: text("student_message"), // Welcome message to students

		// SEO metadata reference
		seoMetadataId: fk("seo_metadata_id").references(() => seoMetadata.id, {
			onDelete: "set null",
		}),

		...timestamps,
	},
	(t) => [
		uniqueIndex("uq_vendor_instructor_translation_locale").on(
			t.vendorInstructorId,
			t.locale,
		),
		uniqueIndex("uq_vendor_instructor_translation_default")
			.on(t.vendorInstructorId, t.isDefault)
			.where(eq(t.isDefault, true)),
	],
);

export const vendorInstructorMetrics = table(
	"vendor_instructor_metrics",
	{
		id,
		vendorInstructorId: fk("vendor_instructor_id")
			.references(() => vendorInstructor.vendorId, { onDelete: "cascade" })
			.notNull(),
		// Engagement metrics
		totalStudents: integer("total_students").default(0),

		avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default(
			"0.00",
		),
		totalReviews: integer("total_reviews").default(0),

		// totalCourses: integer("total_courses").default(0),
		// totalCoursesCompleted: integer("total_courses_completed").default(0),
		// totalCoursesInProgress: integer("total_courses_in_progress").default(0),

		// // Time-based metrics
		// avgSessionDuration: decimal("avg_session_duration", {
		// 	precision: 8,
		// 	scale: 2,
		// }),
		// peakActivityHours: text("peak_activity_hours").array(),

		// // Quality metrics (when review system is ready)
		// qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
		// responseTime: decimal("avg_response_time", { precision: 8, scale: 2 }), // hours

		// // Engagement metrics
		// forumParticipation: integer("forum_participation").default(0),
		// studentInteractions: integer("student_interactions").default(0),

		// On what term do we count active users? Daily, weekly, monthly, or others?
		// totalActiveUsers: integer("total_active_users").default(0),
		// On what term do we count engagements? Daily, weekly, monthly, or others?
		// totalEngagements: integer("total_engagements").default(0),

		// The following is commented out because it should be handled in it's own related vendor and organization financial metrics table
		// // Financial metrics
		// totalRevenueGenerated: decimal("total_revenue_generated", {
		// 	precision: 12,
		// 	scale: 2,
		// }).default("0"),
		// totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).default(
		// 	"0",
		// ),
		// revenueSharePercentage: decimal("revenue_share_percentage", {
		// 	precision: 5,
		// 	scale: 2,
		// }).default("70.00"),
		// // The following is commented out because the review system is not implemented yet, but will be in the future
		// // Performance metrics
		// avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default(
		// 	"0.00",
		// ),
		// totalReviews: integer("total_reviews").default(0),
		// completionRate: decimal("completion_rate", {
		// 	precision: 5,
		// 	scale: 2,
		// }).default("0.00"),
		// studentSatisfactionScore: decimal("student_satisfaction_score", {
		// 	precision: 3,
		// 	scale: 2,
		// }).default("0.00"),
		// The following is commented out because it's not needed for now, but may be added later in this way or in some other way if seems valuable
		// // Trust and safety
		// trustScore: decimal("trust_score", { precision: 5, scale: 2 }).default(
		// 	"0.00",
		// ),
		// lastTrustScoreUpdate: timestamp("last_trust_score_update").defaultNow(),
		// Last updated
		lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
		...timestamps,
	},
	(t) => [
		index("idx_instructor_metrics_instructor").on(t.vendorInstructorId),
		// index("idx_instructor_metrics_engagement").on(
		// 	t.totalStudents,
		// 	t.totalCourses,
		// 	t.totalCoursesCompleted,
		// 	t.totalCoursesInProgress,
		// 	t.totalActiveUsers,
		// 	t.totalEngagements,
		// ),
		index("idx_instructor_metrics_last_updated").on(t.lastUpdatedAt),
	],
);

export const vendorInstructorCoursesMetrics = table(
	"vendor_instructor_courses_metrics",
	{
		id,
		vendorInstructorId: fk("vendor_instructor_id")
			.references(() => vendorInstructor.vendorId, { onDelete: "cascade" })
			.notNull(),
		total: integer("total_courses").default(0),
		// totalCompleted: integer("total_courses_completed").default(0),
		// totalInProgress: integer("total_courses_in_progress").default(0),
		totalCompletedByStudents: integer(
			"total_courses_completed_by_students",
		).default(0),
		totalInProgressByStudents: integer(
			"total_courses_in_progress_by_students",
		).default(0),

		avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default(
			"0.00",
		),
		totalReviews: integer("total_reviews").default(0),
		// totalActive: integer("total_courses_active").default(0),
		// totalArchived: integer("total_courses_archived").default(0),
		// totalPending: integer("total_courses_pending").default(0),
		// totalDraft: integer("total_courses_draft").default(0),
		// totalRejected: integer("total_courses_rejected").default(0),
		// totalPublished: integer("total_courses_published").default(0),
		// totalUnpublished: integer("total_courses_unpublished").default(0),
		// totalScheduled: integer("total_courses_scheduled").default(0),
		// totalCancelled: integer("total_courses_cancelled").default(0),
		// totalFailed: integer("total_courses_failed").default(0),
		// totalWaitingForApproval: integer("total_courses_waiting_for_approval").default(
		// 	0,
		// ),
		// totalWithReviews: integer("total_courses_with_reviews").default(0),
		// totalWithRatings: integer("total_courses_with_ratings").default(0),
		// totalWithFeedback: integer("total_courses_with_feedback").default(0),
		// totalWithCertificates: integer("total_courses_with_certificates").default(0),
	},
	(t) => [
		index("idx_instructor_courses_metrics_instructor").on(t.vendorInstructorId),
		index("idx_instructor_courses_metrics_total").on(t.total),
		index("idx_instructor_courses_metrics_avg_rating").on(t.avgRating),
		index("idx_instructor_courses_metrics_total_reviews").on(t.totalReviews),
	],
);

// ================================
// INSTRUCTOR-ORGANIZATION RELATIONSHIPS
// ================================

export const instructorOrganizationAffiliation = table(
	"instructor_organization_affiliation",
	{
		id,
		instructorVendorId: text("instructor_vendor_id")
			.notNull()
			.references(() => vendor.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),

		// User connection (flexible for employees vs collaborators)
		userId: fk("user_id").references(() => user.id),
		orgMemberId: fk("org_member_id").references(() => organizationMember.id),

		// Relationship context
		affiliationType: affiliationTypeEnum("affiliation_type").notNull(),
		role: text("role"), // "lead_instructor", "subject_expert", "guest_lecturer", "content_reviewer"
		title: text("title"), // "Senior Training Manager", "Principal Instructor"

		// The following is commented out because it should be handled in another way, not like this, needs to be well thought out
		// // Permissions within this organization
		// canCreateCourses: boolean("can_create_courses").default(true),
		// canManageStudents: boolean("can_manage_students").default(false),
		// canAccessAnalytics: boolean("can_access_analytics").default(true),
		// canManageOtherInstructors: boolean("can_manage_other_instructors").default(
		// 	false,
		// ),
		// authorizationLevel: text("authorization_level").default("standard"), // "restricted", "standard", "elevated", "admin"

		// Compensation for this relationship
		compensationType:
			compensationTypeEnum("compensation_type").default("revenue_share"),
		compensationAmount: decimal("compensation_amount", {
			precision: 10,
			scale: 2,
		}),
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),

		// Relationship lifecycle
		status: affiliationStatusEnum("status").default("pending"),
		startedAt: timestamp("started_at").defaultNow(),
		endedAt: timestamp("ended_at"),

		// Connection tracking
		connectionMethod: text("connection_method"), // "self_created_org", "invited", "applied", "imported", "transferred"
		invitedBy: fk("invited_by").references(() => user.id),
		applicationNotes: text("application_notes"),
		// The approval process is optional, but if used:
		// - If the organization requires approval, the affiliation is pending until approved
		// - If the organization does not require approval, the affiliation is active immediately
		// - If the affiliation is approved, the status changes to active
		// - If the affiliation is rejected, the status changes to rejected
		// The approval is done by an organization member with the appropriate permissions
		approvedBy: fk("approved_by").references(() => organizationMember.id),
		approvedAt: timestamp("approved_at"),

		...timestamps,
	},
	(t) => [
		// One active relationship per instructor per organization
		uniqueIndex("uq_instructor_org_active")
			.on(t.instructorVendorId, t.organizationId)
			.where(eq(t.status, "active")),

		index("idx_affiliation_instructor").on(t.instructorVendorId),
		index("idx_affiliation_organization").on(t.organizationId),
		index("idx_affiliation_type").on(t.affiliationType),
		index("idx_affiliation_status").on(t.status),
		index("idx_affiliation_user").on(t.userId),
		index("idx_affiliation_member").on(t.orgMemberId),

		// Either userId OR orgMemberId must be set
		check(
			"affiliation_user_connection",
			sql`(${t.userId} IS NOT NULL) OR (${t.orgMemberId} IS NOT NULL)`,
		),
	],
);

// ================================
// PRODUCT-VENDOR RELATIONSHIPS
// ================================

export const productVendor = table(
	"product_vendor",
	{
		id,
		productId: text("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		vendorId: text("vendor_id")
			.notNull()
			.references(() => vendor.id, { onDelete: "cascade" }),

		// Vendor role in this product
		role: vendorRoleEnum("role").notNull(),

		// Revenue sharing for this specific product
		revenueSharePercentage: decimal("revenue_share_percentage", {
			precision: 5,
			scale: 2,
		}),
		fixedCompensation: decimal("fixed_compensation", {
			precision: 10,
			scale: 2,
		}),

		// Contribution details
		contributionType: text("contribution_type").array(), // ["content", "marketing", "support", "certification", "review"]
		contributionWeight: decimal("contribution_weight", {
			precision: 3,
			scale: 2,
		}), // 0.00-1.00
		contributionDescription: text("contribution_description"),

		// Attribution and display
		isPubliclyVisible: boolean("is_publicly_visible").default(true),
		displayOrder: integer("display_order").default(1),
		displayName: text("display_name"), // Override vendor display name for this product

		// Collaboration terms
		exclusivityLevel: text("exclusivity_level"), // "exclusive", "non_exclusive", "preferred"
		collaborationAgreement: text("collaboration_agreement"), // Reference to agreement document

		// Status and lifecycle
		status: text("status").default("active"), // "pending", "active", "suspended", "removed", "completed"
		startDate: timestamp("start_date").defaultNow(),
		endDate: timestamp("end_date"),

		// Performance tracking
		performanceMetrics: jsonb("performance_metrics"),
		/*
  {
    "content_completion_percentage": 85,
    "quality_score": 9.2,
    "deadline_adherence": "excellent",
    "student_feedback_score": 4.7
  }
  */

		...timestamps,
	},
	(t) => [
		// Only one primary vendor per product
		uniqueIndex("uq_product_vendor_primary")
			.on(t.productId, t.role)
			.where(eq(t.role, "primary")),

		index("idx_product_vendor_product").on(t.productId),
		index("idx_product_vendor_vendor").on(t.vendorId),
		index("idx_product_vendor_role").on(t.role),
		index("idx_product_vendor_status").on(t.status),
		index("idx_product_vendor_visible").on(t.isPubliclyVisible),
	],
);

// The following are commented out because they are not needed for now, but may be added later in this way or in some other way if seems valuable

// Business settings change independently of vendor identity
// Sensitive financial data isolation
// Different access patterns and security requirements
// export const vendorBusinessSettings = table("vendor_business_settings", {
//   id,
//   vendorId: fk("vendor_id").references(() => vendor.id, { onDelete: "cascade" }).notNull().unique(),

//   // Business details
//   businessType: text("business_type"), // "individual", "company", "nonprofit"
//   taxId: text("tax_id"),
//   businessAddress: text("business_address"),

//   // Financial settings
//   defaultRevenueShare: decimal("default_revenue_share", { precision: 5, scale: 2 }).default("70.00"),
//   minimumPayoutAmount: decimal("minimum_payout_amount", { precision: 8, scale: 2 }).default("50.00"),
//   payoutSchedule: text("payout_schedule").default("monthly"),

//   // Banking/Payment info
//   paymentMethod: text("payment_method"), // "bank_transfer", "paypal", "stripe"
//   bankingDetails: jsonb("banking_details"), // Encrypted banking info

//   ...timestamps,
// });
// // ================================
// // CREDENTIAL MANAGEMENT
// // ================================

// export const instructorCredential = table(
// 	"instructor_credential",
// 	{
// 		id,
// 		instructorVendorId: text("instructor_vendor_id")
// 			.notNull()
// 			.references(() => vendor.id, { onDelete: "cascade" }),

// 		// Credential classification
// 		credentialType: credentialTypeEnum("credential_type").notNull(),
// 		category: text("category"), // "degree", "professional_cert", "skill_assessment", "achievement", "license"
// 		subcategory: text("subcategory"), // "bachelor", "master", "phd", "aws", "microsoft", "google"

// 		// Core credential data
// 		title: text("title").notNull(),
// 		institution: text("institution").notNull(),
// 		description: text("description"),
// 		field: text("field"), // "Computer Science", "Business Administration", "Data Science"

// 		// Verification data
// 		credentialId: text("credential_id"), // External credential ID/number
// 		issueDate: date("issue_date"),
// 		expirationDate: date("expiration_date"),
// 		credentialUrl: text("credential_url"), // Direct link to verify

// 		// Supporting evidence
// 		documents: jsonb("documents"),
// 		/*
//   {
//     "certificate_url": "https://...",
//     "transcript_url": "https://...",
//     "portfolio_links": ["github.com/user", "portfolio.com"],
//     "recommendation_letters": ["letter1.pdf"],
//     "verification_screenshots": ["screenshot1.png"]
//   }
//   */

// 		// Skills and competencies
// 		skills: text("skills").array(),
// 		subjects: text("subjects").array(),
// 		competencyLevel: text("competency_level"), // "beginner", "intermediate", "advanced", "expert"

// 		// Academic/Professional details (for education/work experience)
// 		gpa: decimal("gpa", { precision: 3, scale: 2 }),
// 		honors: text("honors"),
// 		duration: text("duration"), // "4 years", "6 months", "ongoing"
// 		location: text("location"),

// 		// Verification status
// 		verificationStatus: verificationStatusEnum("verification_status").default(
// 			"pending",
// 		),
// 		verifiedBy: text("verified_by"), // "system", "organization", "third_party", "manual"
// 		verifierData: jsonb("verifier_data"),
// 		/*
//   {
//     "verifier_type": "automatic", // "automatic", "manual", "third_party"
//     "verification_method": "api_check", // "api_check", "document_review", "manual_verification", "blockchain"
//     "verified_by_user_id": "admin-123",
//     "verified_by_org_id": "techcorp-456",
//     "verification_notes": "Confirmed via LinkedIn API",
//     "confidence_score": 0.95,
//     "verification_timestamp": "2024-01-15T10:30:00Z",
//     "external_verification_id": "linkedin-verification-123"
//   }
//   */

// 		// Display and privacy settings
// 		isPublic: boolean("is_public").default(true),
// 		displayOrder: integer("display_order").default(0),
// 		isHighlighted: boolean("is_highlighted").default(false),
// 		isFeatured: boolean("is_featured").default(false),

// 		// Metadata
// 		tags: text("tags").array(),
// 		notes: text("notes"), // Private notes for the instructor

// 		...timestamps,
// 	},
// 	(t) => [
// 		index("idx_credential_instructor").on(t.instructorVendorId),
// 		index("idx_credential_type").on(t.credentialType),
// 		index("idx_credential_category").on(t.category),
// 		index("idx_credential_verification").on(t.verificationStatus),
// 		index("idx_credential_skills").on(t.skills),
// 		index("idx_credential_expiration").on(t.expirationDate),
// 		index("idx_credential_institution").on(t.institution),
// 		index("idx_credential_public").on(t.isPublic),
// 		index("idx_credential_featured").on(t.isFeatured),
// 		index("idx_credential_issue_date").on(t.issueDate),
// 	],
// );

// export const organizationCredentialRequirement = table(
// 	"organization_credential_requirement",
// 	{
// 		id,
// 		organizationId: text("organization_id")
// 			.notNull()
// 			.references(() => organization.id, { onDelete: "cascade" }),

// 		// Requirement definition
// 		requirementName: text("requirement_name").notNull(),
// 		requirementType: text("requirement_type").notNull(), // "mandatory", "preferred", "nice_to_have"
// 		credentialCategory: text("credential_category"), // "education", "certification", "experience"

// 		// Specific requirements
// 		requiredSkills: text("required_skills").array(),
// 		minimumYearsExperience: integer("minimum_years_experience"),
// 		requiredCertifications: text("required_certifications").array(),
// 		requiredEducationLevel: text("required_education_level"), // "high_school", "bachelor", "master", "phd"
// 		requiredInstitutions: text("required_institutions").array(), // Specific institutions if required

// 		// Verification settings
// 		requiresOrganizationVerification: boolean(
// 			"requires_organization_verification",
// 		).default(false),
// 		autoAcceptVerifiedCredentials: boolean(
// 			"auto_accept_verified_credentials",
// 		).default(true),
// 		requiresInterviewVerification: boolean(
// 			"requires_interview_verification",
// 		).default(false),

// 		// Application context
// 		appliesTo: text("applies_to").default("all_instructors"), // "all_instructors", "lead_instructors", "subject_specific", "role_specific"
// 		subjectAreas: text("subject_areas").array(),
// 		roles: text("roles").array(),
// 		departments: text("departments").array(),

// 		// Requirement details
// 		description: text("description"),
// 		priority: integer("priority").default(1),
// 		expirationPolicy: text("expiration_policy"), // "never", "annual_review", "credential_expiry"

// 		isActive: boolean("is_active").default(true),

// 		...timestamps,
// 	},
// 	(t) => [
// 		index("idx_org_requirement_organization").on(t.organizationId),
// 		index("idx_org_requirement_type").on(t.requirementType),
// 		index("idx_org_requirement_category").on(t.credentialCategory),
// 		index("idx_org_requirement_active").on(t.isActive),
// 		index("idx_org_requirement_applies_to").on(t.appliesTo),
// 	],
// );

// export const credentialVerificationRequest = table(
// 	"credential_verification_request",
// 	{
// 		id,
// 		credentialId: text("credential_id")
// 			.notNull()
// 			.references(() => instructorCredential.id, { onDelete: "cascade" }),
// 		organizationId: fk("organization_id").references(() => organization.id),

// 		// Request context
// 		requestType: text("request_type").notNull(), // "affiliation_application", "course_submission", "role_upgrade", "periodic_review"
// 		requestedBy: text("requested_by")
// 			.notNull()
// 			.references(() => user.id),
// 		requestReason: text("request_reason"),

// 		// Verification process
// 		status: verificationRequestStatusEnum("status").default("pending"),
// 		assignedReviewer: fk("assigned_reviewer").references(() => user.id),
// 		reviewerNotes: text("reviewer_notes"),
// 		priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"

// 		// Verification details
// 		verificationMethod: text("verification_method"), // "document_review", "api_verification", "interview", "reference_check"
// 		additionalDocumentsRequested: text(
// 			"additional_documents_requested",
// 		).array(),
// 		interviewRequired: boolean("interview_required").default(false),
// 		interviewScheduledAt: timestamp("interview_scheduled_at"),
// 		interviewCompletedAt: timestamp("interview_completed_at"),

// 		// Decision tracking
// 		approvedAt: timestamp("approved_at"),
// 		rejectedAt: timestamp("rejected_at"),
// 		rejectionReason: text("rejection_reason"),
// 		confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),

// 		// Verification evidence
// 		verificationEvidence: jsonb("verification_evidence"),
// 		/*
//   {
//     "documents_reviewed": ["transcript.pdf", "certificate.jpg"],
//     "api_responses": {"linkedin": {...}, "university": {...}},
//     "interview_notes": "Candidate demonstrated strong knowledge...",
//     "reference_contacts": [{"name": "...", "email": "...", "verified": true}]
//   }
//   */

// 		...timestamps,
// 	},
// 	(t) => [
// 		index("idx_verification_request_credential").on(t.credentialId),
// 		index("idx_verification_request_organization").on(t.organizationId),
// 		index("idx_verification_request_status").on(t.status),
// 		index("idx_verification_request_reviewer").on(t.assignedReviewer),
// 		index("idx_verification_request_type").on(t.requestType),
// 		index("idx_verification_request_priority").on(t.priority),
// 	],
// );

// // ================================
// // REVENUE MANAGEMENT
// // ================================

// export const vendorRevenueRule = table(
// 	"vendor_revenue_rule",
// 	{
// 		id,
// 		vendorId: text("vendor_id")
// 			.notNull()
// 			.references(() => vendor.id, { onDelete: "cascade" }),
// 		organizationId: fk("organization_id").references(() => organization.id),

// 		// Rule configuration
// 		ruleName: text("rule_name").notNull(),
// 		ruleType: text("rule_type").notNull(), // "base_share", "performance_bonus", "volume_tier", "referral_bonus"

// 		// Conditions (using JSONB for flexibility)
// 		conditions: jsonb("conditions"),
// 		/*
//   Examples by vendor type and context:

//   Instructor Base Rate:
//   {
//     "vendor_type": "instructor",
//     "affiliation_type": "employee",
//     "traffic_source": "organic",
//     "course_category": "programming"
//   }

//   Performance Bonus:
//   {
//     "min_rating": 4.5,
//     "min_students": 1000,
//     "completion_rate": ">80%"
//   }

//   Volume Tier:
//   {
//     "revenue_threshold": 50000,
//     "student_threshold": 5000,
//     "courses_threshold": 10
//   }

//   Brand Partnership:
//   {
//     "exclusivity": true,
//     "co_marketing": true,
//     "certification_provided": true
//   }
//   */

// 		// Revenue calculation
// 		sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }),
// 		fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }),
// 		bonusPercentage: decimal("bonus_percentage", { precision: 5, scale: 2 }),
// 		maxPayout: decimal("max_payout", { precision: 10, scale: 2 }),
// 		minPayout: decimal("min_payout", { precision: 10, scale: 2 }),

// 		// Rule metadata
// 		priority: integer("priority").default(1),
// 		isActive: boolean("is_active").default(true),
// 		effectiveFrom: timestamp("effective_from").defaultNow(),
// 		effectiveTo: timestamp("effective_to"),

// 		// Rule description and notes
// 		description: text("description"),
// 		internalNotes: text("internal_notes"),

// 		...timestamps,
// 	},
// 	(t) => [
// 		index("idx_revenue_rule_vendor").on(t.vendorId),
// 		index("idx_revenue_rule_organization").on(t.organizationId),
// 		index("idx_revenue_rule_type").on(t.ruleType),
// 		index("idx_revenue_rule_active").on(t.isActive),
// 		index("idx_revenue_rule_effective").on(t.effectiveFrom, t.effectiveTo),
// 		index("idx_revenue_rule_priority").on(t.priority),
// 	],
// );

// export const vendorVerification = table(
// 	"vendor_verification",
// 	{
// 		id,
// 		vendorId: text("vendor_id")
// 			.notNull()
// 			.references(() => vendor.id, { onDelete: "cascade" }),
// 		organizationId: fk("organization_id").references(() => organization.id),

// 		// Verification type (depends on vendor.type and context)
// 		verificationType: text("verification_type").notNull(),
// 		/*
//   Instructor: "identity", "education", "experience", "teaching_demo", "background_check"
//   Brand: "business_registration", "trademark", "financial_standing", "insurance"
//   Organization-specific: "internal_authorization", "compliance_check", "reference_verification"
//   */

// 		// Verification data
// 		submittedData: jsonb("submitted_data"),
// 		requiredDocuments: text("required_documents").array(),
// 		submittedDocuments: jsonb("submitted_documents"),
// 		/*
//   {
//     "government_id": {"url": "...", "type": "passport", "verified": true},
//     "diploma": {"url": "...", "institution": "MIT", "verified": false},
//     "work_portfolio": {"urls": ["...", "..."], "description": "..."}
//   }
//   */

// 		// Review process
// 		status: verificationStatusEnum("status").default("pending"),
// 		reviewerId: fk("reviewer_id").references(() => user.id),
// 		reviewerNotes: text("reviewer_notes"),
// 		reviewMethod: text("review_method"), // "automated", "manual", "hybrid", "third_party"

// 		// Verification result
// 		verificationScore: integer("verification_score"), // 0-100
// 		confidenceLevel: text("confidence_level"), // "low", "medium", "high", "very_high"
// 		verifiedAt: timestamp("verified_at"),
// 		expiresAt: timestamp("expires_at"),

// 		// External verification
// 		externalVerificationId: text("external_verification_id"),
// 		externalVerifierName: text("external_verifier_name"),

// 		// Failure/rejection details
// 		rejectionReason: text("rejection_reason"),
// 		requiredActions: text("required_actions").array(),

// 		...timestamps,
// 	},
// 	(t) => [
// 		index("idx_vendor_verification_vendor").on(t.vendorId),
// 		index("idx_vendor_verification_organization").on(t.organizationId),
// 		index("idx_vendor_verification_type").on(t.verificationType),
// 		index("idx_vendor_verification_status").on(t.status),
// 		index("idx_vendor_verification_expires").on(t.expiresAt),
// 		index("idx_vendor_verification_reviewer").on(t.reviewerId),
// 		index("idx_vendor_verification_score").on(t.verificationScore),
// 	],
// );

// // ================================
// // RELATIONS
// // ================================

// // Will be handled on it's own `relations.js` file

/*
🚀 Implementation Priority
Phase 1 (Immediate):
✅ Implement your current schema (it's solid!)
✅ Add vendorBusinessSettings table
✅ Use JSONB for instructor profile/preferences
✅ Simple verification status in JSONB
Phase 2 (When needed):
Role-based permissions system
Dedicated verification workflow tables
Advanced credential management
Complex revenue rules engine
Phase 3 (Future):
AI-powered trust scoring
Blockchain verification
Advanced analytics and ML features
🎯 Final Recommendations
Keep Your Pragmatic Approach:
✅ Start simple, evolve complexity
✅ Use JSONB for flexible/evolving data
✅ Separate concerns (contact, metrics, business settings)
✅ Comment out future features until needed
Add These Missing Pieces:
vendorBusinessSettings table
Role-based permissions (replace individual permission fields)
Brand metrics table for consistency
Primary contact constraint in vendorContactInfo
*/
