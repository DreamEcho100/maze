# Authentication System Documentation

A comprehensive, strategy-aware authentication system supporting both traditional sessions and JWT tokens with platform-specific optimizations.

## Architecture Overview

### Core Design Principles

1. **Strategy Agnostic**: Supports both `session` and `jwt` authentication strategies
2. **Platform Aware**: Automatically detects and optimizes for web vs mobile/tablet platforms
3. **Security First**: Implements best practices for token storage and validation
4. **Type Safe**: Full TypeScript support with comprehensive type definitions

### Supported Strategies

#### Session Strategy

- **Traditional server-side sessions** with secure cookies
- **Database-stored sessions** for complete control and instant revocation
- **Cookie-based** for web, **token-based** for mobile

#### JWT Strategy

- **Stateless access tokens** (15 min) - no database lookups needed
- **Stateful refresh tokens** (30 days) - stored in database for revocation
- **Platform-optimized delivery**: cookies for web, direct tokens for mobile

## File Structure

```
packages/auth/src/
├── types.ts                    # TypeScript definitions
├── utils/strategy/
│   ├── index.js               # Main strategy orchestrator
│   ├── sessions.js            # Session strategy implementation
│   ├── jwt.js                 # JWT strategy implementation
└── init/index.js              # Configuration initialization
```

## Core Components

### 1. Strategy Orchestrator (index.js)

The main entry point that abstracts strategy differences and provides unified APIs.

#### Key Functions

##### `createAuthSession(props, options)`

Creates authentication sessions regardless of strategy.

**Parameters:**

```javascript
{
  data: {
    token?: string,          // Optional pre-generated token
    user: User,              // User object
    metadata: SessionMetadata // Session metadata (IP, userAgent, etc.)
  }
}
```

**Returns:**

- **Session Strategy**: `{ strategy: "session", data: { user, session }, token, expiresAt }`
- **JWT Strategy**: `{ strategy: "jwt", data: { metadata, user, session } }`

##### `getCurrentAuthSession(options)`

Retrieves current authentication state with automatic token validation.

**Flow:**

1. **JWT**: Validates access token → Falls back to refresh token if expired
2. **Session**: Validates session token → Extends expiration if near expiry

##### `setOneAuthSessionToken(param, userAgent)`

Platform-aware token delivery system.

**Web Platforms:**

- Sets secure, httpOnly cookies
- Returns minimal data (no actual tokens)

**Mobile/Tablet Platforms:**

- Returns actual tokens in response
- No cookies set

### 2. Session Strategy (sessions.js)

Traditional session-based authentication with database storage.

#### Key Features

- **30-day expiration** with automatic extension
- **Automatic cleanup** of expired sessions
- **IP tracking** and user agent logging
- **Secure cookie management**

#### Session Lifecycle

```javascript
// 1. Create session
const result = await createSession({
	data: {
		token: generateSessionToken(),
		userId: user.id,
		ipAddress: req.ip,
		userAgent: req.userAgent,
		flags: { twoFactorVerifiedAt: null },
	},
});

// 2. Validate session
const validation = await validateSessionToken(token);

// 3. Extend if needed (within 15 days of expiry)
if (nearExpiry) {
	await extendSession(sessionId, newExpiryDate);
}
```

#### Database Schema (DBSession)

```typescript
interface DBSession {
	id: string; // SHA-256 hash of token
	userId: string;
	createdAt: DateLike;
	expiresAt: DateLike;
	sessionType: "session";
	ipAddress?: string | null;
	userAgent?: UserAgent | null;
	twoFactorVerifiedAt?: DateLike | null;
	lastUsedAt?: DateLike | null;
	revokedAt?: DateLike | null;
	metadata?: Record<string, any> | null;
}
```

### 3. JWT Strategy (jwt.js)

Modern JWT-based authentication with refresh token storage.

#### Token Architecture

##### Access Tokens (15 minutes)

- **Stateless**: All user data embedded in JWT payload
- **No database storage**: Only JWT signature validation
- **Self-contained**: Includes user info to avoid DB calls

**Payload Structure:**

```javascript
{
  user: {
    id: "user123",
    name: "John Doe",
    email: "john@example.com",
    // ... other user fields
  },
  metadata: {
    userId: "user123",
    sessionType: "jwt_refresh_token",
    ipAddress: "192.168.1.1",
    userAgent: { /* UserAgent object */ },
    twoFactorVerifiedAt: null,
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-31T00:00:00Z"
  },
  customClaims: {
    twoFactorVerified: false
  }
}
```

##### Refresh Tokens (30 days)

- **Stateful**: Hash stored in database for revocation
- **Single-use**: Revoked immediately upon refresh
- **Trackable**: Full session metadata stored

#### JWT Lifecycle

```javascript
// 1. Create JWT pair
const { accessToken, refreshToken } = createJWTAuth({
	data: { user, metadata },
});

// 2. Validate access token (no DB call)
const payload = validateJWTAccessToken(accessToken);
if (payload) {
	// Use embedded user data
	const user = payload.user;
}

// 3. Refresh when access token expires
const newTokens = await refreshJWTTokens({
	refreshToken,
	ipAddress,
	userAgent,
});
```

#### Database Storage (Refresh Tokens Only)

```typescript
interface DBSession {
	id: string; // SHA-256 hash of refresh token
	userId: string;
	sessionType: "jwt_refresh_token";
	expiresAt: DateLike; // 30 days from creation
	// ... other session fields
}
```

## Platform Detection & Token Delivery

### Detection Logic

```javascript
const isDeviceMobileOrTablet = (userAgent) =>
	userAgent.device.type === "mobile" || userAgent.device.type === "tablet";
```

### Delivery Strategies

#### Web Platforms

```javascript
// Set secure cookies
authConfig.cookies.set("jwt_access_token", accessToken, {
	httpOnly: true,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	expires: accessExpiresAt,
	path: "/",
});

// Return minimal data
return {
	strategy: "jwt",
	platform: "web",
	accessExpiresAt,
	refreshExpiresAt,
};
```

#### Mobile/Tablet Platforms

```javascript
// Return actual tokens
return {
	strategy: "jwt",
	platform: "mobile/tablet",
	accessToken,
	refreshToken,
	accessExpiresAt,
	refreshExpiresAt,
};
```

## Security Features

### Token Security

- **SHA-256 hashing** for all stored tokens
- **Secure random generation** using `crypto.getRandomValues()`
- **httpOnly cookies** prevent XSS attacks
- **SameSite=lax** prevents CSRF attacks

### Session Management

- **Automatic expiration** with cleanup
- **Instant revocation** capability
- **IP tracking** for security monitoring
- **2FA integration** support

### JWT Security

- **Short-lived access tokens** (15 min) minimize exposure
- **Refresh token rotation** on every use
- **Database revocation** for refresh tokens
- **Signature verification** for access tokens

## Database Integration

### Required Providers

#### SessionsProvider

```typescript
interface SessionsProvider {
	createOne(props: { data: DBSession }): Promise<DBSession & { user: User }>;
	findOneWithUser(sessionId: string): Promise<{ session: DBSession; user: User } | null>;
	deleteOneById(sessionId: string): Promise<void>;
	deleteAllByUserId(props: { where: { userId: string } }): Promise<void>;
	revokeOneById(id: string): Promise<void>;
	revokeAllByUserId(props: { where: { userId: string } }): Promise<void>;
	extendOneExpirationDate(sessionId: string, expiresAt: Date): Promise<DBSession>;
	markOne2FAVerified(props: { where: { id: string } }): Promise<DBSession>;
}
```

#### UsersProvider

```typescript
interface UsersProvider {
	findOneById(id: string): Promise<User | null>;
	findOneByEmail(email: string): Promise<User | null>;
	createOne(values: CreateUserData): Promise<User>;
	// ... other user operations
}
```

### Cookie & Headers Providers

```typescript
interface CookiesProvider {
	get(name: string): string | null;
	set(name: string, value: string, options?: CookieOptions): void;
}

interface HeadersProvider {
	get(name: string): string | null;
	set(name: string, value: string): void;
}
```

## Configuration

### Initialization

```javascript
import { initAuth } from "./init/index.js";

const authConfig = initAuth({
	strategy: "jwt", // or 'session'
	providers: {
		users: userProvider,
		sessions: sessionProvider,
		passwordResetSessions: passwordResetProvider,
		userEmailVerificationRequests: emailVerificationProvider,
	},
	cookies: cookieProvider,
	headers: headerProvider,
	jwt: jwtProvider,
	ids: idProvider,
});
```

### JWT Provider Requirements

```typescript
interface JWTProvider {
	createTokenPair(props: { data: JWTRefreshTokenPayload }): {
		accessToken: string;
		refreshToken: string;
	};
	verifyAccessToken(
		token: string,
	): { exp: number; iat: number; payload: JWTRefreshTokenPayload } | null;
	createRefreshToken(props: { data: { user: User; metadata: SessionMetadata } }): string;
}
```

## Usage Examples

### Login Implementation

```javascript
// 1. Authenticate user
const user = await authenticateUser(email, password);

// 2. Create auth session
const authSession = await createAuthSession({
	data: {
		user,
		metadata: {
			ipAddress: req.ip,
			userAgent: req.userAgent,
			twoFactorVerifiedAt: null,
		},
	},
});

// 3. Set tokens based on platform
const tokens = setOneAuthSessionToken(authSession, req.userAgent);

// 4. Return appropriate response
if (tokens.platform === "mobile/tablet") {
	return { tokens }; // Return tokens in response
} else {
	return { success: true }; // Tokens are in cookies
}
```

### Middleware Implementation

```javascript
export async function authMiddleware(req, res, next) {
	const result = await getCurrentAuthSession({
		ipAddress: req.ip,
		userAgent: req.userAgent,
	});

	if (!result.user) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	req.user = result.user;
	req.session = result.session;
	next();
}
```

### Logout Implementation

```javascript
// Single session logout
await invalidateOneAuthSessionToken({ where: { sessionId: session.id } }, { deleteCookie: true });

// All sessions logout
await invalidateAllUserAuth({ where: { userId: user.id } });
```

## Error Handling

### Common Error Scenarios

1. **Expired tokens**: Automatically cleaned up and cookies cleared
2. **Invalid tokens**: Validation returns null, triggers cleanup
3. **Revoked sessions**: Database checks prevent usage
4. **Missing user**: Validation fails gracefully

### Best Practices

- Always check for null returns from validation functions
- Clear cookies when sessions become invalid
- Handle refresh token failures gracefully
- Log security events for monitoring

## Performance Considerations

### JWT Strategy Benefits

- **Reduced database load**: Access tokens don't require DB calls
- **Scalable**: Stateless access token validation
- **Fast authentication**: O(1) token verification

### Session Strategy Benefits

- **Instant revocation**: Immediate session invalidation
- **Complete control**: Full session lifecycle management
- **Simpler implementation**: Traditional session handling

### Optimization Tips

1. **Use JWT for high-traffic APIs** to reduce DB load
2. **Use sessions for admin interfaces** requiring instant revocation
3. **Implement proper caching** for user lookups
4. **Monitor token refresh patterns** for security

## Extension Points

### Custom Claims

Add custom data to JWT payloads:

```javascript
const { accessToken } = authConfig.jwt.createTokenPair({
	data: {
		user,
		metadata,
		customClaims: {
			role: "admin",
			permissions: ["read", "write"],
			organizationId: "org123",
		},
	},
});
```

### Custom Session Metadata

Store additional session information:

```javascript
const authSession = await createAuthSession({
	data: {
		user,
		metadata: {
			ipAddress: req.ip,
			userAgent: req.userAgent,
			deviceFingerprint: generateFingerprint(req),
			loginMethod: "password", // or 'oauth', 'magic-link'
		},
	},
});
```

### Strategy Selection

Dynamically choose strategy based on client:

```javascript
const strategy = req.headers["x-client-type"] === "mobile" ? "jwt" : "session";
```

This authentication system provides a robust, flexible foundation that can be extended and customized based on specific application requirements while maintaining security best practices.
