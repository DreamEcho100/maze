# Todos

## **Revenue Attribution - Need Clarification**

#### **Cross-Product Attribution**
```javascript
// SCENARIO: John creates Course A and Course B
orgEmployeeProductAttribution: [
  { employeeId: "john", productId: "courseA", revenueSharePercentage: 80 },
  { employeeId: "john", productId: "courseB", revenueSharePercentage: 90 }
]

// QUESTION: Is this valid?
// John gets 80% of Course A revenue + 90% of Course B revenue
// This seems fine per-product, but what about John's total workload?
// Should there be validation of total attribution hours/effort across products?
```

#### **Revenue Calculation Flow**
You're absolutely right that revenue should be **post-platform fees**:

```javascript
// RECOMMENDED FLOW:
Customer pays: $100
├── Platform fee (5%): $5
├── Processing fee (3%): $3  
├── Tax withholding: $8
└── Net revenue: $84

// THEN attribution on $84:
orgEmployeeProductAttribution: { revenueSharePercentage: 70 } // 70% of $84 = $58.80
orgProductRevenuePool: { totalAllocationPercentage: 100 }     // 100% of $84 allocated
```

**Tax Withholding**: Some jurisdictions require **automatic tax deduction** from creator payments (like US 1099 contractors). Should `orgTaxRateSnapshot` handle this?
