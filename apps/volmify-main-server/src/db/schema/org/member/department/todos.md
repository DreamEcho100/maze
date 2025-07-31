# Todos

## **Budget Authority Deep Dive**

The `budgetAuthority` field creates potential **hierarchy conflicts**:

```javascript
// Current schema:
orgDepartment.budgetAuthority       // Department-level budget control
orgDepartment.parentDepartmentId    // Hierarchical structure

// BUSINESS LOGIC QUESTIONS:
// 1. Budget inheritance rules?
Department A (budgetAuthority: $50K)
├── Department B (budgetAuthority: $30K)  // ✅ Within parent limit
├── Department C (budgetAuthority: $60K)  // ❌ Exceeds parent limit?

// 2. Cross-departmental team budgets?
Team X (members from Dept A + Dept B)
├── Dept A budget: $20K remaining
├── Dept B budget: $15K remaining  
├── Team project needs: $40K        // Which department's budget? Both? Neither?

// 3. Employee expense authority?
Employee in Department A:
├── Department budget: $30K
├── Employee expense: $5K purchase
├── Does employee inherit department's budget authority automatically?
```

**Recommendation**: Define clear budget **inheritance and delegation rules**:
- Parent department budget limits child departments
- Teams inherit budget from primary department of team lead
- Employee spending authority separate from department budget authority
