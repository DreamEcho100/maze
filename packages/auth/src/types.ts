/* eslint-disable @typescript-eslint/no-explicit-any */
// import type {
//   EmailVerificationRequest as EmailVerificationRequest,
//   Organization as Organization,
//   PasswordResetSession as PasswordResetSession,
//   DBSession as DBSession,
//   User as User,
// } from "@prisma/client";

type DateLike = string | number | Date;
type AsyncGetCookie = (name: string) => Promise<string | null | undefined>;

export interface EmailVerificationRequest {
	id: string;
	createdAt: DateLike;
	userId: string;
	expiresAt: DateLike;
	email: string;
	code: string;
}

export interface UserAgent {
	isBot: boolean;
	ua: string;
	browser: {
		name?: string;
		version?: string;
		major?: string;
	};
	device: {
		model?: string;
		type?: string;
		vendor?: string;
	};
	engine: {
		name?: string;
		version?: string;
	};
	os: {
		name?: string;
		version?: string;
	};
	cpu: {
		architecture?: string;
	};
}

interface Organization {
	id: string;
	createdAt: DateLike;
	updatedAt?: DateLike | null;
	ownerId: string;
}

interface User {
	name: string;
	id: string;
	createdAt: DateLike;
	updatedAt?: DateLike | null;
	email: string;
	// passwordHash: string;
	emailVerifiedAt?: DateLike | null;
	twoFactorEnabledAt?: DateLike | null;
	// `twoFactorRegisteredAt` is the date when the user registered for 2FA
	// TODO: not handled properly in the code
	twoFactorRegisteredAt?: DateLike | null;
	// totpKey?: Buffer | null;
	// recoveryCode?: Buffer | null;
	// type?: string | null;
	// organizationId?: string | null;
	// organization?: Organization | null;
}

interface DBSession {
	id: string; // Unique session ID
	tokenHash: Uint8Array<ArrayBufferLike>; // Hashed secret for the session
	createdAt: DateLike;
	userId: string;
	expiresAt: DateLike;
	lastVerifiedAt?: DateLike | null;
	lastExtendedAt?: DateLike | null;
	twoFactorVerifiedAt?: DateLike | null;
	// token: string;
	ipAddress?: string | null;
	userAgent?: UserAgent | null;
	//
	authStrategy: AuthStrategy | (string & {});
	revokedAt?: DateLike | null;
	lastUsedAt?: DateLike | null;
	metadata?: Record<string, any> | null;
}

interface ClientSession {
	id: string; // Unique session ID `${id}.${tokenHash}`
	createdAt: DateLike;
	userId: string;
	expiresAt: DateLike;
	twoFactorVerifiedAt?: DateLike | null;
	// token: string;
	ipAddress?: string | null;
	userAgent?: UserAgent | null;
	//
	authStrategy: AuthStrategy | (string & {});
	revokedAt?: DateLike | null;
	lastUsedAt?: DateLike | null;
	metadata?: Record<string, any> | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SessionMetadata
	extends Omit<
		ClientSession,
		"token" | "expiresAt" | "id" | "lastUsedAt" | "createdAt" | "authStrategy" | "revokedAt"
	> {
	// authStrategy: AuthStrategy;
}

interface SessionWithUser {
	session: ClientSession;
	user: User;
}

interface ValidSessionResult {
	session: ClientSession;
	user: User;
}

interface InvalidSessionResult {
	session: null;
	user: null;
}

type SessionValidationResult = ValidSessionResult | InvalidSessionResult;

interface PasswordResetSession {
	id: string;
	createdAt: DateLike;
	userId: string;
	expiresAt: DateLike;
	twoFactorVerifiedAt?: DateLike | null;
	email: string;
	emailVerifiedAt?: DateLike | null;
	code: string;
}

interface PasswordResetSessionValidationSuccessResult {
	session: PasswordResetSession;
	user: User;
}

interface PasswordResetSessionValidationFailureResult {
	session: null;
	user: null;
}

type PasswordResetSessionValidationResult =
	| PasswordResetSessionValidationSuccessResult
	| PasswordResetSessionValidationFailureResult;

export type {
	DateLike,
	AsyncGetCookie,
	Organization,
	User,
	DBSession,
	ClientSession,
	SessionWithUser,
	ValidSessionResult,
	InvalidSessionResult,
	SessionValidationResult,
	PasswordResetSession,
	PasswordResetSessionValidationSuccessResult,
	PasswordResetSessionValidationFailureResult,
	PasswordResetSessionValidationResult,
};

type TransactionClient = any;

export interface UserEmailVerificationRequestsProvider {
	/**
	 * Create a new email verification request
	 * @param data - The verification request data
	 * @param data.id - Unique request ID
	 * @param data.userId - User ID
	 * @param data.code - Verification code
	 * @param data.email - Email to verify
	 * @param data.expiresAt - Expiration date
	 * @param [options] - Additional options (e.g. transaction)
	 */
	createOne: (
		data: {
			id?: string;
			userId: string;
			code: string;
			email: string;
			expiresAt: DateLike;
		},
		options?: { tx?: TransactionClient },
	) => Promise<EmailVerificationRequest | null | undefined>;
	/**
	 * Delete all email verification requests for a user
	 *
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.userId - The user ID to delete requests for
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<void>}
	 */
	deleteOneByUserId: (
		props: { where: { userId: string; email: string } },
		options?: { tx?: TransactionClient },
	) => Promise<void>;
	/**
	 * Find an email verification request by user ID and request ID
	 * @param userId - The user ID
	 * @param id - The request ID
	 * @returns {Promise<void>}
	 */
	findOneByIdAndUserId: (userId: string, id: string) => Promise<EmailVerificationRequest | null>;
}

export interface PasswordResetSessionsProvider {
	/**
	 * Create a new password reset session
	 *
	 * @param props - The parameters
	 * @param props.data - The password reset session data
	 * @param props.data.id - Unique session ID
	 * @param props.data.userId - User ID
	 * @param props.data.email - User's email
	 * @param props.data.code - Reset verification code
	 * @param {DateLike | null} props.data.emailVerifiedAt - Email verification timestamp
	 * @param {DateLike | null} props.data.twoFactorVerifiedAt - 2FA verification timestamp
	 * @param props.data.expiresAt - Session expiration date
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<PasswordResetSession | null>} The created password reset session
	 */
	createOne: (
		props: { data: Omit<PasswordResetSession, "id"> & { id?: PasswordResetSession["id"] } },
		options?: { tx?: TransactionClient },
	) => Promise<PasswordResetSession | null>;
	/**
	 * Find a password reset session with associated user data
	 * @param sessionId - The password reset session ID
	 * @returns {Promise<PasswordResetSessionValidationResult>} Session and user data, or null values if not found
	 */
	findOneWithUser: (
		sessionId: string,
	) => Promise<{ session: PasswordResetSession; user: User } | { session: null; user: null }>;
	/**
	 * Delete a specific password reset session
	 * @param sessionId - The password reset session ID to delete
	 * @returns {Promise<void>}
	 */
	deleteOne: (sessionId: string) => Promise<void>;
	/**
	 * Mark a password reset session as email-verified
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.sessionId - The session ID to update
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<PasswordResetSession | undefined | null>}
	 */
	markOneEmailAsVerified: (
		props: { where: { id: string } },
		options?: { tx?: TransactionClient },
	) => Promise<PasswordResetSession | undefined | null>;
	/**
	 * Mark a password reset session as 2FA-verified
	 * @param sessionId - The password reset session ID
	 * @returns {Promise<PasswordResetSession | undefined | null>}
	 */
	markOneTwoFactorAsVerified: (
		sessionId: string,
	) => Promise<PasswordResetSession | undefined | null>;
	/**
	 * Delete all password reset sessions for a specific user
	 *
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.userId - The user ID to delete sessions for
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<void>}
	 * @description Useful for cleanup when user successfully resets password or for security purposes
	 */
	deleteAllByUserId: (
		props: { where: { userId: string } },
		options?: { tx?: TransactionClient },
	) => Promise<void>;
}
export interface UsersProvider {
	/**
	 * Create a new user
	 * @param values - User data
	 * @param values.email - User's email address
	 * @param values.name - User's display name
	 * @param values.passwordHash - Hashed password
	 * @param {Uint8Array} values.encryptedRecoveryCode - Encrypted recovery code
	 */
	createOne: (values: {
		id?: string;
		email: string;
		name: string;
		passwordHash: string;
		encryptedRecoveryCode?: Uint8Array;
	}) => Promise<User | null>;
	/**
	 * Find a user by email address
	 * @param email - The email to search for
	 * @returns {Promise<User | null>} The user or null if not found
	 */
	findOneByEmail: (email: string) => Promise<User | null>;
	/**
	 * Find a user by id
	 * @param id - The id to search for
	 * @returns {Promise<User | null>} The user or null if not found
	 */
	findOneById: (id: string) => Promise<User | null>;
	/**
	 * Update user's password
	 *
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.id - The user ID to update
	 * @param props.data - The update data
	 * @param props.data.passwordHash - New hashed password
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<User>} The updated user
	 */
	updateOnePassword: (
		props: { where: { id: string }; data: { passwordHash: string } },
		options?: { tx?: TransactionClient },
	) => Promise<User | null>;
	/**
	 * Update user's email and mark it as verified
	 * @param props - The parameters
	 * @param props.data - The update data
	 * @param props.data.email - New email address
	 * @param props.where - Where conditions
	 * @param props.where.id - The user ID to update
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<User>} The updated user
	 * @description Updates email and automatically sets emailVerifiedAt timestamp
	 */
	updateOneEmailAndVerify: (
		props: { data: { email: string }; where: { id: string } },
		options?: { tx?: TransactionClient },
	) => Promise<User | null>;
	/**
	 * Verify user's email if it matches the provided email
	 * @param {object} props
	 * @param {object} props.where - Where conditions
	 * @param props.where.id - The user ID
	 * @param props.where.email - Email to match against
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<User | null>} The updated user or null if email doesn't match
	 */
	verifyOneEmailIfMatches: (
		props: { where: { id: string; email: string } },
		options?: { tx?: TransactionClient },
	) => Promise<User | null | undefined>;
	/**
	 * Get user's password hash (for verification)
	 * @param id - The user ID
	 * @returns {Promise<string | null>} The password hash or null if not found
	 * @description Used for password verification during login
	 */
	getOnePasswordHash: (id: string) => Promise<string | null>;

	// /**
	//  * Get user's encrypted recovery code (raw)
	//  * @param id - The user ID
	//  * @param {any} [transaction] - Optional database transaction
	//  * @returns {Promise<Uint8Array | null>} The encrypted recovery code bytes
	//  * @description Returns raw encrypted bytes, used for internal operations
	//  */
	// getRecoveryCodeRaw: undefined,

	// /**
	//  * Update user's recovery code
	//  * @param id - The user ID
	//  * @param {Uint8Array} encryptedRecoveryCode - New encrypted recovery code
	//  * @returns {Promise<User>} The updated user
	//  * @example
	//  * ```javascript
	//  * const newRecoveryCode = generateRecoveryCode();
	//  * const encrypted = encrypt(newRecoveryCode);
	//  * await provider.updateRecoveryCode(id, encrypted);
	//  * ```
	//  */
	// updateRecoveryCode: undefined,
	/**
	 * Get user's encrypted recovery code (raw bytes)
	 * @param id - The user ID
	 * @param {any} [transaction] - Optional database transaction
	 * @returns {Promise<Uint8Array | null>} The encrypted recovery code bytes or null
	 * @description Returns raw encrypted bytes from database
	 */
	getOneRecoveryCodeRaw: (id: string, tx?: TransactionClient) => Promise<Uint8Array | null>;
	/**
	 * Get user's decrypted recovery code (plain text)
	 * @param id - The user ID
	 * @returns {Promise<string | null>} The decrypted recovery code or null
	 * @description Returns the recovery code in plain text for verification
	 */
	getOneRecoveryCode: (id: string) => Promise<string | null>;

	/**
	 * Update user's recovery code
	 * @param id - The user ID
	 * @param {Uint8Array} encryptedRecoveryCode - New encrypted recovery code
	 * @returns {Promise<User>} The updated user
	 */
	updateOneRecoveryCode: (id: string, encryptedRecoveryCode: Uint8Array) => Promise<User | null>;
	/**
	 * Update recovery code with verification of current code
	 * @param id - The user ID
	 * @param {Uint8Array} encryptedNewRecoveryCode - New encrypted recovery code
	 * @param {Uint8Array} currentRecoveryCode - Current recovery code for verification
	 * @param {any} [transaction] - Optional database transaction
	 * @returns {Promise<Uint8Array | null>} The new encrypted recovery code or null if current code is invalid
	 * @description Atomically updates recovery code only if current code matches
	 */
	updateOneRecoveryCodeById: (
		id: string,
		encryptedNewRecoveryCode: Uint8Array,
		userRecoveryCode: Uint8Array,
		tx?: TransactionClient,
	) => Promise<Uint8Array | null>;
	/**
	 * Get user's TOTP key (decrypted)
	 * @param id - The user ID
	 * @returns {Promise<Uint8Array | null>} The decrypted TOTP key or null
	 * @description Returns the TOTP secret key for 2FA code generation/verification
	 */
	getOneTOTPKey: (id: string) => Promise<Uint8Array | null>;
	/**
	 * Update user's TOTP key
	 *
	 * @param props - The parameters
	 * @param props.data - The update data
	 * @param {Uint8Array} props.data.totpKey - New encrypted TOTP key
	 * @param props.where - Where conditions
	 * @param props.where.userId - The user ID to update
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<User>} The updated user
	 */
	updateOneTOTPKey: (
		props: { data: { totpKey?: Uint8Array }; where: { id: string } },
		options?: { tx?: TransactionClient },
	) => Promise<User | null>;
	/**
	 * Update user's 2FA enabled status
	 * @param data - Update data
	 * @param {Date | null} data.twoFactorEnabledAt - 2FA enabled timestamp or null to disable
	 * @param {Uint8Array | null} [data.recoveryCode] - Optional new recovery code
	 * @param where - Where conditions
	 * @param where.userId - The user ID
	 * @returns {Promise<User>} The updated user
	 * @description Enables/disables 2FA and optionally updates recovery code
	 */
	updateOne2FAEnabled: (
		data: {
			twoFactorEnabledAt: DateLike | null;
			recoveryCode?: Uint8Array | null;
		},
		where: { userId: string },
	) => Promise<User | null>;
}

export interface CookiesProvider {
	get: (name: string) => string | null | undefined;
	set: (
		name: string,
		value: string,
		options?: {
			expires?: DateLike;
			maxAge?: number;
			path?: string;
			domain?: string;
			secure?: boolean;
			httpOnly?: boolean;
			sameSite?: "lax" | "strict" | "none";
		},
	) => void;
	delete: (
		name: string,
		options?: {
			expires?: DateLike;
			maxAge?: number;
			path?: string;
			domain?: string;
			secure?: boolean;
			httpOnly?: boolean;
			sameSite?: "lax" | "strict" | "none";
		},
	) => void;
}

export interface HeadersProvider {
	get: (name: string) => string | null;
	set(name: string, value: string): void;
	delete: (name: string) => void;
}

export interface SessionsProvider {
	/**
	 * Create a new session
	 * @param props - The parameters
	 * @param props.data - The session data
	 * @param {DateLike | null} [props.data.twoFactorVerifiedAt] - 2FA verification timestamp
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<DBSession | null>} The created session
	 */
	createOne: (
		props: { data: DBSession },
		options?: { tx?: TransactionClient },
	) => Promise<{ session: DBSession; user: User } | null>;
	/**
	 * Find a session by ID with associated user data
	 * @param sessionId - The session ID to find
	 * @returns {Promise<{session: DBSession, user: User}
	 */
	findOneWithUser: (sessionId: string) => Promise<{ session: DBSession; user: User } | null>;
	/**
	 * Extend a session's expiration time
	 * @param sessionId - The session ID to extend
	 * @param {Date} expiresAt - New expiration date
	 * @returns {Promise<DBSession | null>} The updated session
	 * @description Useful for implementing "remember me" functionality or session refresh
	 */
	extendOneExpirationDate: (
		props: { data: { expiresAt: Date }; where: { sessionId: string } },
		options?: { tx?: TransactionClient },
	) => Promise<DBSession | null>;
	/**
	 * Delete a specific session (logout)
	 * @param sessionId - The session ID to delete
	 * @returns {Promise<void>}
	 * @description Invalidates a single session, typically used for logout
	 */
	deleteOneById: (sessionId: string) => Promise<void>;
	/**
	 * Delete all sessions for a user (logout everywhere)
	 *
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.userId - The user ID to delete sessions for
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<void>}
	 * @description Invalidates all sessions for a user, useful for security purposes
	 */
	deleteAllByUserId: (
		props: { where: { userId: string } },
		options?: { tx?: TransactionClient },
	) => Promise<void>;
	/**
	 * Mark a session as 2FA verified
	 *
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.id - The session ID to update
	 * @param [options] - Additional options (e.g. transaction)
	 * @returns {Promise<DBSession | null>} The updated session
	 */
	/**
	 * Delete/revoke a specific refresh token
	 * @param id - Token ID to revoke
	 * @returns {Promise<void>}
	 */
	revokeOneById: (id: string) => Promise<void>;
	/**
	 * Delete/revoke all refresh tokens for a user
	 * @param props - The parameters
	 * @param props.where - Where conditions
	 * @param props.where.userId - User ID
	 * @param {{ tx?: TransactionClient }} [options] - Additional options
	 * @returns {Promise<void>}
	 */
	revokeAllByUserId: (
		props: { where: { userId: string } },
		options?: { tx?: TransactionClient },
	) => Promise<void>;
	isOneRevokedById: (props: { where: { id: string } }) => Promise<boolean>;
	/**
	 * Clean up expired refresh tokens
	 * @returns {Promise<number>} Number of tokens cleaned up
	 */
	cleanupAllExpired: () => Promise<number>;
	markOne2FAVerified: (
		props: { where: { id: string } },
		options?: { tx?: TransactionClient },
	) => Promise<DBSession | null>;
	/**
	 * Remove 2FA verification from all user sessions
	 * @param userId - The user ID
	 * @param {any} [transaction] - Optional database transaction
	 * @returns {Promise<DBSession | null>} The updated session
	 * @description Used when 2FA is disabled or when security requires re-verification
	 */
	unMarkOne2FAForUser: (userId: string, tx?: TransactionClient) => Promise<DBSession | null>;
}

export interface JWTRefreshTokenPayload {
	sessionId: string;
	user: User;
	metadata: SessionMetadata;
}

// Add to your existing types...

export interface JWTProvider {
	// getAccessToken: () => string | null;
	// getRefreshToken: () => string | null;
	// TODO: Add more payload data like the `email`
	// * @param props.data.email - User email
	/**
	 * Create a JWT access token
	 * @param props - The parameters
	 * @param props.data - Token payload data
	 * @param props.data.user
	 * @param [props.data.sessionId] - Optional session ID (for hybrid strategy)
	 * @param [props.data.customClaims] - Additional custom claims
	 * @param [options] - Token options
	 * @param [options.expiresIn] - Expiration time (e.g., "15m", "1h")
	 * @param [options.audience] - Token audience
	 * @param [options.issuer] - Token issuer
	 * @param [options.secret] - JWT secret (defaults to env)
	 * @returns The JWT token string
	 */
	createAccessToken: (
		props: { data: JWTRefreshTokenPayload },
		options?: {
			expiresIn?: number;
			audience?: string | string[];
			issuer?: string;
			secret?: string;
		},
	) => string;

	/**
	 * Create a JWT refresh token (longer-lived)
	 * @param props - The parameters
	 * @param props.data - Token payload data
	 * @param props.data.userId - User ID
	 * @param [props.data.sessionId] - Optional session ID (for hybrid strategy)
	 * @param [props.data.tokenId] - Unique token identifier for revocation
	 * @param [options] - Token options
	 * @param [options.expiresIn] - Expiration time (e.g., "30d", "90d")
	 * @param [options.audience] - Token audience
	 * @param [options.issuer] - Token issuer
	 * @param [options.secret] - JWT secret (defaults to env)
	 * @returns The JWT refresh token string
	 */
	createRefreshToken: (
		props: { data: { user: User; metadata: SessionMetadata; sessionId: string } },
		options?: {
			expiresIn?: number;
			audience?: string | string[];
			issuer?: string;
			secret?: string;
		},
	) => string;

	/**
	 * Verify and decode a JWT token
	 * @param token - The JWT token to verify
	 * @param [options] - Verification options
	 * @param [options.audience] - Expected audience
	 * @param [options.issuer] - Expected issuer
	 * @param [options.secret] - JWT secret (defaults to env)
	 * @param {boolean} [options.ignoreExpiration] - Skip expiration check
	 * @returns {{ exp: number; iat: number; twoFactorVerifiedAt?: number; userId: string; sessionId?: string; } | null}
	 */
	verifyAccessToken: (
		token: string,
		options?: {
			audience?: string | string[];
			issuer?: string;
			secret?: string;
			ignoreExpiration?: boolean;
		},
	) => {
		exp: number;
		iat: number;
		payload: JWTRefreshTokenPayload;
	} | null;

	/**
	 * Verify and decode a JWT token
	 * @param token - The JWT token to verify
	 * @param [options] - Verification options
	 * @param [options.audience] - Expected audience
	 * @param [options.issuer] - Expected issuer
	 * @param [options.secret] - JWT secret (defaults to env)
	 * @param {boolean} [options.ignoreExpiration] - Skip expiration check
	 * @returns {{ exp: number; iat: number; twoFactorVerifiedAt?: number; userId: string; sessionId?: string; } | null}
	 */
	verifyRefreshToken: (
		token: string,
		options?: {
			audience?: string | string[];
			issuer?: string;
			secret?: string;
			ignoreExpiration?: boolean;
		},
	) => {
		exp: number;
		iat: number;
		payload: JWTRefreshTokenPayload;
	} | null;

	// TODO: Add more payload data like the `email`
	// * @param props.data.email - User email
	/**
	 * Create token pair (access + refresh)
	 * @param props - The parameters
	 * @param props.data - Token payload data
	 * @param props.data.user
	 * @param [props.data.sessionId] - Optional session ID
	 * @param [props.data.customClaims] - Additional custom claims
	 * @param [options] - Token options
	 * @returns {{ accessToken: string; refreshToken: string }} Token pair
	 */
	createTokenPair: (
		props: {
			data: JWTRefreshTokenPayload;
		},
		options?: {
			accessTokenExpiry?: number;
			refreshTokenExpiry?: number;
			audience?: string | string[];
			issuer?: string;
		},
	) => { accessToken: string; refreshToken: string };
}

// Add RefreshToken interface
export interface JWTRefreshToken {
	id: string;
	createdAt: DateLike;
	userId: string;
	tokenHash: string;
	expiresAt: DateLike;
	revokedAt?: DateLike | null;
	metadata?: Record<string, any> | null;
	lastUsedAt?: DateLike | null;
}

export interface IdsProvider {
	createOneSync: () => string;
	createOneAsync: () => Promise<string>;
}

/**
 * Strategy can be "session" (default) or "jwt"
 * - "session": Traditional server-side sessions with cookies
 * - "jwt": Stateless JWT tokens (refresh tokens still stored in DB for revocation)
 */
export type AuthStrategy = "session" | "jwt" | "hybrid";

export interface ProvidersInit {
	strategy?: AuthStrategy;
	providers: {
		users: UsersProvider | (() => UsersProvider | Promise<UsersProvider>);
		sessions: SessionsProvider | (() => SessionsProvider | Promise<SessionsProvider>);
		passwordResetSessions:
			| PasswordResetSessionsProvider
			| (() => PasswordResetSessionsProvider | Promise<PasswordResetSessionsProvider>);
		userEmailVerificationRequests:
			| UserEmailVerificationRequestsProvider
			| (() =>
					| UserEmailVerificationRequestsProvider
					| Promise<UserEmailVerificationRequestsProvider>);
	};
	cookies: CookiesProvider | (() => CookiesProvider | Promise<CookiesProvider>);
	headers: HeadersProvider | (() => HeadersProvider | Promise<HeadersProvider>);
	ids: IdsProvider | (() => IdsProvider | Promise<IdsProvider>);
	jwt: JWTProvider | (() => JWTProvider | Promise<JWTProvider>);
}

export interface ActionResultBase<StatusType extends "success" | "error"> {
	type: StatusType;
	statusCode: number;
	message: string;
	messageCode: string;
}

export type ActionResult = ActionResultBase<"error"> | ActionResultBase<"success">;

export type MultiErrorSingleSuccessResponse<
	TErrorObj extends Record<string, ActionResultBase<"error">>,
	TSuccessObj extends Record<string, ActionResultBase<"success">>,
	TData = undefined,
> =
	| TErrorObj[keyof TErrorObj]
	| (TData extends undefined
			? TSuccessObj[keyof TSuccessObj]
			: TSuccessObj[keyof TSuccessObj] & { data: TData });

interface SesHan {
	findOneWithUser: SessionsProvider["findOneWithUser"];
	deleteOneById: SessionsProvider["deleteOneById"];
	extendOneExpirationDate: SessionsProvider["extendOneExpirationDate"];
	revokeOneById: SessionsProvider["revokeOneById"];
	createOne: SessionsProvider["createOne"];
}
interface JWTHan {
	verifyAccessToken?: JWTProvider["verifyAccessToken"];
	createTokenPair?: JWTProvider["createTokenPair"];
	verifyRefreshToken?: JWTProvider["verifyRefreshToken"];
	createAccessToken?: JWTProvider["createAccessToken"];
}

export interface AuthProvidersShape {
	sessions?: Partial<SessionsProvider>;
	jwt?: Partial<JWTProvider>;
	users?: Partial<UsersProvider>;
	passwordResetSession?: Partial<PasswordResetSessionsProvider>;
	userEmailVerificationRequests?: Partial<UserEmailVerificationRequestsProvider>;
}

export type AuthProvidersWithGetSessionProviders<
	CustomAuthProvider extends AuthProvidersShape = object,
> = Omit<CustomAuthProvider, "sessions" | "jwt"> & {
	sessions: CustomAuthProvider["sessions"] extends undefined
		? SesHan
		: CustomAuthProvider["sessions"] & SesHan;
	jwt?: CustomAuthProvider["jwt"] extends undefined ? JWTHan : CustomAuthProvider["jwt"] & JWTHan;
};

export interface AuthProvidersWithGetSessionUtils {
	authStrategy: AuthStrategy;
	cookies: CookiesProvider;
	headers: HeadersProvider;
	// ids: IdsProvider;
	generateRandomId: () => string;
	ipAddress?: string | (() => string | Promise<string>) | undefined | null;
	userAgent?: UserAgent | (() => UserAgent | Promise<UserAgent>) | undefined | null;
	tx: any;
}
