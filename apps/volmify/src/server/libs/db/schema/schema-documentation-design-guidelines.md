# **📚 Schema Documentation Design Guidelines**

## **🎯 Documentation Philosophy**

### **Core Principles**

- **Architecture Over Implementation**: Focus on design decisions, not code restatement
- **Business Context First**: Explain WHY before WHAT
- **Developer Acceleration**: Minimize time-to-understanding for new team members
- **Cognitive Efficiency**: Avoid redundant explanations of self-evident code

### **ABAC System Focus**

Given our Attribute-Based Access Control implementation, documentation should emphasize:

- **Context-Aware Design**: How attributes work within organizational boundaries
- **Cross-Schema Integration**: How permission attributes flow through the application
- **Security Architecture**: ABAC principles and authorization paths

## **📁 Documentation Structure**

### **Simplified Folder Pattern**

```
📂 schema-folder/
├── README.md              # 🎯 High-level overview and quick start
├── schema.js              # 💾 Database schema with JSDoc
├── relations.js           # 🔗 Relationships with JSDoc
└── docs/                  # 📖 Deep-dive documentation (optional)
    ├── architecture.md     # 🏗 Design decisions and patterns
    ├── integration.md      # 🔗 Cross-system integration points
    └── examples.md         # 💡 Complex usage scenarios
```

## **📝 JSDoc Standards for Schema Files**

### **File-Level Documentation**

```javascript
/**
 * @fileoverview [Schema Name] - [Primary Purpose]
 * 
 * @architecture [Pattern Type] (e.g., ABAC, Registry, Event Sourcing)
 * Brief explanation of the architectural pattern and why it was chosen.
 * 
 * @designPattern [Specific Pattern]
 * How this schema implements the pattern and integrates with the broader system.
 * 
 * @integrationPoints
 * - Key system integration points
 * - Authorization flow participation
 * - Cross-schema dependencies
 * 
 * @businessValue
 * Why this schema exists and what business problems it solves.
 */
```

### **Table-Level Documentation**

```javascript
/**
 * [Table Purpose in Business Terms]
 * 
 * @abacRole [ABAC Context] (for permission-related tables)
 * How this table participates in attribute-based access control.
 * 
 * @businessLogic
 * Key business rules and constraints that drive the design.
 * 
 * @architecturalDecision
 * Why this design was chosen over alternatives.
 * 
 * @integrationContext
 * How this table connects to the broader application workflow.
 */
```

### **Field-Level Documentation** (Only When Not Self-Evident)

```javascript
/**
 * @businessRule [Important constraint or naming convention]
 * @abacContext [How this field participates in access control]
 * @immutable [Why this field shouldn't change after creation]
 * @performanceCritical [High-frequency usage in authorization/queries]
 */
```

## **🔄 Schema File Update Instructions**

### **⚠️ Critical Requirements**

- **NEVER CREATE NEW FILES** - Always update existing schema and relations files in-place
- **PRESERVE EXISTING COMMENTS** - Keep all existing inline comments and code structure
- **JSDoc ENHANCEMENT ONLY** - Add JSDoc documentation without modifying existing code logic
- **MAINTAIN IMPORTS/EXPORTS** - Preserve all existing import statements and export declarations

### **📝 Update Process for Schema Files**

#### **1. Schema File Updates (`schema.js`)**

```javascript
// filepath: [keep exact original path]

// ...existing imports... (PRESERVE ALL)

/**
 * @fileoverview [Schema Name] - [Primary Purpose]
 * 
 * @architecture [Architectural Pattern]
 * [Architecture explanation]
 * 
 * @designPattern [Design Pattern Details]
 * [Pattern implementation details]
 * 
 * @integrationPoints
 * - [Integration point 1]
 * - [Integration point 2]
 * 
 * @businessValue
 * [Business value explanation]
 * 
 * @scalingDesign
 * [Scaling considerations]
 */

// ...existing enums and constants... (PRESERVE ALL)

/**
 * [Table Business Purpose]
 * 
 * @businessLogic
 * [Key business rules and design drivers]
 * 
 * @architecturalDecision
 * [Why this design was chosen]
 * 
 * @integrationContext
 * [How this connects to broader system]
 */
export const tableName = table(
    "table_name",
    {
        // ...existing fields... (PRESERVE ALL)
        /**
         * @businessRule [Only when field has special business significance]
         * @abacContext [Only for permission-related fields]
         * @performanceCritical [Only for high-frequency access fields]
         */
        specialField: fieldDefinition,
        
        // ...rest of existing fields... (PRESERVE ALL)
    },
    (table) => [
        // ...existing indexes and constraints... (PRESERVE ALL)
        /**
         * @businessConstraint [Only for complex business rule constraints]
         * @performanceCritical [Only for critical performance indexes]
         */
        uniqueIndex("constraint_name").on(table.field1, table.field2),
    ],
);

// ...all other existing tables and exports... (PRESERVE ALL)
```

#### **2. Relations File Updates (`relations.js`)**

```javascript
// filepath: [keep exact original path]

// ...existing imports... (PRESERVE ALL)

/**
 * @fileoverview [Schema] Relations - [Integration Purpose]
 * 
 * @integrationPattern [Pattern Description]
 * [How relations enable cross-schema integration]
 * 
 * @businessContext
 * [Business workflows enabled by these relations]
 */

/**
 * [Entity] Relations ([Role in System])
 * 
 * @integrationRole [How this entity integrates with broader system]
 * [Description of entity's role in system architecture]
 * 
 * @businessRelationships
 * [Key business relationships and their purposes]
 */
export const entityNameRelations = relations(entityName, ({ one, many }) => ({
    /**
     * @businessContext [Only for complex/important relationships]
     * @abacRole [Only for permission-related relationships]
     * @performanceCritical [Only for high-frequency relationships]
     */
    relationshipName: one/many(relatedEntity, {
        // ...existing relationship definition... (PRESERVE ALL)
    }),
    
    // ...all existing relationships... (PRESERVE ALL)
}));

// ...all other existing relations... (PRESERVE ALL)
```

### **🚫 What NOT to Change**

- **Import/Export Statements**: Keep all existing imports and exports
- **Table Definitions**: Don't modify field definitions, types, or constraints
- **Relationship Definitions**: Don't change existing relation configurations
- **Index Definitions**: Don't modify existing indexes or constraints
- **Existing Comments**: Preserve all existing inline comments
- **Code Structure**: Maintain existing code organization and spacing

### **✅ What TO Add**

- **File-level JSDoc**: Add comprehensive @fileoverview with architecture context
- **Table-level JSDoc**: Add business purpose and integration context
- **Field-level JSDoc**: Only for fields with special business rules or performance implications
- **Relationship JSDoc**: Only for complex relationships with business significance
- **Constraint JSDoc**: Only for constraints that implement complex business rules

## **📋 README.md Template**

```markdown
# **📂 [Schema Name] Schema**

## **🎯 Architecture**
**Pattern**: [ABAC/Registry/Event Sourcing/etc.]
**Purpose**: [1-2 sentence business purpose]

## **🏗 Core Design**
- **[Key Design Decision 1]**: Brief explanation of why
- **[Key Design Decision 2]**: Brief explanation of why

## **🔗 System Integration**
- **Authorization Flow**: How this participates in ABAC decisions
- **Cross-Schema**: Key relationships with other schema domains
- **API Layer**: Primary integration points with application logic

## **📊 Schema Overview**
- **Tables**: X core tables
- **Key Relationships**: Most important relationships
- **Performance Considerations**: Critical indexes or caching needs

## **🚀 Quick Start**
```javascript
// Most common/important usage pattern
const example = await db.query.mainTable.findFirst({
  // Show typical relationship loading
  with: { relatedTable: true }
});
```

## **📖 Deep Dive**

- [🏗 Architecture](./docs/architecture.md) - Design patterns and decisions
- [🔗 Integration](./docs/integration.md) - Cross-system workflows  
- [💡 Examples](./docs/examples.md) - Complex implementation scenarios

```

## **📖 Deep Documentation (docs/ folder)**

### **docs/architecture.md**
```markdown
# **🏗 [Schema] Architecture**

## **🎯 Design Pattern**
### [Pattern Name] Implementation
- **Why chosen**: Business/technical reasoning
- **Trade-offs**: What we gained/sacrificed
- **Alternatives considered**: What we didn't do and why

## **🔄 Data Flow**
```mermaid
graph LR
    A[Input Source] --> B[Processing] --> C[Decision Point] --> D[Output]
```

## **🚨 Critical Constraints**

- **[Constraint 1]**: Business rule it enforces
- **[Constraint 2]**: Technical limitation it addresses

## **⚡ Performance Architecture**

- **Hot Path**: Critical queries and their optimization
- **Caching Strategy**: What should be cached and why
- **Scaling Considerations**: Future growth implications

```

### **docs/integration.md**
```markdown
# **🔗 [Schema] Integration Points**

## **🌐 Cross-Schema Workflows**
### [Workflow Name]
```javascript
// Show how this schema participates in broader workflows
// Focus on the integration logic, not basic CRUD
```

## **🔐 Authorization Integration** (for ABAC-related schemas)

### Permission Evaluation Flow

```javascript
// How permissions flow through the system
// Subject + Context + Action + Resource → Decision
```

## **📡 API Integration**

### Critical Endpoints

- **[Endpoint]**: How schema data is exposed
- **[Another Endpoint]**: Integration with frontend/services

```

### **docs/examples.md**
```markdown
# **💡 [Schema] Implementation Examples**

## **🎯 Complex Scenarios**
### [Scenario Name]
**Business Context**: Why this scenario is important

```javascript
// Complete, working implementation
// Focus on the business logic and integration points
// Include error handling for critical paths
```

**Key Design Points**:

- Why this approach was chosen
- What edge cases are handled
- Performance considerations

```

## **✅ Documentation Quality Standards**

### **What TO Include**
- **Architectural reasoning**: Why we chose this design
- **Business context**: What problem this solves
- **Integration points**: How it connects to the broader system
- **Performance implications**: Critical path optimizations
- **ABAC context**: How permissions/attributes flow through the system
- **Complex scenarios**: Multi-step workflows and edge cases

### **What NOT to Include**
- **Self-evident code**: Field types, basic constraints, obvious relationships
- **Basic CRUD examples**: Simple insert/select/update patterns
- **Repetitive explanations**: Information available from code inspection
- **Low-level implementation**: Details that belong in code comments

### **JSDoc Focus Areas**
- **File level**: Architecture pattern and system integration
- **Table level**: Business purpose and design decisions
- **Field level**: Only when business rules or performance implications exist
- **Relationship level**: Cross-schema integration and ABAC flows

## **🚀 Implementation Priority**

### **Phase 1: Core Architecture Documentation**
1. **System schema**: ABAC foundation and permission flows
2. **Organization schema**: Multi-tenant architecture and context boundaries
3. **User schema**: Subject definition and authentication integration

### **Phase 2: Domain Documentation**
1. **Product/Course schemas**: Content management architecture
2. **Currency/Market schemas**: Internationalization design
3. **SEO schema**: Translation and optimization patterns

### **Phase 3: Supporting Documentation**
1. **Integration workflows**: Cross-schema business processes
2. **Performance guidelines**: Query optimization and caching
3. **Migration strategies**: Schema evolution patterns

## **📏 Success Metrics**

### **Developer Onboarding**
- **Time to first meaningful contribution**: < 2 days
- **Architecture comprehension**: Understanding ABAC flow within 1 day
- **Integration confidence**: Ability to modify cross-schema workflows

### **Documentation Effectiveness**
- **Self-service capability**: Developers find answers without asking teammates
- **Consistency**: Similar patterns documented similarly across schemas
- **Maintenance burden**: Documentation updates are part of normal development flow

## **🎯 Key Reminder**

**JSDoc comments are meant to enhance the onboarding experience by helping developers understand the overall system architecture and its connection to the business logic—not to overwhelm them with unnecessary details.**

**Always update existing files in-place, never create new files. Preserve all existing code structure, comments, and logic while adding JSDoc documentation to enhance architectural understanding.**

**Focus on accelerating developer understanding of system design and business logic, not restating what the code already expresses clearly.** 🎯
