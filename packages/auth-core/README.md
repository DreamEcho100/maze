# 🔐 Maze Auth

A **framework-agnostic**, **dependency injection-based** authentication library
for modern JavaScript applications.

## 🎯 **Philosophy**

Built on the principle of **explicit dependencies over implicit magic**.  
Unlike traditional auth libraries that rely on global configuration and hidden  
dependencies, Maze Auth uses **dependency injection** to provide:

- ✅ **Framework Agnostic** - Works with Next.js, SvelteKit, Express, Fastify, etc.
- ✅ **Testable** - Easy to mock individual providers for testing
- ✅ **Type Safe** - Explicit provider contracts with TypeScript support
- ✅ **Composable** - Services receive exactly what they need
- ✅ **Scalable** - Services can be deployed independently

## 🚀 **Quick Start**

### **1. Install the Core Library**

```bash
npm install @maze/auth
```

### **2. Define Your Providers**

```javascript
// Your database provider implementations
const authProviders = {
	users: {
		createOne: async (data) => {
			/* your DB logic */
		},
		findOneByEmail: async (email) => {
			/* your DB logic */
		},
		updateOnePassword: async (userId, hash) => {
			/* your DB logic */
		},
		// ... other methods
	},
	sessions: {
		createOne: async (data) => {
			/* your DB logic */
		},
		findOneWithUser: async (id) => {
			/* your DB logic */
		},
		deleteOne: async (id) => {
			/* your DB logic */
		},
		// ... other methods
	},
	emailVerification: {
		createOne: async (data) => {
			/* your DB logic */
		},
		findOneByCode: async (code) => {
			/* your DB logic */
		},
		deleteOne: async (id) => {
			/* your DB logic */
		},
		// ... other methods
	},
};
```

### **3. Use Authentication Services**

```javascript
import { loginUserService, registerUserService } from "@maze/auth/services";

// Login user
const loginResult = await loginUserService({
	authProviders: {
		users: {
			findOneByEmail: authProviders.users.findOneByEmail,
			getOnePasswordHash: authProviders.users.getOnePasswordHash,
		},
		sessions: {
			createOne: authProviders.sessions.createOne,
		},
	},
	data: { email, password },
	cookies: yourCookieHandler,
	headers: yourHeaders,
	userAgent: yourUserAgent,
});

// Register user
const registerResult = await registerUserService({
	authProviders: {
		users: {
			createOne: authProviders.users.createOne,
			findOneByEmail: authProviders.users.findOneByEmail,
		},
		emailVerification: {
			createOne: authProviders.emailVerification.createOne,
		},
	},
	data: { email, password, name },
	// ... other context
});
```

## 🏗️ **Architecture**

### **Dependency Injection Pattern**

```javascript
// ❌ Old Way: Global configuration (NextAuth.js style)
const authConfig = {
  providers: [...],
  callbacks: {...}
};
const session = await getServerSession(authConfig);

// ✅ New Way: Explicit dependencies
const result = await loginUserService({
  authProviders: {
    users: { findOneByEmail: userProvider.findOneByEmail },
    sessions: { createOne: sessionProvider.createOne }
  },
  data: loginData
});
```

### **Service-Level Provider Specification**

Each service declares exactly what it needs:

```javascript
/**
 * @param {{
 *   users: {
 *     findOneByEmail: (email: string) => Promise<User | null>;
 *     getOnePasswordHash: (userId: string) => Promise<string>;
 *   };
 *   sessions: {
 *     createOne: (data: SessionData) => Promise<Session>;
 *   };
 * }} authProviders
 */
export async function loginUserService({ authProviders, data, cookies }) {
	// Service implementation with explicit dependencies
}
```

## 📦 **Framework Adapters**

### **Next.js + Drizzle**

```bash
npm install @maze/auth-nextjs-drizzle
```

```javascript
import { createNextJsAuthProviders } from "@maze/auth-nextjs-drizzle";

import { db } from "./db";

const authProviders = createNextJsAuthProviders(db);

// Use in API routes, server actions, middleware
export async function POST(request) {
	return loginUserService({
		authProviders,
		data: await request.json(),
		cookies: cookies(),
		headers: headers(),
	});
}
```

### **SvelteKit + Prisma**

```bash
npm install @maze/auth-sveltekit-prisma
```

```javascript
import { createSvelteKitAuthProviders } from "@maze/auth-sveltekit-prisma";

import { prisma } from "./db";

const authProviders = createSvelteKitAuthProviders(prisma);

// Use in server-side load functions and actions
export const actions = {
	login: async ({ request, cookies }) => {
		return loginUserService({
			authProviders,
			data: await request.formData(),
			cookies,
		});
	},
};
```

## 🔒 **Security Features**

### **Session Management**

- JWT + Refresh Token strategy
- Traditional database sessions
- Automatic session cleanup
- Device fingerprinting

### **Two-Factor Authentication**

- TOTP (Time-based One-Time Password)
- Recovery codes
- QR code generation

### **Password Security**

- Argon2 hashing
- Password strength validation
- Secure password reset flows

## 🛣️ **Development Roadmap**

## 🚨 **Phase 1: Core Library Enhancement**

### **1.1 Provider Interface Standardization**

- [x] **Implement dependency injection pattern** - ✅ **COMPLETED**
- [x] **Remove global configuration dependencies** - ✅ **COMPLETED**
- [x] **Service-level provider specification** - ✅ **COMPLETED**

### **1.2 Input Validation Completion**

- [ ] **Complete Zod validation** for all remaining services
- [ ] **Standardize validation error responses**
- [ ] **Add reusable validation schemas**

### **1.3 Provider Method Consistency**

- [ ] **Ensure all provider implementations follow naming conventions**
- [ ] **Add provider validation utilities**
- [ ] **Complete JSDoc documentation** for all provider interfaces

## 🚀 **Phase 2: Framework Adapters**

### **2.1 Next.js Ecosystem**

- [ ] **@maze/auth-nextjs-drizzle** - Complete Next.js + Drizzle integration
- [ ] **@maze/auth-nextjs-prisma** - Next.js + Prisma integration
- [ ] **React hooks** for client-side auth state
- [ ] **Server actions** for all auth flows

### **2.2 Additional Frameworks**

- [ ] **@maze/auth-sveltekit** - SvelteKit integration
- [ ] **@maze/auth-express** - Express.js integration
- [ ] **@maze/auth-fastify** - Fastify integration

### **2.3 Database Adapters**

- [ ] **MongoDB adapter** for document-based storage
- [ ] **SQLite adapter** for lightweight applications
- [ ] **Redis adapter** for session storage

## 🛡️ **Phase 3: Advanced Features**

### **3.1 Enhanced Security**

- [ ] **Rate limiting provider interface**
- [ ] **Audit logging hooks**
- [ ] **CSRF protection utilities**
- [ ] **Suspicious activity detection**

### **3.2 Multi-Factor Authentication**

- [ ] **WebAuthn/Passkey support**
- [ ] **SMS-based 2FA provider interface**
- [ ] **Backup authentication methods**
- [ ] **Device trust management**

### **3.3 Social Authentication**

- [ ] **OAuth provider interface design**
- [ ] **Popular OAuth providers** (Google, GitHub, Discord)
- [ ] **Account linking workflows**
- [ ] **Social profile synchronization**

## 📱 **Phase 4: Multi-Platform Support**

### **4.1 Mobile Integration**

- [ ] **React Native adapter**
- [ ] **Expo integration**
- [ ] **Mobile-specific security considerations**

### **4.2 Desktop Applications**

- [ ] **Electron adapter**
- [ ] **Tauri integration**
- [ ] **Desktop security patterns**

## 🏢 **Phase 5: Enterprise Features**

### **5.1 Multi-Tenancy**

- [ ] **Organization/tenant provider interface**
- [ ] **Tenant-scoped authentication**
- [ ] **Cross-tenant security**

### **5.2 Advanced Administration**

- [ ] **Admin dashboard components**
- [ ] **User management APIs**
- [ ] **Security analytics**

## 📚 **Phase 6: Developer Experience**

### **6.1 Documentation & Examples**

- [ ] **Comprehensive provider implementation guides**
- [ ] **Migration guides** from other auth solutions
- [ ] **Example applications** for each framework
- [ ] **Security best practices** documentation

### **6.2 Tooling**

- [ ] **CLI tools** for project setup
- [ ] **Provider validation utilities**
- [ ] **Migration tools** between providers
- [ ] **Configuration validation**

## 🧪 **Phase 7: Testing & Quality**

### **7.1 Testing Infrastructure**

- [ ] **Comprehensive test suite** with provider mocks
- [ ] **Integration tests** for auth workflows
- [ ] **Performance benchmarks**
- [ ] **Security penetration testing**

### **7.2 Monitoring & Analytics**

- [ ] **Auth metrics provider interface**
- [ ] **Performance monitoring hooks**
- [ ] **Error tracking integration**

## 🎯 **Current Implementation Status**

### **✅ Completed (Your Recent Refactor)**

- ✅ **Dependency injection architecture**
- ✅ **Framework-agnostic core library**
- ✅ **Service-level provider specification**
- ✅ **Explicit dependency management**
- ✅ **Provider composition patterns**

### **🚧 In Progress**

- 🚧 **Next.js + Drizzle adapter** (apps/volmify implementation)
- 🚧 **Input validation standardization**
- 🚧 **Provider interface documentation**

### **📋 Next Up**

1. **Complete framework adapter for Next.js + Drizzle**
2. **Standardize all provider interfaces**
3. **Add comprehensive testing suite**
4. **Create detailed documentation**

## 🏆 **Success Metrics**

- ✅ **Zero global dependencies** - Pure dependency injection
- ✅ **Framework adapters** for top 3 frameworks
- ✅ **Database adapters** for top 3 ORMs
- ✅ **Production usage** in 10+ applications
- ✅ **Community adoption** with 1000+ stars
- ✅ **Enterprise readiness** with security audits

## 🤝 **Contributing**

The library is built on **modern software engineering principles**:

- **Dependency Injection** over global configuration
- **Explicit contracts** over implicit magic
- **Composition** over inheritance
- **Framework agnostic** over framework lock-in

This architectural foundation makes Maze Auth suitable for **enterprise applications**
while maintaining **developer experience** simplicity.
