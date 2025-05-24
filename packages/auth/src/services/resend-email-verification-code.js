/**
 * @import { SessionValidationResult } from "#types.ts";
 */

// import { cookiesProvider } from "#providers/cookies.js";
import { RESEND_EMAIL_MESSAGES_ERRORS, RESEND_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
  createEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";

/**
 * @typedef {typeof RESEND_EMAIL_MESSAGES_ERRORS[keyof typeof RESEND_EMAIL_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof RESEND_EMAIL_MESSAGES_SUCCESS['VERIFICATION_EMAIL_SENT'] } ActionResultSuccess
 *
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 */

/**
 *
 * @param {{
 *  getCurrentSession: () => Promise<SessionValidationResult>;
 * }} options
 * @returns {Promise<ActionResult>}
 */
export async function resendEmailVerificationCodeService(options) {
  const { session, user } = await options.getCurrentSession();
  if (session === null) {
    return RESEND_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
  }
  if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(options.getCurrentSession);

  if (verificationRequest === null) {
    if (user.emailVerifiedAt) {
      return RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
    }

    verificationRequest = await createEmailVerificationRequest(user.id, user.email);
  } else {
    verificationRequest = await createEmailVerificationRequest(user.id, verificationRequest.email);
  }
  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  setEmailVerificationRequestCookie(verificationRequest);

  return RESEND_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
