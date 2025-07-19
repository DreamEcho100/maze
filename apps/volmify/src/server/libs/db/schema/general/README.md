# **📂 System Schema**

## **🎯 Purpose**

Manages the core permission system that defines what actions can be performed across the entire platform. This schema provides the foundation for role-based access control (RBAC) by defining system-wide permissions organized into logical categories. It acts as the **permission registry** that all organization-specific permission groups reference to build their access control models.

## **📊 Quick Stats**

- **Tables**: 2 core tables
- **Relations**: 1 hierarchical relationship + 1 external relationship
- **Key Features**: Hierarchical permission categorization, platform-wide permission definitions, cascade deletion support
- **Total Indexes**: 6 performance-optimized indexes
- **External Dependencies**: Connects to organization permission system

## **🏗 Core Tables**

### **`system_permission_category`**

**Purpose**: Logical groupings for related permissions to organize the permission hierarchy

- **Primary Role**: Categorizes permissions into logical groups (e.g., "User Management", "Content Creation", "Organization Administration")
- **Business Value**: Enables UI permission management with grouped displays
- **Key Features**: Unique name constraint, optimized for lookups

### **`system_permission`**

**Purpose**: Individual permission definitions that define specific actions users can perform

- **Primary Role**: Defines granular permissions (e.g., "create_user", "edit_course", "delete_organization")
- **Business Value**: Foundation for all access control throughout the platform
- **Key Features**: Belongs to category, referenced by organization permission groups

## **🔗 Key Relationships**

### **Internal Relationships**

- **Category → Permissions**: One category contains many related permissions (hierarchical organization)
    - **Cascade Delete**: When category is deleted, all its permissions are removed
    - **Performance**: Indexed for fast category-based permission queries

### **External Relationships**  

- **Permissions → Organization Permission Groups**: System permissions are assigned to organization-specific permission groups
    - **Many-to-Many**: One permission can be in multiple organization groups
    - **Cross-Schema**: Links to organization schema via `organizationPermissionsGroupPermission`

## **🏛️ Architecture Overview**

### **Design Pattern**: Registry Pattern

This schema implements a **registry pattern** where all possible permissions are predefined at the system level, then selectively assigned to organizations.

### **Permission Flow**

```
System Permissions (Registry) 
    ↓ (Referenced by)
Organization Permission Groups 
    ↓ (Assigned to)  
Organization Members
    ↓ (Controls access to)
Platform Features & Actions
```

### **Security Model**: Whitelist Approach

- **Principle**: Only explicitly granted permissions are allowed
- **Benefits**: Secure by default, clear audit trail, centralized permission management
- **Implementation**: All actions check against assigned system permissions

## **🚀 Quick Start**

### **Basic Permission Query**

```javascript
// Get all permissions organized by category
const permissionsWithCategories = await db.query.systemPermissionCategory.findMany({
  with: {
    permissions: true
  }
});
```

### **Find Specific Permission**

```javascript
// Find specific permission with category context
const createUserPermission = await db.query.systemPermission.findFirst({
  where: eq(systemPermission.name, "create_user"),
  with: {
    category: true
  }
});
```

### **Permission Existence Check**

```javascript
// Check if permission exists (for validation)
const permissionExists = await db.query.systemPermission.findFirst({
  where: eq(systemPermission.name, permissionName),
  columns: { id: true }
});
```

## **💾 Schema Details**

### **Field Specifications**

#### **`system_permission_category`**

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | text | PRIMARY KEY, ULID | Unique identifier |
| `name` | varchar(255) | NOT NULL, UNIQUE | Category name (e.g., "user_management") |
| `description` | varchar(256) | NULLABLE | Human-readable description |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Creation timestamp |

#### **`system_permission`**

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | text | PRIMARY KEY, ULID | Unique identifier |
| `name` | varchar(255) | NOT NULL, UNIQUE | Permission name (e.g., "create_user") |
| `description` | varchar(256) | NULLABLE | Human-readable description |
| `categoryId` | text | NOT NULL, FK → category.id | Category assignment |
| `createdAt` | timestamp | NOT NULL, DEFAULT NOW | Creation timestamp |

### **Index Strategy**

```javascript
// Performance-optimized indexes
// Category table:
- idx_system_permission_category_created_at  // Audit queries
- idx_system_permission_category_name        // Lookup by name
- idx_system_permission_category_name_lookup // Fast name searches

// Permission table:
- idx_system_permission_created_at           // Audit queries  
- idx_system_permission_name                 // Permission lookups
- idx_system_permission_category             // Category filtering
```

## **🔗 Relationship Details**

### **Category ↔ Permissions (One-to-Many)**

```javascript
// Schema relationship
categoryId: text("category_id")
  .notNull()
  .references(() => systemPermissionCategory.id, { onDelete: "cascade" })

// Drizzle relationship
category: one(systemPermissionCategory, {
  fields: [systemPermission.categoryId],
  references: [systemPermissionCategory.id],
})
```

**Business Logic**: Categories organize permissions into logical groups for UI management
**Cascade Behavior**: Deleting a category removes all its permissions (maintains data integrity)
**Query Implications**: Always index category-based permission queries

### **Permission → Organization Groups (One-to-Many)**

```javascript
// External relationship to organization schema
groupPermissions: many(organizationPermissionsGroupPermission)
```

**Business Logic**: System permissions can be assigned to multiple organization permission groups
**Security Model**: Organization groups cannot create custom permissions, only use system-defined ones
**Performance**: Heavily indexed for permission checking during authorization

## **📊 Common Query Patterns**

### **Administrative Queries**

```javascript
// Get all permissions for admin dashboard
const allPermissionsGrouped = await db.query.systemPermissionCategory.findMany({
  orderBy: [asc(systemPermissionCategory.name)],
  with: {
    permissions: {
      orderBy: [asc(systemPermission.name)]
    }
  }
});

// Count permissions per category
const categoryStats = await db
  .select({
    categoryName: systemPermissionCategory.name,
    permissionCount: count(systemPermission.id)
  })
  .from(systemPermissionCategory)
  .leftJoin(systemPermission, eq(systemPermission.categoryId, systemPermissionCategory.id))
  .groupBy(systemPermissionCategory.id, systemPermissionCategory.name);
```

### **Permission Validation**

```javascript
// Validate permission names (for organization setup)
const validatePermissions = async (permissionNames) => {
  const existingPermissions = await db.query.systemPermission.findMany({
    where: inArray(systemPermission.name, permissionNames),
    columns: { name: true }
  });
  
  const validNames = existingPermissions.map(p => p.name);
  const invalidNames = permissionNames.filter(name => !validNames.includes(name));
  
  return { valid: validNames, invalid: invalidNames };
};
```

### **Authorization Queries**

```javascript
// Get user's effective permissions (across organization groups)
const getUserPermissions = async (userId, organizationId) => {
  return await db
    .select({
      permissionName: systemPermission.name,
      categoryName: systemPermissionCategory.name
    })
    .from(systemPermission)
    .innerJoin(organizationPermissionsGroupPermission, 
      eq(organizationPermissionsGroupPermission.permissionId, systemPermission.id))
    .innerJoin(organizationMemberPermissionsGroup,
      eq(organizationMemberPermissionsGroup.permissionsGroupId, organizationPermissionsGroupPermission.permissionsGroupId))
    .innerJoin(organizationMember,
      eq(organizationMember.id, organizationMemberPermissionsGroup.memberId))
    .innerJoin(systemPermissionCategory,
      eq(systemPermissionCategory.id, systemPermission.categoryId))
    .where(and(
      eq(organizationMember.userId, userId),
      eq(organizationMember.organizationId, organizationId)
    ));
};
```

## **🎯 Real-World Usage Examples**

### **Initial System Setup**

```javascript
// Seed default permission categories and permissions
const seedSystemPermissions = async () => {
  return db.transaction(async (tx) => {
    // Create categories
    const [userMgmtCategory] = await tx.insert(systemPermissionCategory).values({
      name: "user_management",
      description: "User and member management permissions"
    }).returning();

    const [contentCategory] = await tx.insert(systemPermissionCategory).values({
      name: "content_management", 
      description: "Course and content creation permissions"
    }).returning();

    // Create permissions
    await tx.insert(systemPermission).values([
      {
        name: "create_user",
        description: "Create new users in the system",
        categoryId: userMgmtCategory.id
      },
      {
        name: "edit_user_profile",
        description: "Edit user profile information", 
        categoryId: userMgmtCategory.id
      },
      {
        name: "create_course",
        description: "Create new courses",
        categoryId: contentCategory.id
      },
      {
        name: "publish_course",
        description: "Publish courses to make them available",
        categoryId: contentCategory.id
      }
    ]);
  });
};
```

### **Organization Permission Setup**

```javascript
// Create organization permission group using system permissions
const createOrgPermissionGroup = async (organizationId, groupName, permissionNames) => {
  return db.transaction(async (tx) => {
    // Validate all permissions exist
    const systemPermissions = await tx.query.systemPermission.findMany({
      where: inArray(systemPermission.name, permissionNames),
      columns: { id: true, name: true }
    });

    if (systemPermissions.length !== permissionNames.length) {
      throw new Error("Some permissions don't exist in system registry");
    }

    // Create organization permission group
    const [permGroup] = await tx.insert(organizationPermissionsGroup).values({
      organizationId,
      name: groupName,
      description: `Permission group with: ${permissionNames.join(", ")}`
    }).returning();

    // Assign system permissions to group
    const groupPermissions = systemPermissions.map(perm => ({
      permissionsGroupId: permGroup.id,
      permissionId: perm.id
    }));

    await tx.insert(organizationPermissionsGroupPermission).values(groupPermissions);

    return permGroup;
  });
};
```

### **Permission Checking Middleware**

```javascript
// Middleware to check if user has specific permission
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    const { userId, organizationId } = req.user;
    
    // Check if user has the required permission
    const hasPermission = await db.query.systemPermission.findFirst({
      where: eq(systemPermission.name, permissionName),
      with: {
        groupPermissions: {
          with: {
            permissionsGroup: {
              with: {
                memberPermissionsGroups: {
                  with: {
                    member: {
                      where: and(
                        eq(organizationMember.userId, userId),
                        eq(organizationMember.organizationId, organizationId)
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!hasPermission || hasPermission.groupPermissions.length === 0) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Usage in routes
app.post("/api/users", requirePermission("create_user"), createUserHandler);
app.put("/api/courses/:id/publish", requirePermission("publish_course"), publishCourseHandler);
```

## **⚡ Performance Considerations**

### **Caching Strategy**

```javascript
// Cache system permissions (they change rarely)
const getSystemPermissionsCache = async () => {
  const cacheKey = "system:permissions:all";
  let permissions = await redis.get(cacheKey);
  
  if (!permissions) {
    permissions = await db.query.systemPermissionCategory.findMany({
      with: { permissions: true }
    });
    await redis.setex(cacheKey, 3600, JSON.stringify(permissions)); // 1 hour cache
  } else {
    permissions = JSON.parse(permissions);
  }
  
  return permissions;
};
```

### **Query Optimization**

- **Permission Lookups**: Use `columns` selection to minimize data transfer
- **Authorization Checks**: Consider denormalizing user permissions for faster access
- **Bulk Operations**: Use `inArray` for multiple permission validation

### **Index Usage**

- **Name Lookups**: `idx_system_permission_name` for O(log n) permission finding
- **Category Filtering**: `idx_system_permission_category` for grouped queries
- **Audit Queries**: `idx_*_created_at` for temporal analysis

## **🚨 Important Constraints & Business Rules**

### **Data Integrity Rules**

1. **Unique Permission Names**: No duplicate permission names allowed across entire system
2. **Category Cascade**: Deleting category removes all permissions (prevents orphaned permissions)
3. **Immutable After Assignment**: Permissions should not be deleted if referenced by organizations

### **Naming Conventions**

- **Categories**: snake_case, descriptive groupings (e.g., `user_management`, `content_creation`)
- **Permissions**: snake_case, action_resource format (e.g., `create_user`, `edit_course`, `delete_organization`)

### **Security Constraints**

- **No Custom Permissions**: Organizations cannot create custom permissions
- **Explicit Grant Model**: Only explicitly assigned permissions are valid
- **Audit Trail**: All permission assignments must be traceable

## **📖 Detailed Documentation Links**

- 📋 Tables - Complete field specifications and constraints
- 🔗 Relationships - Detailed relationship mapping with diagrams  
- 🔍 Queries - Comprehensive query patterns and optimization
- 💡 Examples - Real-world implementation scenarios
- 🚀 Migrations - Schema evolution and migration strategies
- 🌟 Overview - Business domain concepts and architecture decisions

## **🎯 System Integration Points**

### **Upstream Dependencies**

- **None**: This is a foundational schema with no dependencies

### **Downstream Dependencies**

- **Organization Schema**: Permission groups reference system permissions
- **Authentication System**: Authorization checks query system permissions
- **Audit System**: Permission changes are logged for compliance

### **API Integration**

- **Admin Endpoints**: CRUD operations for permission management
- **Organization Setup**: Permission group creation during org onboarding
- **User Authorization**: Real-time permission checking during requests

## **⚠️ Migration & Deployment Notes**

### **Breaking Changes**

- **Permission Deletion**: Removing permissions breaks organization groups
- **Category Restructure**: Moving permissions between categories affects UI groupings
- **Name Changes**: Renaming permissions breaks hardcoded authorization checks

### **Safe Migration Patterns**

1. **Add New Permissions**: Always safe, no breaking changes
2. **Deprecate Gradually**: Mark permissions as deprecated before removal
3. **Migration Scripts**: Always provide data migration for structural changes

This schema serves as the **security foundation** for the entire platform - handle with care and thorough testing! 🔐🚀
