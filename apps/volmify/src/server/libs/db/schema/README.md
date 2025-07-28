# **📚 Volmify Database Schema Overview - Updated**

## **🎓 What Volmify Is**

### **Primary Purpose**
Volmify is a comprehensive **creator economy platform** that combines learning management, e-commerce, and professional marketplace capabilities. It enables organizations to create, sell, and manage educational content while providing sophisticated employee management and revenue attribution systems.

### **Core Capabilities**
- **Learning Management System (LMS)**: Course creation, enrollment, progress tracking
- **E-commerce Platform**: Product sales, subscriptions, gift cards, payment processing  
- **Creator Economy**: Revenue attribution, professional profiles, compensation management
- **Employee Management**: Staff onboarding, department organization, approval workflows
- **Professional Marketplace**: Cross-organizational job profiles, skill attribution, reputation systems

## **🏗 Core Architecture Principles**

### **Multi-Tenant Foundation**
Every entity in Volmify is scoped to an organization (`orgId`), ensuring complete data isolation and supporting multiple independent tenants on the same platform.

### **User Identity Hierarchy**
```
User (platform identity)
├── userProfile (main) - base customer profile  
└── userProfile (job) - professional profiles

orgMember (tenant-scoped customer/learner)
└── orgEmployee (enhanced staff role with optional job profile link)
```

### **Role Separation**
- **Members**: Customers and learners who place orders, enroll in courses, participate in community
- **Employees**: Staff and creators who create content, receive revenue attribution, manage operations
- **Same user can be both**: Member (customer) AND employee (creator) within the same organization

## **👤 User Management System**

### **Platform Identity**
- **`user`**: Universal identity across the entire platform - cross-tenant, login-capable, globally unique
- **`userProfile`**: User's contextual profiles - one main profile (customer identity) and multiple job profiles (professional identities)
- **`userJobProfile`**: Professional profiles that work across organizations, enabling reputation and skill tracking

### **Tenant-Scoped Identity**
- **`orgMember`**: User's presence within a specific organization as customer/learner
- **`orgEmployee`**: Optional upgrade to staff role with organizational duties and professional attribution
- **`orgMemberInvitation`**: Customer onboarding workflow
- **`orgEmployeeInvitation`**: Staff recruitment with approval processes

## **🏢 Organization Management**

### **Organizational Structure**
- **`org`**: Core organization entity with settings, branding, and configuration
- **`orgDepartment`**: Organizational divisions for employee structure
- **`orgTeam`**: Project-based teams for collaboration
- **`orgEmployeeDepartmentMembership`**: Employee assignment to departments
- **`orgEmployeeTeamMembership`**: Employee participation in teams

### **Learning Community Structure**
- **`orgMemberLearningGroup`**: Study groups and learning communities
- **`orgMemberCohort`**: Learning cohorts and class sections

## **📚 Content & Learning Management**

### **Course Structure**
- **`orgProduct`**: Core products including courses, with pricing and metadata
- **`orgProductCourse`**: Course-specific configuration, duration, difficulty
- **`orgProductCourseSection`**: Course sections and modules
- **`orgProductCourseLesson`**: Individual lessons with content and media
- **`orgProductCourseChallenge`**: Interactive challenges and assessments

### **Content Management**
- **`systemContentVersion`**: Version control for all content types
- **`orgContentApprovalChain`**: Content approval workflows
- **`systemContentTranslation`**: Multi-language content support

### **Learning Experience**
- **`orgMemberProductCourseEnrollment`**: Student enrollment and progress tracking
- **`orgMemberLearningProfile`**: Personalized learning analytics and preferences
- **`orgMemberProductCourseChallengeRating`**: Student feedback and ratings

## **💰 E-commerce & Financial System**

### **Product Catalog**
- **`orgProductVariant`**: Product variations (pricing tiers, access levels)
- **`orgProductOffer`**: Time-limited promotions and discounts
- **`orgPriceBook`**: Tiered pricing strategies for different markets
- **`orgProductBundle`**: Package deals and course collections

### **Order Management**
- **`orgMemberOrder`**: Customer purchase orders
- **`orgMemberOrderItem`**: Individual items within orders
- **`orgMemberProductVariantPaymentPlanSubscription`**: Subscription management

### **Financial Operations**
- **`orgAccountingLedger`**: Double-entry accounting system
- **`orgAccountingTransaction`**: Financial transaction records with employee posting tracking
- **`orgTaxRate`**: Tax rate configuration with historical tracking
- **`orgTaxRateSnapshot`**: Point-in-time tax rate preservation with employee attribution for compliance

### **Payment Processing**
- **`orgGiftCard`**: Gift card issuance and redemption
- **`orgMemberGiftCardUsage`**: Gift card transaction tracking

## **🎯 Creator Economy & Revenue Attribution**

### **Professional Attribution**
- **`orgEmployeeProductAttribution`**: Links employees to products they create or manage
- **`orgEmployeeProductAttributionRevenue`**: Revenue distribution to creators
- **`orgProductRevenuePool`**: Revenue allocation tracking and 100% limit enforcement

### **Compensation Models**
- **Revenue Share**: Percentage-based commission from product sales
- **Flat Fee**: Fixed payment per product or milestone
- **Hourly Rate**: Time-based compensation
- **Salary**: Fixed organizational compensation separate from product revenue
- **Zero Attribution**: Volunteer roles or salary-only positions

### **Professional Context**
- **Employee-Job Profile Link**: Optional connection to professional identity for attribution
- **Cross-Organizational Reputation**: Job profiles track professional work across multiple organizations
- **Skill Attribution**: Clear connection between professional work and skills/expertise

## **🔐 Security & Compliance**

### **Data Governance**
- **`systemDataRetentionPolicy`**: GDPR/SOX compliant data retention
- **`systemAuditLog`**: Comprehensive audit trails for compliance
- **`systemApiRateLimit`**: API protection and throttling

### **Access Control**
- **Row-Level Security**: All queries automatically scoped to tenant
- **Role-Based Permissions**: Different access levels for members vs employees
- **Feature Flags**: `orgFeatureFlag` for tenant-specific capability control

## **🌍 Internationalization & Localization**

### **Multi-Language Support**
- **`systemContentTranslation`**: Professional translation workflows
- **`systemLanguage`** & **`systemCountry`**: Regional configuration
- **Tax Jurisdiction Support**: Location-based tax calculation

### **Cultural Adaptation**
- **Currency Support**: Multi-currency pricing and transactions
- **Regional Compliance**: Jurisdiction-specific data handling

## **📊 Analytics & Business Intelligence**

### **Dimensional Analytics**
- **`dimDate`**: Time dimension for analytics queries
- **`dimJobProfile`**: Job profile dimension with slowly changing attributes
- **`factJobProfilePerformance`**: Performance metrics and KPIs

### **Real-Time Insights**
- **Learning Analytics**: Student progress and engagement tracking
- **Revenue Analytics**: Creator compensation and product performance
- **Organizational Analytics**: Employee productivity and department metrics

## **🔄 Workflow Management**

### **Business Process Automation**
- **`systemWorkflowDefinition`**: Configurable workflow templates
- **`systemWorkflowInstance`**: Active workflow executions
- **Content Approval**: Multi-step review and approval processes
- **Employee Onboarding**: Structured recruitment and setup workflows

### **State Management**
- **Order Lifecycle**: From cart to fulfillment
- **Content Lifecycle**: From draft to published
- **Employee Lifecycle**: From invitation to active employment

## **🚀 Future Extensibility**

### **Marketplace Vision**
The architecture supports evolution into a comprehensive marketplace:
- **Job Marketplace**: Professional profiles enable freelance and contract work
- **Service Attribution**: Beyond courses to consulting, coaching, and services
- **Cross-Organizational Collaboration**: Job profiles work across multiple organizations
- **Reputation Systems**: Professional track record follows creators

### **Employee Management Platform**
- **HR Workflows**: Complete employee lifecycle management
- **Performance Management**: Goal setting, reviews, and professional development
- **Compensation Management**: Complex salary and commission structures
- **Organizational Design**: Flexible department and team structures

### **Advanced Creator Economy**
- **Multi-Revenue Streams**: Courses, consulting, coaching, digital products
- **Creator Partnerships**: Revenue sharing between multiple creators
- **Professional Development**: Skill tracking and certification programs
- **Creator Analytics**: Comprehensive performance and earning insights

## **📋 Key Design Patterns**

### **Event Sourcing**
Financial transactions use event sourcing for audit compliance and state reconstruction.

### **Snapshot Pattern**
Tax rates and pricing use snapshots for historical accuracy and legal compliance.

### **Soft Deletes**
Critical business data uses soft deletes with audit trails rather than hard deletion.

### **Tenant Isolation**
Every table includes `orgId` for complete multi-tenant data separation.

### **Professional Attribution Chain**
Clear traceability: `Product → Employee → Job Profile → Revenue Distribution`

## **📊 Schema Organization**

### **Core Schema Domains**
```
📂 general/                    # Platform-wide shared resources
├── locale-currency-market/    # Global standards and market data
├── seo/                       # SEO and content discovery
├── skill/                     # Platform-wide skill taxonomy
└── contact-info/              # Polymorphic contact management

📂 user/                       # User domain (global identity)
├── schema.js                  # User base identity
├── relations.js               # User relationship foundations
└── profile/                   # Specialized user profiles
    ├── schema.js              # userProfile base with type differentiation
    ├── relations.js           # Profile relationship management
    ├── contact-info/           # Profile-based contact management
    └── job/                   # Professional job profiles for creator economy
        ├── schema.js          # userJobProfile extending userProfile
        └── relations.js       # Cross-organizational job relationships

📂 org/                        # Organization domain
├── schema.js                  # org + orgBrand + orgLocale + orgRegion
├── relations.js               # Multi-tenant boundaries and professional affiliations
├── product/                   # Organization products
│   ├── schema.js              # orgProduct + orgProductVariant
│   ├── relations.js           # Product relationships and attribution
│   ├── payment/               # Payment plans and subscriptions
│   ├── offers/                # Promotional campaigns
│   ├── collection/            # Product catalog organization
│   ├── orders/                # E-commerce order management
│   └── by-type/course/        # Course-specific product extensions
├── member/                    # Organization membership (customers/learners)
│   ├── schema.js              # orgMember + orgMemberLearningProfile + enrollment
│   ├── relations.js           # Member relationships and learning analytics
│   └── employee/              # Employee management (staff/creators)
│       ├── schema.js          # orgEmployee with job profile integration
│       └── relations.js       # Employee relationships and professional workflows
├── department/                # Organizational structure
│   ├── schema.js              # orgDepartment
│   ├── relations.js           # Department relationships
│   └── membership/            # Employee department assignments
│       ├── schema.js          # orgEmployeeDepartmentMembership
│       └── relations.js       # Department membership relationships
├── team/                      # Team structure
│   ├── schema.js              # orgTeam
│   ├── relations.js           # Team relationships
│   └── membership/            # Employee team assignments
│       ├── schema.js          # orgEmployeeTeamMembership
│       └── relations.js       # Team membership relationships
├── locale-region/             # Market strategy and localization
├── tax/                       # Organization tax configuration
└── funnel/                    # Sales funnel management
```

### **Updated Architecture Flows**

#### **Customer Journey (Member-Level)**
```mermaid
graph TD
    A[User] --> B[userProfile main]
    B --> C[orgMember - Customer/Learner]
    C --> D[Places Orders]
    C --> E[Enrolls in Courses]
    C --> F[Community Participation]
    C --> G[Learning Analytics]
```

#### **Creator Journey (Employee-Level)**
```mermaid
graph TD
    A[User] --> B[userProfile job]
    B --> C[orgMember - Base membership]
    C --> D[orgEmployee - Staff upgrade]
    D --> E[Job Profile Integration]
    D --> F[Creates Content]
    F --> G[orgEmployeeProductAttribution]
    G --> H[Revenue Distribution]
    D --> I[Department/Team Structure]
```

#### **Professional Attribution Flow**
```mermaid
graph TD
    A[Customer Order] --> B[Product Revenue]
    B --> C[orgEmployeeProductAttribution]
    C --> D[orgEmployee with Job Profile]
    D --> E[Professional Context]
    E --> F[Revenue Distribution]
    E --> G[Cross-Org Reputation]
```

#### **Invitation Workflows**
```mermaid
graph TD
    A[Email Invitation] --> B{Invitation Type}
    B -->|Customer| C[orgMemberInvitation]
    B -->|Staff| D[orgEmployeeInvitation]
    C --> E[Member Created]
    E --> F[Customer Activities]
    D --> G[Approval Required]
    G --> H[Employee Created]
    H --> I[Professional Activities]
```

## **🎯 Key Architectural Benefits**

### **1. Clean Business Logic Separation**
- **Members** handle customer activities (purchases, learning)
- **Employees** handle professional activities (creation, attribution)
- **Same user** can be both member AND employee in same org

### **2. Professional Context Integration**
- **Employees** optionally link to **job profiles** for professional identity
- **Cross-organizational reputation** through job profiles
- **Clear attribution path**: Product → Employee → Job Profile

### **3. Scalable Invitation Workflows**
- **Member invitations** for customer onboarding
- **Employee invitations** for staff recruitment with approval
- **Different permission flows** for different roles

### **4. Organizational Structure Clarity**
- **Department/Team membership** at employee level (work structure)
- **Learning groups/cohorts** at member level (community structure)
- **Clear separation** of professional vs. learning organization

## **🚀 Migration from Current Schema**

### **Critical Changes Required**

#### **Revenue Attribution Migration**
```javascript
// ❌ OLD: Generic member attribution
orgMemberProductAttribution → orgEmployeeProductAttribution
orgMemberProductAttributionRevenue → orgEmployeeProductAttributionRevenue

// ✅ NEW: Employee-based professional attribution
// Links products to employees (who have job profiles)
// Clear separation: customers vs. creators
```

#### **Financial Operations Migration**
```javascript
// ❌ OLD: Member-level financial operations
orgTaxRateSnapshot.byMemberId → byEmployeeId
accountTransaction.postedByMemberId → postedByEmployeeId

// ✅ NEW: Employee-level professional operations
// Only staff should manage tax rates and post transactions
```

#### **Organizational Structure Migration**
```javascript
// ❌ OLD: Generic member structure
orgDepartmentMembership.memberId → orgEmployeeDepartmentMembership.employeeId
orgTeamMembership.memberId → orgEmployeeTeamMembership.employeeId

// ✅ NEW: Employee-level professional structure
// Departments and teams are work organization for staff
```

#### **Administrative Operations Migration**
```javascript
// ❌ OLD: Generic member operations
orgMemberInvitation.approvedByMemberId → approvedByEmployeeId
orgProductRevenuePool.lastAllocationBy → lastAllocationByEmployeeId

// ✅ NEW: Employee-level administrative duties
// Only staff should approve invitations and manage revenue pools
```

### **Implementation Priority**
1. **Revenue Attribution** (Critical) - Fix core business logic
2. **Financial Operations** (Critical) - Ensure compliance
3. **Organizational Structure** (High) - Professional hierarchy
4. **Administrative Operations** (Medium) - Staff workflow clarity
5. **Invitation Systems** (Medium) - Proper onboarding separation

## **🎯 Developer Quick Start**

### **Understanding the Updated Architecture**
1. **Member vs Employee Distinction**: Members are customers/learners, employees are staff/creators
2. **Professional Attribution**: Revenue flows to employees (with job profiles), not generic members
3. **Organizational Structure**: Departments/teams for employees, learning groups for members
4. **Invitation Workflows**: Separate flows for customer onboarding vs staff recruitment
5. **Financial Operations**: Only employees handle tax management and accounting operations

### **Key Development Patterns**
```javascript
// Customer Activities (Member-level)
orgMemberOrder → Customer purchases
orgMemberProductCourseEnrollment → Learning participation
orgMemberLearningProfile → Learning analytics

// Professional Activities (Employee-level)
orgEmployeeProductAttribution → Content creation
orgEmployeeProductAttributionRevenue → Creator compensation
orgEmployeeDepartmentMembership → Work organization
orgEmployeeInvitation → Staff recruitment

// Clear Attribution Flow
Customer (orgMember) → Places Order → Product Revenue → 
Employee Attribution (orgEmployee) → Job Profile Context → Revenue Distribution
```

This architecture transforms Volmify from a generic LMS to a professional creator economy platform with clear customer/creator separation, cross-organizational professional identity, and sophisticated employee management capabilities that align perfectly with your marketplace vision.