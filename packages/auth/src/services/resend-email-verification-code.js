/**
 * @import { SessionValidationResult } from "#types.ts";
 */

import { cookiesProvider } from "#providers/cookies.js";
import { RESEND_EMAIL_MESSAGES_ERRORS, RESEND_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
  createEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";

/**
 * @typedef {{ type: 'error'; statusCode: typeof RESEND_EMAIL_MESSAGES_ERRORS[keyof typeof RESEND_EMAIL_MESSAGES_ERRORS]["statusCode"]; message: string; messageCode: typeof RESEND_EMAIL_MESSAGES_ERRORS[keyof typeof RESEND_EMAIL_MESSAGES_ERRORS]["code"] }} ActionResultError
 * @typedef {{ type: 'success'; statusCode: typeof RESEND_EMAIL_MESSAGES_SUCCESS[keyof typeof RESEND_EMAIL_MESSAGES_SUCCESS]["statusCode"]; message: string; messageCode: typeof RESEND_EMAIL_MESSAGES_SUCCESS[keyof typeof RESEND_EMAIL_MESSAGES_SUCCESS]["code"] }} ActionResultSuccess
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
    return {
      message: "Not authenticated",
      messageCode: RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.code,
      type: "error",
      statusCode: RESEND_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED.statusCode,
    };
  }
  if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return {
      message: "Forbidden",
      messageCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code,
      type: "error",
      statusCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.statusCode,
    };
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(options.getCurrentSession);

  if (verificationRequest === null) {
    if (user.emailVerifiedAt) {
      return {
        message: "Forbidden",
        messageCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.code,
        type: "error",
        statusCode: RESEND_EMAIL_MESSAGES_ERRORS.FORBIDDEN.statusCode,
      };
    }

    verificationRequest = await createEmailVerificationRequest(user.id, user.email);
  } else {
    verificationRequest = await createEmailVerificationRequest(user.id, verificationRequest.email);
  }
  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  setEmailVerificationRequestCookie(verificationRequest);

  return {
    message: "A new code was sent to your inbox.",
    messageCode: RESEND_EMAIL_MESSAGES_SUCCESS.EMAIL_SENT.code,
    type: "success",
    statusCode: RESEND_EMAIL_MESSAGES_SUCCESS.EMAIL_SENT.statusCode,
  };
}
