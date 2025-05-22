/**
 * @import { User, Session, EmailVerificationRequest, PasswordResetSession, DateLike } from "#types.ts";
 */

import { dateLikeToDate } from "./dates.js";

/**
 * Transform a database user to a session user.
 * @param {Omit<User, 'emailVerifiedAt'|'passwordHash'|'recoveryCode'> & Partial<Pick<User, 'passwordHash'|'recoveryCode'>> & { twoFactorRegisteredAt?: DateLike; emailVerifiedAt: User['emailVerifiedAt'] }} dbUser
 * @returns {User}
 */
export function transformDbUserToUser(dbUser) {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    emailVerifiedAt: dbUser.emailVerifiedAt && dateLikeToDate(dbUser.emailVerifiedAt),
    twoFactorRegisteredAt:
      dbUser.twoFactorRegisteredAt && dateLikeToDate(dbUser.twoFactorRegisteredAt),
    twoFactorEnabledAt: dbUser.twoFactorEnabledAt && dateLikeToDate(dbUser.twoFactorEnabledAt),
    createdAt: dateLikeToDate(dbUser.createdAt),
    updatedAt: dbUser.updatedAt && dateLikeToDate(dbUser.updatedAt),
    organizationId: dbUser.organizationId,
    type: dbUser.type,
    organization: dbUser.organization && {
      ...dbUser.organization,
      // totalSales: dbUser.organization.totalSales.toString(),
    },
  };
}

/**
 * Transform a db session to a session.
 * @param {Session} dbSession
 * @returns {Session}
 */
export function transformDbSessionToSession(dbSession) {
  return {
    id: dbSession.id,
    userId: dbSession.userId,
    twoFactorVerifiedAt:
      dbSession.twoFactorVerifiedAt && dateLikeToDate(dbSession.twoFactorVerifiedAt),
    expiresAt: dateLikeToDate(dbSession.expiresAt),
    createdAt: dateLikeToDate(dbSession.createdAt),
  };
}

/**
 * Transform a db email verification request to an email verification request.
 * @param {EmailVerificationRequest} dbEmailVerificationRequest
 * @returns {EmailVerificationRequest}
 */
export function transformDbEmailVerificationRequestToEmailVerificationRequest(
  dbEmailVerificationRequest,
) {
  return {
    id: dbEmailVerificationRequest.id,
    email: dbEmailVerificationRequest.email,
    code: dbEmailVerificationRequest.code,
    userId: dbEmailVerificationRequest.userId,
    expiresAt: dateLikeToDate(dbEmailVerificationRequest.expiresAt),
    createdAt: dateLikeToDate(dbEmailVerificationRequest.createdAt),
  };
}

/**
 * Transform a db password reset session to a password reset session.
 * @param {PasswordResetSession} dbPasswordResetSession
 * @returns {PasswordResetSession}
 */
export function transformDbPasswordResetSessionToPasswordResetSession(dbPasswordResetSession) {
  return {
    id: dbPasswordResetSession.id,
    userId: dbPasswordResetSession.userId,
    emailVerifiedAt:
      dbPasswordResetSession.emailVerifiedAt &&
      dateLikeToDate(dbPasswordResetSession.emailVerifiedAt),
    twoFactorVerifiedAt:
      dbPasswordResetSession.twoFactorVerifiedAt &&
      dateLikeToDate(dbPasswordResetSession.twoFactorVerifiedAt),
    expiresAt: dateLikeToDate(dbPasswordResetSession.expiresAt),
    code: dbPasswordResetSession.code,
    email: dbPasswordResetSession.email,
    createdAt: dateLikeToDate(dbPasswordResetSession.createdAt),
  };
}
