/** @import { MultiErrorSingleSuccessResponse, User } from "#types.ts"; */

import { userProvider } from "#providers/users.js";
import { REGISTER_MESSAGES_ERRORS, REGISTER_MESSAGES_SUCCESS } from "#utils/constants.js";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { verifyPasswordStrength } from "#utils/passwords.js";
import { createSession, generateSessionToken, setSessionTokenCookie } from "#utils/sessions.js";
import { createUser } from "#utils/users.js";
import { z } from "zod";

/**
 * Handles register by deleting the user session and clearing session cookies.
 *
 * @param {unknown} data
 * @returns {Promise<
 *  MultiErrorSingleSuccessResponse<
 *    REGISTER_MESSAGES_ERRORS,
 *    REGISTER_MESSAGES_SUCCESS,
 *    { user: User }
 *  >
 * >}
 */
export async function registerService(data) {
  const input = z
    .object({
      email: z.string().email(),
      name: z.string().min(3).max(32),
      password: z.string().min(8),
      enable2FA: z.preprocess((value) => {
        if (typeof value === "boolean") {
          return value;
        }
        return value === "on";
      }, z.boolean().optional().default(false)),
    })
    .safeParse(data);

  if (!input.success) {
    return REGISTER_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;
  }

  const emailAvailable = await userProvider.findOneByEmail(input.data.email);

  if (emailAvailable) {
    return REGISTER_MESSAGES_ERRORS.EMAIL_ALREADY_REGISTERED;
  }

  const strongPassword = await verifyPasswordStrength(input.data.password);

  if (!strongPassword) {
    return REGISTER_MESSAGES_ERRORS.PASSWORD_TOO_WEAK;
  }

  const user = await createUser(input.data.email, input.data.name, input.data.password);

  const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);

  await sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);

  setEmailVerificationRequestCookie(emailVerificationRequest);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, {
    twoFactorVerifiedAt: null,
  });

  setSessionTokenCookie({
    token: sessionToken,
    expiresAt: session.expiresAt,
  });

  if (user.twoFactorEnabledAt) {
    return REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED;
  }

  // redirect("/auth/2fa/setup");
  // return redirect("/auth/login");
  return {
    ...REGISTER_MESSAGES_SUCCESS.REGISTRATION_SUCCESSFUL,
    data: { user },
  };
}
