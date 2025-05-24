# 🛣️ Maze Auth Development Roadmap

Based on comprehensive analysis of your authentication library codebase, here's the actual roadmap:

## 🚨 **Phase 1: Critical Fixes & Consistency**

### **1.1 Provider Interface Naming Convention**

- [ ] **Update ALL provider interfaces to use One/Many/All convention**:

  ```typescript
  // In #types.ts - fix interface definitions:
  findByEmail → findOneByEmail
  getPasswordHash → getOnePasswordHash  
  getTOTPKey → getOneTOTPKey
  updatePassword → updateOnePassword
  updateEmailAndVerify → updateOneEmailAndVerify
  verifyEmailIfMatches → verifyOneEmailIfMatches
  getRecoveryCode → getOneRecoveryCode
  getRecoveryCodeRaw → getOneRecoveryCodeRaw
  updateRecoveryCode → updateOneRecoveryCode
  updateTOTPKey → updateOneTOTPKey
  
  // Sessions:
  create → createOne
  findWithUser → findOneWithUser  
  extend → extendOne
  delete → deleteOne
  deleteByUser → deleteAllByUserId (already correct)
  
  // Email Verification:
  create → createOne
  findByCode → findOneByCode
  delete → deleteOne
  deleteByUser → deleteAllByUserId
  
  // Password Reset:
  create → createOne
  findWithUser → findOneWithUser
  delete → deleteOne
  markEmailVerified → markOneEmailVerified
  mark2FAVerified → markOne2FAVerified (already correct)
  deleteByUser → deleteAllByUserId
  ```

### **1.2 Provider Implementation Completion**

- [ ] **Add provider validation utilities**:

  ```javascript
  // Create validator to ensure all required methods exist
  export function validateProviders() {
    const requiredMethods = {
      userProvider: ['createOne', 'findOneByEmail', 'updateOnePassword', /*...*/],
      sessionProvider: ['createOne', 'findOneWithUser', 'deleteOne', /*...*/],
      // ... other providers
    };
    
    for (const [providerName, methods] of Object.entries(requiredMethods)) {
      for (const method of methods) {
        if (typeof providers[providerName][method] !== 'function') {
          throw new Error(`${providerName}.${method} is not implemented`);
        }
      }
    }
  }
  ```

- [ ] **Add default implementation examples** in documentation:

  ```javascript
  // Example implementation to guide users
  const exampleUserProvider = {
    createOne: async (email, name, passwordHash, recoveryCode) => {
      // Database implementation example
    },
    findOneByEmail: async (email) => {
      // Database query example  
    },
    // ... all methods with examples
  };
  ```

### **1.3 Error Code Corrections**

- [x] **Fix wrong error codes in 2FA services**:

  ```javascript
  // In #recovery-code.js line 20:
  return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_REQUIRED;
  // Should be: RECOVERY_CODE_REQUIRED

  // In #recovery-code.js line 31:
  return VERIFY_PASSWORD_RESET_2FA_VIA_RECOVERY_CODE_MESSAGES_ERRORS.TOTP_CODE_INVALID;
  // Should be: RECOVERY_CODE_INVALID
  ```

## 🏗️ **Phase 2: Core Implementation Completion**

### **2.1 Input Validation Standardization**

- [ ] **Convert all manual validation to Zod**:

  ```javascript
  // Found inconsistent validation patterns:
  
  // Some use Zod (good):
  const input = updateUserPasswordSchema.safeParse(data);
  
  // Others use manual checks (convert these):
  if (typeof code !== "string" || !code) {
    return ERROR_MESSAGE;
  }
  
  // Some have TODO comments (implement these):
  // TODO: Add validation using `zod` (in #totp.js)
  ```

- [ ] **Create reusable validation schemas**:

  ```javascript
  // In new file: #src/validation/schemas.js
  export const emailSchema = z.string().email();
  export const passwordSchema = z.string().min(8);
  export const totpCodeSchema = z.string().length(6).regex(/^\d+$/);
  export const recoveryCodeSchema = z.string().length(10);
  ```

### **2.2 Session Cleanup Mechanisms**

- [ ] **Add automatic session cleanup**:

  ```javascript
  // Missing cleanup scenarios:
  
  // 1. Expired session cleanup utility:
  export async function cleanupExpiredSessions() {
    const expiredSessions = await sessionProvider.findManyExpired();
    for (const session of expiredSessions) {
      await sessionProvider.deleteOne(session.id);
    }
  }
  
  // 2. Cleanup on password change:
  export async function updateUserPasswordService(userId, newPassword) {
    await userProvider.updateOnePassword(userId, newPassword);
    // Invalidate all user sessions except current
    await sessionProvider.deleteAllByUserIdExcept(userId, currentSessionId);
  }
  
  // 3. Cleanup abandoned password reset sessions:
  export async function cleanupExpiredPasswordResetSessions() {
    await passwordResetSessionProvider.deleteAllExpired();
  }
  ```

### **2.3 Complete 2FA Workflow Utilities**

- [ ] **Add missing 2FA utilities**:

  ```javascript
  // Missing QR code generation:
  export function generateTOTPQRCode(secret, userEmail, issuer) {
    const otpauthUrl = `otpauth://totp/${issuer}:${userEmail}?secret=${secret}&issuer=${issuer}`;
    return generateQRCode(otpauthUrl);
  }
  
  // Missing recovery code regeneration:
  export async function regenerateRecoveryCodesService(userId) {
    const newRecoveryCodes = generateRecoveryCodes(10);
    await userProvider.updateOneRecoveryCode(userId, encrypt(newRecoveryCodes));
    return newRecoveryCodes;
  }
  
  // Missing backup authentication methods:
  export async function verify2FABackupMethod(userId, backupCode) {
    // Implementation for backup 2FA verification
  }
  ```

### **2.4 Complete Admin Services**

- [ ] **Add comprehensive admin functionality**:

  ```javascript
  // Missing admin services in #services/settings/admin/:
  
  // User management:
  export async function adminListUsersService(filters, pagination) {
    // List and filter users
  }
  
  export async function adminDisableUserService(userId, reason) {
    // Disable user account
  }
  
  export async function adminDeleteUserService(userId) {
    // Delete user and cleanup all related data
  }
  
  // Session management:
  export async function adminListUserSessionsService(userId) {
    // List all sessions for a user
  }
  
  export async function adminInvalidateSessionService(sessionId) {
    // Admin can invalidate any session
  }
  
  // Audit logs:
  export async function adminGetAuditLogsService(filters) {
    // Get authentication audit logs
  }
  ```

## 🔧 **Phase 3: Developer Experience Improvements**

### **3.1 TypeScript Enhancement**

- [ ] **Create comprehensive type definitions** for all providers
- [ ] **Add generic type support** for provider responses
- [ ] **Improve JSDoc with better examples** and usage patterns

### **3.2 Error Handling Standardization**

- [ ] **Create AuthError class** for consistent error handling
- [ ] **Add error code documentation**
- [ ] **Standardize error response shapes**

## 🚀 **Phase 4: Framework Adapters (Your Planned Roadmap)**

### **4.1 Next.js + Drizzle Adapter**

- [ ] **Create @maze/auth-nextjs-drizzle package**
- [ ] **Implement complete Drizzle provider implementations**
- [ ] **Add Next.js server actions and middleware**
- [ ] **Create React hooks for client-side auth state**

### **4.2 Additional Database Adapters**

- [ ] **Create @maze/auth-prisma package**
- [ ] **Create @maze/auth-mongodb package**
- [ ] **Add database migration utilities**

### **4.3 Email Service Adapters**

- [ ] **Create email provider adapters** for:
  - Resend
  - SendGrid  
  - Nodemailer
  - AWS SES

## 🛡️ **Phase 5: Advanced Integrations (Framework Adapter Features)**

### **5.1 Rate Limiting Integration**

- [ ] **Design rate limiting provider interface** for framework adapters:

  ```javascript
  const rateLimitProvider = {
    checkRateLimit: (operation, identifier) => Promise<{allowed: boolean, resetTime?: Date}>,
    recordAttempt: (operation, identifier, success) => Promise<void>
  };
  ```

### **5.2 Audit & Logging Integration**

- [ ] **Design audit logging provider interface** for framework adapters:

  ```javascript
  const auditProvider = {
    logAuthEvent: (event, userId, metadata) => Promise<void>
  };
  ```

## 📚 **Phase 6: Documentation & Examples**

### **6.1 Provider Implementation Guides**

- [ ] **Write detailed provider implementation guides**
- [ ] **Create step-by-step integration tutorials**
- [ ] **Document naming conventions and patterns**

### **6.2 Example Applications**

- [ ] **Next.js + Drizzle complete example**
- [ ] **SvelteKit + Prisma example**
- [ ] **Express.js + MongoDB example**

### **6.3 Testing Suite**

- [ ] **Create comprehensive test suite** with provider mocks
- [ ] **Add integration tests** for authentication workflows
- [ ] **Provider validation tests**

## 🔮 **Phase 7: Advanced Features**

### **7.1 Multi-tenancy Support**

- [ ] **Design organization/tenant provider interface**
- [ ] **Add tenant-scoped authentication patterns**

### **7.2 Social Authentication**

- [ ] **Design OAuth provider interface**
- [ ] **Add OAuth provider examples**

### **7.3 Advanced 2FA**

- [ ] **Add WebAuthn/Passkey provider interface**
- [ ] **Design SMS-based 2FA provider interface**

## 📦 **Phase 8: Ecosystem & Tooling**

### **8.1 CLI Tools**

- [ ] **Create setup CLI** for quick project initialization
- [ ] **Add provider validation tools**

### **8.2 Developer Tooling**

- [ ] **Provider interface validation utilities**
- [ ] **Auth flow testing helpers**

## 🎯 **Immediate Action Items (This Week)**

1. **Fix provider interface naming** to include One/Many/All:
   - Update #types.ts with correct method names
   - Update all service calls to match new interface names

2. **Fix error code mismatches** in 2FA verification services:
   - Recovery code service error codes
   - Ensure all error codes match their context

3. **Add missing Zod validation** where marked with TODO

4. **Add provider validation utilities** to ensure implementations are complete

5. **Complete session cleanup mechanisms** for security

## 🏆 **Success Metrics**

- ✅ All provider methods follow One/Many/All naming convention
- ✅ All services use consistent Zod validation
- ✅ Complete provider validation ensures no missing implementations
- ✅ Comprehensive session cleanup and security measures
- ✅ Framework adapters for top 3 frameworks
- ✅ Database adapters for top 3 ORMs

## 📝 **Core Library vs Framework Adapter Boundaries**

### **✅ Core Library Responsibilities:**

- Authentication logic and security implementations
- Provider interfaces with proper naming conventions
- Input validation and error handling
- Session cleanup and security utilities
- Complete admin management APIs

### **🔌 Framework Adapter Responsibilities:**

- Rate limiting implementations
- Audit logging systems
- CSRF protection
- Performance monitoring
- Database-specific implementations
- Framework-specific integrations

This keeps your core library comprehensive and secure while enabling rich integrations through adapters.
