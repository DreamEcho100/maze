// import type {
//   EmailVerificationRequest as EmailVerificationRequest,
//   Organization as Organization,
//   PasswordResetSession as PasswordResetSession,
//   Session as Session,
//   User as User,
// } from "@prisma/client";


type DateLike = string | number | Date;
type SetCookie = (name: string, value: string, options: object) => void;
type GetCookie = (name: string) => string | null | undefined;
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
  SetCookie,
  GetCookie,
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
    deleteOne: (userId: string) => Promise<void>;
    getOne: (userId: string, id: string) => Promise<EmailVerificationRequest | null>;
    createOne: (data: {
        id: string;
        userId: string;
        code: string;
        email: string;
        expiresAt: DateLike;
    }) => Promise<EmailVerificationRequest>;
}


export interface PasswordResetSessionProvider {
  createOne: (data: PasswordResetSession) => Promise<PasswordResetSession>;
  getOneWithUser: (
    sessionId: string,
  ) => Promise<{ session: PasswordResetSession; user: User } | { session: null; user: null }>;
  deleteOne: (sessionId: string) => Promise<void>;
  updateOneSessionAsEmailVerified: (sessionId: string) => Promise<void>;
  updateOneSessionAs2FAVerified: (sessionId: string) => Promise<void>;
  deleteAllSessionsForUser: (userId: string) => Promise<void>;
};


export interface SessionProvider {
  createOne: (session: Session) => Promise<Session>;
  findOneById: (sessionId: string) => Promise<{ session: Session; user: User } | null>;
  updateSessionExpirationById: (sessionId: string, expiresAt: Date) => Promise<Session>;
  deleteSessionById: (sessionId: string) => Promise<void>;
  invalidateUserSessions: (userId: string) => Promise<void>;
  setSessionAs2FAVerified: (sessionId: string) => Promise<void>;
  setAllSessionsAsNot2FAVerified: (userId: string, tx?: any) => Promise<void>;
}


export interface UserProvider {
  createOne: (email: string, name: string, passwordHash: string, encryptedRecoveryCode: Uint8Array) => Promise<User>;
  updateOnePassword: (userId: string, passwordHash: string) => Promise<User>;
  updateOneEmailAndSetEmailAsVerified: (userId: string, email: string) => Promise<User>;
  getOnePasswordHash: (userId: string) => Promise<string | null>;
  getOneRecoveryCode: (userId: string) => Promise<Uint8Array | null>;
  getOneTOTPKey: (userId: string) => Promise<Uint8Array | null>;
  updateOneTOTPKey: (userId: string, encryptedKey: Uint8Array) => Promise<User>;
  getOneUserRecoveryCode: (userId: string, tx?: TransactionClient) => Promise<Uint8Array | null | undefined>;
  updateOneUserRecoveryCode: (userId: string, encryptedNewRecoveryCode: Uint8Array, userRecoveryCode: Uint8Array, tx?: TransactionClient) => Promise<Uint8Array | null>;
  updateOneRecoveryCodeByUser: (userId: string, encryptedRecoveryCode: Uint8Array) => Promise<User>;
  setUserAsEmailVerifiedIfEmailMatches: (userId: string, email: string) => Promise<User | null | undefined>;
  getOneByEmail: (email: string) => Promise<User | null>;
  updateUserTwoFactorEnabled: (data: { twoFactorEnabledAt: DateLike | null; recoveryCode?: Uint8Array | null; }, where: { userId: string; }) => Promise<User>;
}

export interface CookiesProvider {
  get: (name: string) => string | null | undefined;
  set: (name: string, value: string, options?: { expires?: DateLike; maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none'; }) => void;
  delete: (name: string) => void;
}

export interface IdsProvider {
  createOne: () => string | Promise<string>;
}

export interface Providers {
  user: UserProvider;
  session: SessionProvider;
  passwordResetSession: PasswordResetSessionProvider;
  emailVerificationRequest: UserEmailVerificationRequestProvider;
  cookies: CookiesProvider;
  ids: IdsProvider;
}