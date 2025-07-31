# Todos

## **Invitation System CTI Approach**

Your CTI idea for invitations is **brilliant**:

```javascript
// CURRENT: Separate systems
orgMemberInvitation    // Customer onboarding  
orgEmployeeInvitation  // Staff recruitment

// PROPOSED CTI: Unified invitation system
orgInvitation          // Base invitation
├── orgInvitationMemberContext    // Customer invitation context
├── orgInvitationEmployeeContext  // Staff invitation context  
└── orgInvitationRequestContext   // Join request context

// BENEFITS:
// ✅ Handles: invite, request-to-join, promote-member-to-employee
// ✅ Unified approval workflow
// ✅ Private org access control
// ✅ Role transition management
```

This would be **much cleaner** than separate systems!
