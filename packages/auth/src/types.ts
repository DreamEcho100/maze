// import type {
//   EmailVerificationRequest as EmailVerificationRequest,
//   Organization as Organization,
//   PasswordResetSession as PasswordResetSession,
//   Session as Session,
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

type Organization = {
    id: string;
    createdAt: Date;
    updatedAt?: DateLike | null;
    ownerId: string;
};

interface User {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt?: DateLike | null;
    email: string;
    // passwordHash: string;
    emailVerifiedAt?: DateLike | null;
    twoFactorEnabledAt?: DateLike | null;
    // `twoFactorRegisteredAt` is the date when the user registered for 2FA
    // TODO: not handled properly in the code
    twoFactorRegisteredAt?: DateLike | null;
    totpKey?: Buffer | null;
    recoveryCode?: Buffer | null;
    type?: string | null;
    organizationId?: string | null;
    organization?: Organization | null;
}

interface Session {
    id: string;
    createdAt: Date;
    userId: string;
    expiresAt: Date;
    twoFactorVerifiedAt?: DateLike | null;
}

interface SessionWithUser {
  session: Session;
  user: User;
}

interface ValidSessionResult {
  session: Session;
  user: User;
}

interface InvalidSessionResult {
  session: null;
  user: null;
}

type SessionValidationResult = ValidSessionResult | InvalidSessionResult;

interface PasswordResetSession {
    id: string;
    createdAt: Date;
    userId: string;
    expiresAt: Date;
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
  Session,
  SessionWithUser,
  ValidSessionResult,
  InvalidSessionResult,
  SessionValidationResult,
  PasswordResetSession,
  PasswordResetSessionValidationSuccessResult,
  PasswordResetSessionValidationFailureResult,
  PasswordResetSessionValidationResult,
};


  type TransactionClient = any

export interface UserEmailVerificationRequestProvider {
  /**
   * Delete all email verification requests for a user
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  deleteOneByUser: (userId: string) => Promise<void>;
  /**
   * Find an email verification request by user ID and request ID
   * @param {string} userId - The user ID
   * @param {string} id - The request ID
   * @returns {Promise<EmailVerificationRequest | null>}
   */
  findOneByIdAndUserId: (userId: string, id: string) => Promise<EmailVerificationRequest | null>;
  /**
   * Create a new email verification request
   * @param {Object} data - The verification request data
   * @param {string} data.id - Unique request ID
   * @param {string} data.userId - User ID
   * @param {string} data.code - Verification code
   * @param {string} data.email - Email to verify
   * @param {DateLike} data.expiresAt - Expiration date
   */
  createOne: (data: {
      id: string;
      userId: string;
      code: string;
      email: string;
      expiresAt: DateLike;
  }) => Promise<EmailVerificationRequest>;
}


export interface PasswordResetSessionProvider {
  /**
   * Create a new password reset session
   * @param {Object} data - The password reset session data
   * @param {string} data.id - Unique session ID
   * @param {string} data.userId - User ID
   * @param {string} data.email - User's email
   * @param {string} data.code - Reset verification code
   * @param {DateLike | null} data.emailVerifiedAt - Email verification timestamp
   * @param {DateLike | null} data.twoFactorVerifiedAt - 2FA verification timestamp
   * @param {DateLike} data.expiresAt - Session expiration date
   * @returns {Promise<PasswordResetSession>} The created password reset session
   */
  createOne: (data: PasswordResetSession) => Promise<PasswordResetSession>;
  /**
   * Find a password reset session with associated user data
   * @param {string} sessionId - The password reset session ID
   * @returns {Promise<PasswordResetSessionValidationResult>} Session and user data, or null values if not found
   */
  findOneWithUser: (
    sessionId: string,
  ) => Promise<{ session: PasswordResetSession; user: User } | { session: null; user: null }>;
  /**
   * Delete a specific password reset session
   * @param {string} sessionId - The password reset session ID to delete
   * @returns {Promise<void>}
   */
  deleteOne: (sessionId: string) => Promise<void>;
  /**
   * Mark a password reset session as email-verified
   * @param {string} sessionId - The password reset session ID
   * @returns {Promise<void>}
   */
  markEmailVerified: (sessionId: string) => Promise<void>;
  /**
   * Mark a password reset session as 2FA-verified
   * @param {string} sessionId - The password reset session ID
   * @returns {Promise<void>}
   */
  mark2FAVerified: (sessionId: string) => Promise<void>;
  /**
   * Delete all password reset sessions for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   * @description Useful for cleanup when user successfully resets password or for security purposes
   */
  deleteAllByUserId: (userId: string) => Promise<void>;
};


export interface SessionProvider {
  /**
   * Create a new session
   * @param {Object} data - The session data
   * @param {string} data.id - Unique session ID
   * @param {string} data.userId - User ID
   * @param {DateLike} data.expiresAt - Session expiration date
   * @param {DateLike | null} [data.twoFactorVerifiedAt] - 2FA verification timestamp
   * @returns {Promise<Session>} The created session
   */
  createOne: (session: Session) => Promise<Session>;
  /**
   * Find a session by ID with associated user data
   * @param {string} sessionId - The session ID to find
   * @returns {Promise<{session: Session, user: User}
   */
  findOneWithUser: (sessionId: string) => Promise<{ session: Session; user: User } | null>;
  /**
   * Extend a session's expiration time
   * @param {string} sessionId - The session ID to extend
   * @param {Date} expiresAt - New expiration date
   * @returns {Promise<Session>} The updated session
   * @description Useful for implementing "remember me" functionality or session refresh
   */
  extendExpirationDate: (sessionId: string, expiresAt: Date) => Promise<Session>;
  /**
   * Delete a specific session (logout)
   * @param {string} sessionId - The session ID to delete
   * @returns {Promise<void>}
   * @description Invalidates a single session, typically used for logout
   */
  deleteById: (sessionId: string) => Promise<void>;
  /**
   * Delete all sessions for a user (logout everywhere)
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   * @description Invalidates all sessions for a user, useful for security purposes
   */
  invalidateAllByUserId: (userId: string) => Promise<void>;
  /**
   * Mark a session as 2FA verified
   * @param {string} sessionId - The session ID
   * @returns {Promise<void>}
   */
  markOne2FAVerified: (sessionId: string) => Promise<void>;
  /**
   * Remove 2FA verification from all user sessions
   * @param {string} userId - The user ID
   * @param {any} [transaction] - Optional database transaction
   * @returns {Promise<void>}
   * @description Used when 2FA is disabled or when security requires re-verification
   */
  unMarkOne2FAForUser: (userId: string, tx?: any) => Promise<void>;
}


export interface UserProvider {
  /**
   * Create a new user
   * @param {string} email - User's email address
   * @param {string} name - User's display name
   * @param {string} passwordHash - Hashed password
   * @param {Uint8Array} encryptedRecoveryCode - Encrypted recovery code
   */
  createOne: (email: string, name: string, passwordHash: string, encryptedRecoveryCode: Uint8Array) => Promise<User>;
  /**
   * Find a user by email address
   * @param {string} email - The email to search for
   * @returns {Promise<User | null>} The user or null if not found
   */
  findOneByEmail: (email: string) => Promise<User | null>;
  /**
   * Update user's password
   * @param {string} userId - The user ID
   * @param {string} passwordHash - New hashed password
   * @returns {Promise<User>} The updated user
   */
  updateOnePassword: (userId: string, passwordHash: string) => Promise<User>;
  /**
   * Update user's email and mark it as verified
   * @param {string} userId - The user ID
   * @param {string} email - New email address
   * @returns {Promise<User>} The updated user
   * @description Updates email and automatically sets emailVerifiedAt timestamp
   */
  updateEmailAndVerify: (userId: string, email: string) => Promise<User>;
  /**
   * Verify user's email if it matches the provided email
   * @param {string} userId - The user ID
   * @param {string} email - Email to match against
   * @returns {Promise<User | null>} The updated user or null if email doesn't match
   */
  verifyOneEmailIfMatches: (userId: string, email: string) => Promise<User | null | undefined>;
  /**
   * Get user's password hash (for verification)
   * @param {string} userId - The user ID
   * @returns {Promise<string | null>} The password hash or null if not found
   * @description Used for password verification during login
   */
  getOnePasswordHash: (userId: string) => Promise<string | null>;


  // /**
  //  * Get user's encrypted recovery code (raw)
  //  * @param {string} userId - The user ID
  //  * @param {any} [transaction] - Optional database transaction
  //  * @returns {Promise<Uint8Array | null>} The encrypted recovery code bytes
  //  * @description Returns raw encrypted bytes, used for internal operations
  //  */
  // getRecoveryCodeRaw: undefined,

  // /**
  //  * Update user's recovery code
  //  * @param {string} userId - The user ID
  //  * @param {Uint8Array} encryptedRecoveryCode - New encrypted recovery code
  //  * @returns {Promise<User>} The updated user
  //  * @example
  //  * ```javascript
  //  * const newRecoveryCode = generateRecoveryCode();
  //  * const encrypted = encrypt(newRecoveryCode);
  //  * await provider.updateRecoveryCode(userId, encrypted);
  //  * ```
  //  */
  // updateRecoveryCode: undefined,
  /**
   * Get user's encrypted recovery code (raw bytes)
   * @param {string} userId - The user ID
   * @param {any} [transaction] - Optional database transaction
   * @returns {Promise<Uint8Array | null>} The encrypted recovery code bytes or null
   * @description Returns raw encrypted bytes from database
   */
  getOneRecoveryCodeRaw: (userId: string, tx?: TransactionClient) => Promise<Uint8Array | null>;
  /**
   * Get user's decrypted recovery code (plain text)
   * @param {string} userId - The user ID
   * @returns {Promise<string | null>} The decrypted recovery code or null
   * @description Returns the recovery code in plain text for verification
   */
  getOneRecoveryCode: (userId: string) => Promise<string | null>;

  /**
   * Update user's recovery code
   * @param {string} userId - The user ID
   * @param {Uint8Array} encryptedRecoveryCode - New encrypted recovery code
   * @returns {Promise<User>} The updated user
   */
  updateOneRecoveryCode: (userId: string, encryptedNewRecoveryCode: Uint8Array, userRecoveryCode: Uint8Array, tx?: TransactionClient) => Promise<Uint8Array | null>;
  /**
   * Update recovery code with verification of current code
   * @param {string} userId - The user ID
   * @param {Uint8Array} encryptedNewRecoveryCode - New encrypted recovery code
   * @param {Uint8Array} currentRecoveryCode - Current recovery code for verification
   * @param {any} [transaction] - Optional database transaction
   * @returns {Promise<Uint8Array | null>} The new encrypted recovery code or null if current code is invalid
   * @description Atomically updates recovery code only if current code matches
   */
  updateOneRecoveryCodeByUserId: (userId: string, encryptedRecoveryCode: Uint8Array) => Promise<User>;
  /**
   * Get user's TOTP key (decrypted)
   * @param {string} userId - The user ID
   * @returns {Promise<Uint8Array | null>} The decrypted TOTP key or null
   * @description Returns the TOTP secret key for 2FA code generation/verification
   */
  getOneTOTPKey: (userId: string) => Promise<Uint8Array | null>;
  /**
   * Update user's TOTP key
   * @param {string} userId - The user ID
   * @param {Uint8Array} encryptedKey - New encrypted TOTP key
   * @returns {Promise<User>} The updated user
   */
  updateOneTOTPKey: (userId: string, encryptedKey: Uint8Array) => Promise<User>;
  /**
   * Update user's 2FA enabled status
   * @param {Object} data - Update data
   * @param {Date | null} data.twoFactorEnabledAt - 2FA enabled timestamp or null to disable
   * @param {Uint8Array | null} [data.recoveryCode] - Optional new recovery code
   * @param {Object} where - Where conditions
   * @param {string} where.userId - The user ID
   * @returns {Promise<User>} The updated user
   * @description Enables/disables 2FA and optionally updates recovery code
   */
  updateOne2FAEnabled: (data: { twoFactorEnabledAt: DateLike | null; recoveryCode?: Uint8Array | null; }, where: { userId: string; }) => Promise<User>;
}

export interface CookiesProvider {
  get: (name: string) => string | null | undefined;
  set: (name: string, value: string, options?: { expires?: DateLike; maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none'; }) => void;
  delete: (name: string) => void;
}

export interface IdsProvider {
  createOneSync: () => string;
  createOneAsync: () => Promise<string>;
}

export interface Providers {
  user: UserProvider;
  session: SessionProvider;
  passwordResetSession: PasswordResetSessionProvider;
  emailVerificationRequest: UserEmailVerificationRequestProvider;
  cookies: CookiesProvider;
  ids: IdsProvider;
}

export interface ActionResultBase<StatusType extends "success" | "error"> {
  type: StatusType;
  statusCode: number;
  message: string;
  messageCode: string;
};

export type ActionResult = ActionResultBase<'error'> | ActionResultBase<'success'>

export type MultiErrorSingleSuccessResponse<
  TErrorObj extends Record<string, ActionResultBase<'error'>>,
  TSuccessObj extends Record<string, ActionResultBase<'success'>>,
  TData extends unknown = undefined
  > = TErrorObj[keyof TErrorObj] | (TData extends undefined ? TSuccessObj[keyof TSuccessObj] : TSuccessObj[keyof TSuccessObj] & { data: TData })