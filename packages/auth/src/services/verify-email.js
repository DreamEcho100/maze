/** @import { SessionValidationResult, MultiErrorSingleSuccessResponse } from "#types.ts"; */
import { passwordResetSessionProvider } from "#providers/password-reset.js";
import { userProvider } from "#providers/users.js";
import { VERIFY_EMAIL_MESSAGES_ERRORS, VERIFY_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import { dateLikeToNumber } from "#utils/dates.js";
import {
  createEmailVerificationRequest,
  deleteEmailVerificationRequestCookie,
  deleteUserEmailVerificationRequest,
  getUserEmailVerificationRequestFromRequest,
  sendVerificationEmail,
} from "#utils/email-verification.js";
import { getCurrentSession } from "#utils/sessions.js";
import { z } from "zod";

/**
 *
 * @param {unknown} data
 * @param {{
 *  getCurrentSession: () => Promise<SessionValidationResult>;
 * }} options
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    VERIFY_EMAIL_MESSAGES_ERRORS,
 *    VERIFY_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function verifyEmailUserService(data, options) {
  const input = z
    .object({
      code: z.string().min(6),
    })
    .safeParse(data);

  if (!input.success) {
    return VERIFY_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const { session, user } = await getCurrentSession();
  if (session === null) {
    return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
  }

  if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED;
  }

  let verificationRequest = await getUserEmailVerificationRequestFromRequest(options.getCurrentSession);
  if (verificationRequest === null) {
    return VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;
  }

  if (Date.now() >= dateLikeToNumber(verificationRequest.expiresAt)) {
    verificationRequest = await createEmailVerificationRequest(
      verificationRequest.userId,
      verificationRequest.email,
    );
    await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
    return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_EXPIRED;
  }
  if (verificationRequest.code !== input.data.code) {
    return VERIFY_EMAIL_MESSAGES_ERRORS.VERIFICATION_CODE_INVALID;
  }

  await Promise.all([
    deleteUserEmailVerificationRequest(user.id),
    passwordResetSessionProvider.deleteAllByUserId(user.id),
    userProvider.updateEmailAndVerify(user.id, verificationRequest.email),
  ]);

  deleteEmailVerificationRequestCookie();

  if (user.twoFactorEnabledAt && !user.twoFactorRegisteredAt) {
    // return redirect("/2fa/setup");
    return VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE;
  }

  return VERIFY_EMAIL_MESSAGES_SUCCESS.EMAIL_VERIFIED_SUCCESSFULLY;
  // return redirect("/");
}
