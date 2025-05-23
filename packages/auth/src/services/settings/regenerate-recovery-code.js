import { getCurrentSession } from "#utils/sessions.js";
import { resetUserRecoveryCode } from "#utils/users.js";

export const REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    type: "error",
    statusCode: 401,
    message: "Not authenticated",
    messageCode: "NOT_AUTHENTICATED",
  },
  FORBIDDEN: {
    type: "error",
    statusCode: 403,
    message: "Forbidden",
    messageCode: "FORBIDDEN",
  },
  FORBIDDEN_EMAIL_NOT_VERIFIED: {
    type: "error",
    statusCode: 403,
    message: "Forbidden",
    messageCode: "FORBIDDEN_EMAIL_NOT_VERIFIED",
  },
});

export const REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS = /** @type {const} */ ({
  SUCCESS: {
    type: "success",
    statusCode: 200,
    message: "Recovery code regenerated",
    messageCode: "RECOVERY_CODE_REGENERATED",
  },
});

/**
 * @typedef {typeof REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS[keyof typeof REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS[keyof typeof REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS] & { data: { recoveryCode: string } }} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 * Regenerates the recovery code if the user is authenticated, verified, and meets necessary conditions.
 *
 * @returns {Promise<ActionResult>}
 */
export async function regenerateRecoveryCodeService() {
  const { session, user } = await getCurrentSession();
  if (!session) {
    return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.NOT_AUTHENTICATED;
  }

  if (!user.emailVerifiedAt) {
    return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.FORBIDDEN_EMAIL_NOT_VERIFIED;
  }

  if (!user.twoFactorEnabledAt || !session.twoFactorVerifiedAt) {
    return REGENERATE_RECOVERY_CODE_MESSAGES_ERRORS.FORBIDDEN;
  }

  const recoveryCode = await resetUserRecoveryCode(session.userId);
  return {
    ...REGENERATE_RECOVERY_CODE_MESSAGES_SUCCESS.SUCCESS,
    data: { recoveryCode },
  };
}
