/** @import { MultiErrorSingleSuccessResponse } from "#types.ts" */

import { userProvider } from "#providers/users.js";
import { UPDATE_EMAIL_MESSAGES_ERRORS, UPDATE_EMAIL_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getCurrentSession } from "#utils/sessions.js";
import { z } from "zod";

/**
 * Handles updating a user's email by validating input and creating a verification request.
 *
 * @param {string} email New email address to set for the user
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    UPDATE_EMAIL_MESSAGES_ERRORS,
 *    UPDATE_EMAIL_MESSAGES_SUCCESS
 *  >
 * >}
 */
export async function updateEmailService(email) {
  const input = z.string().email().safeParse(email);
  if (!input.success) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_REQUIRED;

  const validatedEmail = input.data;

  const { session, user } = await getCurrentSession();
  if (!session) return UPDATE_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED;

  if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return UPDATE_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_OR_VERIFICATION_REQUIRED;
  }

  // const emailAvailable = await getUserByEmailRepository(validatedEmail);
  const emailAvailable = await userProvider.findOneByEmail(validatedEmail);
  if (emailAvailable) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;

  const verificationRequest = await createEmailVerificationRequest(user.id, validatedEmail);
  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  setEmailVerificationRequestCookie(verificationRequest);

  return UPDATE_EMAIL_MESSAGES_SUCCESS.VERIFICATION_EMAIL_SENT;
}
